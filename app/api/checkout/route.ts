import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

// --- 1. INPUT VALIDATION (ZOD SCHEMA) ---
const checkoutSchema = z.object({
  addressId: z.string().uuid("Geçersiz adres ID'si."),
  
  // BURASI DÜZELTİLDİ: İkinci parametre tamamen kaldırıldı, sadece enum dizisi bırakıldı.
  paymentMethod: z.enum(["credit_card", "havale", "kapida"]),
  
  items: z.array(
    z.object({
      id: z.string().uuid("Geçersiz ürün ID'si."),
      quantity: z.number().int().positive("Adet sayısı en az 1 olmalıdır."),
    })
  ).nonempty("Sepetiniz boş olamaz."),
  totalPrice: z.number().optional(), 
  couponCode: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // --- 2. KİMLİK DOĞRULAMA (CLERK) ---
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Siparişi tamamlamak için giriş yapmalısınız." }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: clerkUser.emailAddresses[0].emailAddress },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "Kullanıcı kaydı bulunamadı." }, { status: 404 });
    }

    // --- 3. VERİ DOĞRULAMA (ZOD) ---
    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz veri formatı.", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { addressId, paymentMethod, items, couponCode } = validation.data;

    // --- 4. GÜVENLİK DUVARI (IDOR KONTROLÜ) ---
    // Seçilen adresin bu kullanıcıya ait olduğundan emin oluyoruz
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== dbUser.id) {
      return NextResponse.json({ error: "Geçersiz veya yetkisiz adres seçimi." }, { status: 403 });
    }

    // --- 5. ATOMİK VERİTABANI İŞLEMİ (TRANSACTION) ---
    const order = await prisma.$transaction(async (tx) => {
      let calculatedTotalPrice = 0;
      const orderItemsToCreate = [];

      // A. FRONTEND'E GÜVENMEME (BACKEND PRICE VALIDATION & STOK KONTROLÜ)
      for (const item of items) {
        const dbProduct = await tx.product.findUnique({
          where: { id: item.id },
        });

        if (!dbProduct) {
          throw new Error(`Ürün veritabanında bulunamadı: ${item.id}`);
        }

        if (dbProduct.stock < item.quantity) {
          throw new Error(`Yetersiz stok: ${dbProduct.name} (Kalan: ${dbProduct.stock})`);
        }

        // Fiyatı tamamen backend'deki veritabanı fiyatından hesaplıyoruz
        const itemPrice = dbProduct.price;
        const subTotal = itemPrice * item.quantity;
        calculatedTotalPrice += subTotal;

        orderItemsToCreate.push({
          productId: dbProduct.id,
          quantity: item.quantity,
          price: itemPrice, // Sipariş anındaki güncel DB fiyatı kilitleniyor
        });
      }

      // B. KUPON VE İNDİRİM HESAPLAMASI
      let discount = 0;
      if (couponCode && couponCode.toUpperCase() === "YAZ2026") {
        discount = calculatedTotalPrice * 0.1; // %10 İndirim
      }

      // C. KARGO ÜCRETİ HESAPLAMASI
      const shippingCost = calculatedTotalPrice > 5000 ? 0 : 149.99;
      
      // Kapıda ödeme seçildiyse +29.90 TL hizmet bedeli ekliyoruz
      const paymentFee = paymentMethod === "kapida" ? 29.90 : 0;
      
      const finalTotalPrice = calculatedTotalPrice + shippingCost + paymentFee - discount;

      // D. SİPARİŞ KAYDI (ORDER)
      const newOrder = await tx.order.create({
        data: {
          totalPrice: finalTotalPrice,
          status: "PENDING",
          userId: dbUser.id,
          addressId: address.id,
          items: {
            create: orderItemsToCreate,
          },
        },
      });

      // E. ÖDEME KAYDI (PAYMENT)
      const paymentStatus = paymentMethod === "credit_card" ? "COMPLETED" : "PENDING";
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          method: paymentMethod,
          status: paymentStatus,
          paidAt: paymentMethod === "credit_card" ? new Date() : null,
        },
      });

      // F. KARGO KAYDI (SHIPMENT)
      await tx.shipment.create({
        data: {
          orderId: newOrder.id,
          company: "Yurtiçi Kargo", 
        },
      });

      // G. STOK DÜŞME VE SATIŞ SAYACI ARTTIRMA
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: { decrement: item.quantity },
            salesCount: { increment: item.quantity },
          },
        });
      }

      // H. SEPETİ TEMİZLEME (Backend tarafında da sepeti boşaltıyoruz)
      const userCart = await tx.cart.findUnique({ where: { userId: dbUser.id } });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      return newOrder;
    });

    return NextResponse.json({ success: true, orderId: order.id }, { status: 200 });

  } catch (error: any) {
    // --- 6. SECURE ERROR HANDLING ---
    console.error("GÜVENLİ LOGLAMA - Sipariş Oluşturma Hatası:", error);

    // Kendi fırlattığımız "Yetersiz stok" gibi mantıksal hataları kullanıcıya göster,
    // DB bağlantı kopması gibi kritik hataları "Sipariş işlenirken bir hata oluştu" diye gizle.
    const errorMessage = error instanceof Error ? error.message : "Siparişiniz işlenirken sistemsel bir hata oluştu.";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}