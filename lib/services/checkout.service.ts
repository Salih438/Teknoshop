import { prisma } from "@/lib/prisma";

export class CheckoutError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = "CheckoutError";
  }
}

interface CheckoutPayload {
  userId: string;
  addressId: string;
  paymentMethodId: string; // 🚀 DEĞİŞTİ: Artık statik string değil, veritabanı ID'si alıyoruz
  items: { id: string; quantity: number }[];
  couponCode?: string;
}

export const CheckoutService = {
  async processOrder({ userId, addressId, paymentMethodId, items, couponCode }: CheckoutPayload) {
    
    // GÜVENLİK DUVARI (IDOR KONTROLÜ)
    const address = await prisma.address.findUnique({ 
      where: { id: addressId },
      select: { id: true, userId: true }
    });
    
    if (!address || address.userId !== userId) {
      throw new CheckoutError("Geçersiz veya yetkisiz adres seçimi.", 403);
    }

    // ATOMİK VERİTABANI İŞLEMİ (TRANSACTION)
    return await prisma.$transaction(async (tx) => {
      let calculatedTotalPrice = 0;
      const orderItemsToCreate = [];

      for (const item of items) {
        const dbProduct = await tx.product.findUnique({ where: { id: item.id } });

        if (!dbProduct) throw new CheckoutError(`Ürün bulunamadı: ${item.id}`, 404);
        if (dbProduct.stock < item.quantity) throw new CheckoutError(`Yetersiz stok: ${dbProduct.name}`, 409);

        const subTotal = dbProduct.price * item.quantity;
        calculatedTotalPrice += subTotal;
        orderItemsToCreate.push({ productId: dbProduct.id, quantity: item.quantity, price: dbProduct.price });
      }

      // KUPON HESAPLAMASI
      let discount = 0;
      if (couponCode) {
        const dbCoupon = await tx.coupon.findUnique({
          where: { code: couponCode.toUpperCase() }
        });

        if (!dbCoupon) throw new CheckoutError("Girdiğiniz kupon kodu geçersiz.", 404);
        if (!dbCoupon.isActive) throw new CheckoutError("Bu kupon kodu artık aktif değil.", 400);
        if (dbCoupon.expireDate && dbCoupon.expireDate < new Date()) throw new CheckoutError("Bu kuponun kullanım süresi dolmuş.", 400);
        if (dbCoupon.usageLimit && dbCoupon.usedCount >= dbCoupon.usageLimit) throw new CheckoutError("Bu kuponun kullanım limiti dolmuş.", 400);

        discount = (calculatedTotalPrice * dbCoupon.discount) / 100;

        await tx.coupon.update({
          where: { id: dbCoupon.id },
          data: { usedCount: { increment: 1 } }
        });
      }

      // 🚀 YENİ: DİNAMİK ÖDEME YÖNTEMİ KONTROLÜ
      const paymentMethod = await tx.paymentMethod.findUnique({ 
        where: { id: paymentMethodId } 
      });

      if (!paymentMethod || !paymentMethod.isActive) {
        throw new CheckoutError("Seçilen ödeme yöntemi geçersiz veya pasif duruma alınmış.", 400);
      }

      // ÜCRETLER (Dinamik Fee Eklendi)
      const shippingCost = calculatedTotalPrice > 5000 ? 0 : 149.99;
      const paymentFee = paymentMethod.fee; // Veritabanından gelen dinamik ek ücret (örn: 29.90)
      const finalTotalPrice = calculatedTotalPrice + shippingCost + paymentFee - discount;

      // SİPARİŞ OLUŞTURMA
      const newOrder = await tx.order.create({
        data: {
          totalPrice: finalTotalPrice,
          status: "PENDING",
          userId,
          addressId: address.id,
          items: { create: orderItemsToCreate },
        },
      });

      // ÖDEME KAYDI
      const isCreditCard = paymentMethod.type === "CREDIT_CARD";
      await tx.payment.create({
        data: { 
          orderId: newOrder.id, 
          paymentMethodId: paymentMethod.id, // 🚀 DEĞİŞTİ: Yeni ilişki modeli
          status: isCreditCard ? "COMPLETED" : "PENDING", 
          paidAt: isCreditCard ? new Date() : null 
        },
      });

      // KARGO KAYDI
      await tx.shipment.create({
        data: { orderId: newOrder.id, company: "Yurtiçi Kargo" },
      });

      // STOK DÜŞME
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
        });
      }

      // SEPETİ BOŞALTMA
      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      return newOrder;
    });
  }
};