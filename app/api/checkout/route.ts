// app/api/checkout/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// --- 1. INPUT VALIDATION (ZOD SCHEMA) ---
// API'ye gelen her verinin tipini, uzunluğunu ve mantıksal sınırlarını denetliyoruz
const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(2, "İsim en az 2 karakter olmalıdır.").max(50),
    email: z.string().email("Geçersiz e-posta adresi."),
    phone: z.string().min(10, "Geçersiz telefon numarası.").max(15),
  }),
  address: z.object({
    city: z.string().min(2).max(30),
    district: z.string().min(2).max(30),
    fullAddress: z.string().min(10, "Açık adres çok kısa.").max(250),
  }),
  items: z.array(
    z.object({
      id: z.string().uuid("Geçersiz ürün ID'si."),
      quantity: z.number().int().positive("Adet sayısı 1 veya daha fazla olmalıdır."),
    })
  ).nonempty("Sepetiniz boş olamaz."),
  couponCode: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verileri şemaya göre doğrula (Hatalıysa doğrudan 400 Bad Request fırlatır)
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz veri formatı.", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { customer, address, items, couponCode } = validation.data;

    // Prisma Transaction ile işlemleri atomik ve güvenli hale getiriyoruz
    const order = await prisma.$transaction(async (tx) => {
      let calculatedTotalPrice = 0;
      const orderItemsToCreate = [];

      // --- 2. FRONTEND'E GÜVENMEME (BACKEND PRICE VALIDATION) ---
      for (const item of items) {
        // Ürünün veritabanındaki güncel ve gerçek fiyatını çekiyoruz
        const dbProduct = await tx.product.findUnique({
          where: { id: item.id },
        });

        if (!dbProduct) {
          throw new Error(`Ürün veritabanında bulunamadı: ${item.id}`);
        }

        // Stok Kontrolü
        if (dbProduct.stock < item.quantity) {
          throw new Error(`Yetersiz stok: ${dbProduct.name} (Kalan: ${dbProduct.stock})`);
        }

        // Fiyatı ve toplamı tamamen backend'deki veritabanı fiyatından hesaplıyoruz
        const itemPrice = dbProduct.price;
        const subTotal = itemPrice * item.quantity;
        calculatedTotalPrice += subTotal;

        orderItemsToCreate.push({
          productId: dbProduct.id,
          quantity: item.quantity,
          price: itemPrice, // Client'tan gelen değil, DB'den gelen gerçek fiyat!
        });
      }

      // --- 3. KUPON VE KAMPANYA DOĞRULAMASI ---
      let discount = 0;
      if (couponCode && couponCode.toUpperCase() === "YAZ2026") {
        discount = calculatedTotalPrice * 0.1; // %10 İndirim (Backend hesaplaması)
      }

      // --- 4. KARGO ÜCRETİ HESAPLAMASI ---
      const shippingCost = calculatedTotalPrice > 5000 ? 0 : 149.99;
      const finalTotalPrice = calculatedTotalPrice + shippingCost - discount;

      // 5. Müşteri kontrolü veya kaydı
      let user = await tx.user.findUnique({ where: { email: customer.email } });
      if (!user) {
        user = await tx.user.create({
          data: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            role: "USER",
          },
        });
      }

      // 6. Adres kaydı
      const newAddress = await tx.address.create({
        data: {
          title: "Teslimat Adresi",
          city: address.city,
          district: address.district,
          address: address.fullAddress,
          userId: user.id,
        },
      });

      // 7. Sipariş kaydı
      const newOrder = await tx.order.create({
        data: {
          totalPrice: finalTotalPrice,
          status: "PENDING",
          userId: user.id,
          addressId: newAddress.id,
          items: {
            create: orderItemsToCreate,
          },
        },
      });

      // 8. Stok güncellemesi
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: { decrement: item.quantity },
            salesCount: { increment: item.quantity },
          },
        });
      }

      return newOrder;
    });

    return NextResponse.json({ success: true, orderId: order.id }, { status: 200 });

  } catch (error: any) {
    // --- 5. SECURE ERROR HANDLING ---
    // Veritabanı bağlantı detaylarını veya Prisma hata kodlarını asla dışarı sızdırmıyoruz
    console.error("GÜVENLİ LOGLAMA - Sipariş Oluşturma Hatası:", error);

    return NextResponse.json(
      { error: error.message || "Siparişiniz işlenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}