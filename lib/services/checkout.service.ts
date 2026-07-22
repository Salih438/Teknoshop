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
  paymentMethodId: string;
  items: { id: string; quantity: number; variantId?: string }[];
  couponCode?: string;
}

// Transaction tipini Prisma üzerinden güvenli şekilde çıkarıyoruz
type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// --- YARDIMCI (PRIVATE) FONKSİYONLAR ---

async function validateAddress(tx: TxClient, addressId: string, userId: string) {
  const address = await tx.address.findUnique({
    where: { id: addressId },
    select: { id: true, userId: true },
  });

  if (!address || address.userId !== userId) {
    throw new CheckoutError("Geçersiz veya yetkisiz adres seçimi.", 403);
  }
  return address;
}

async function calculateItemsAndPrice(tx: TxClient, items: CheckoutPayload["items"]) {
  let calculatedTotalPrice = 0;
  const orderItemsToCreate: { productId: string; quantity: number; price: number; variantId?: string }[] = [];

  const itemIds = items.map((item) => item.id);
  const dbProducts = await tx.product.findMany({
    where: { id: { in: itemIds } },
    include: { variants: true },
  });

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  for (const item of items) {
    const dbProduct = productMap.get(item.id);

    if (!dbProduct) throw new CheckoutError(`Ürün bulunamadı: ${item.id}`, 404);

    let stockToCheck = dbProduct.stock;
    let priceToUse = dbProduct.price;
    let variantName = "";

    if (item.variantId) {
      const variant = dbProduct.variants.find((v) => v.id === item.variantId);
      if (!variant) throw new CheckoutError(`Ürünün seçilen varyasyonu bulunamadı: ${item.variantId}`, 404);

      stockToCheck = variant.stock;
      if (variant.price !== null) priceToUse = variant.price;

      const details = [variant.color, variant.storage].filter(Boolean).join(" ");
      if (details) variantName = ` (${details})`;
    }

    if (stockToCheck < item.quantity) throw new CheckoutError(`Yetersiz stok: ${dbProduct.name}${variantName}`, 409);

    const subTotal = priceToUse * item.quantity;
    calculatedTotalPrice += subTotal;
    orderItemsToCreate.push({
      productId: dbProduct.id,
      quantity: item.quantity,
      price: priceToUse,
      ...(item.variantId ? { variantId: item.variantId } : {}),
    });
  }

  return { calculatedTotalPrice, orderItemsToCreate };
}

async function applyCoupon(tx: TxClient, couponCode: string, userId: string, calculatedTotalPrice: number) {
  let discount = 0;
  let appliedCouponId: string | null = null;

  const normalizedCouponCode = couponCode.trim().toUpperCase();
  const dbCoupon = await tx.coupon.findUnique({
    where: { code: normalizedCouponCode },
  });

  if (!dbCoupon) throw new CheckoutError("Girdiğiniz kupon kodu geçersiz.", 404);
  if (!dbCoupon.isActive) throw new CheckoutError("Bu kupon kodu artık aktif değil.", 400);
  if (dbCoupon.expireDate && dbCoupon.expireDate < new Date()) throw new CheckoutError("Bu kuponun kullanım süresi dolmuş.", 400);
  if (dbCoupon.usageLimit && dbCoupon.usedCount >= dbCoupon.usageLimit) throw new CheckoutError("Bu kuponun kullanım limiti dolmuş.", 400);

  if (dbCoupon.minAmount && calculatedTotalPrice < dbCoupon.minAmount) {
    throw new CheckoutError(`Bu kuponu kullanmak için sepet tutarı en az ${dbCoupon.minAmount} TL olmalıdır.`, 400);
  }

  if (dbCoupon.isSingleUse) {
    const existingUsage = await tx.couponUsage.findFirst({
      where: { couponId: dbCoupon.id, userId },
    });
    if (existingUsage) {
      throw new CheckoutError("Bu kupon yalnızca bir kez kullanılabilir ve siz zaten kullandınız.", 400);
    }
  }

  discount = (calculatedTotalPrice * dbCoupon.discount) / 100;
  appliedCouponId = dbCoupon.id;

  await tx.coupon.update({
    where: { id: dbCoupon.id },
    data: { usedCount: { increment: 1 } },
  });

  return { discount, appliedCouponId };
}

async function validatePaymentMethod(tx: TxClient, paymentMethodId: string) {
  const paymentMethod = await tx.paymentMethod.findUnique({
    where: { id: paymentMethodId },
    select: { id: true, fee: true, type: true, isActive: true },
  });

  if (!paymentMethod || !paymentMethod.isActive) {
    throw new CheckoutError("Seçilen ödeme yöntemi geçersiz veya pasif duruma alınmış.", 400);
  }
  return paymentMethod;
}

async function decrementStock(tx: TxClient, items: CheckoutPayload["items"]) {
  for (const item of items) {
    if (item.variantId) {
      // 🚀 GÜVENLİK DUVARI: Varyasyon için Optimistic Locking (Overselling koruması)
      const variantResult = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (variantResult.count === 0) {
        throw new CheckoutError("Satın almaya çalıştığınız ürünün stoku tükendi.", 409);
      }

      const productResult = await tx.product.updateMany({
        where: { id: item.id, stock: { gte: item.quantity } },
        data: { 
          stock: { decrement: item.quantity },
          salesCount: { increment: item.quantity } 
        },
      });
      if (productResult.count === 0) {
        throw new CheckoutError("Satın almaya çalıştığınız ürünün stoku tükendi.", 409);
      }
    } else {
      // 🚀 GÜVENLİK DUVARI: Ana ürün için Optimistic Locking (Overselling koruması)
      const productResult = await tx.product.updateMany({
        where: { id: item.id, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
      });
      if (productResult.count === 0) {
        throw new CheckoutError("Satın almaya çalıştığınız ürünün stoku tükendi.", 409);
      }
    }
  }
}

async function clearCart(tx: TxClient, userId: string) {
  const userCart = await tx.cart.findUnique({ where: { userId } });
  if (userCart) {
    await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
  }
}

// --- ANA SERVİS NESNESİ ---

export const CheckoutService = {
  async processOrder({ userId, addressId, paymentMethodId, items, couponCode }: CheckoutPayload) {
    // ATOMİK VERİTABANI İŞLEMİ (TRANSACTION)
    return await prisma.$transaction(async (tx) => {
      
      // 🚀 YENİ: Mağaza Ayarlarını Veritabanından Dinamik Olarak Çekme
      // Eğer veritabanında ayar yoksa, fallback (varsayılan) değerler kullanılır
      const storeSettings = await tx.storeSettings.findFirst();
      const freeShippingThreshold = storeSettings?.freeShippingThreshold ?? 5000;
      const shippingFee = storeSettings?.shippingFee ?? 149.99;
      const shippingCompany = storeSettings?.shippingCompany ?? "Yurtiçi Kargo";

      // 1. GÜVENLİK DUVARI (IDOR KONTROLÜ)
      const address = await validateAddress(tx, addressId, userId);

      // 2. ÜRÜN VE FİYAT HESAPLAMALARI
      const { calculatedTotalPrice, orderItemsToCreate } = await calculateItemsAndPrice(tx, items);

      // 3. KUPON UYGULAMA (Eğer varsa)
      let discount = 0;
      let appliedCouponId: string | null = null;
      if (couponCode) {
        const result = await applyCoupon(tx, couponCode, userId, calculatedTotalPrice);
        discount = result.discount;
        appliedCouponId = result.appliedCouponId;
      }

      // 4. ÖDEME YÖNTEMİ KONTROLÜ
      const paymentMethod = await validatePaymentMethod(tx, paymentMethodId);

      // 5. ÜCRETLER VE FİNAL TUTAR (🚀 Dinamik ayarlar kullanılıyor)
      const shippingCost = calculatedTotalPrice >= freeShippingThreshold ? 0 : shippingFee;
      const paymentFee = paymentMethod.fee;
      
      const finalTotalPrice = Math.max(0, calculatedTotalPrice + shippingCost + paymentFee - discount);

      // 6. SİPARİŞ OLUŞTURMA
      const newOrder = await tx.order.create({
        data: {
          totalPrice: finalTotalPrice,
          discountAmount: discount,
          status: "PENDING",
          userId,
          addressId: address.id,
          items: { create: orderItemsToCreate },
        },
      });

      // 7. KUPON KULLANIM KAYDI
      if (appliedCouponId) {
        await tx.couponUsage.create({
          data: {
            couponId: appliedCouponId,
            userId,
            orderId: newOrder.id,
          },
        });
      }

      // 8. ÖDEME VE KARGO KAYITLARI (🚀 Dinamik kargo şirketi kullanılıyor)
      const isCreditCard = paymentMethod.type === "CREDIT_CARD";
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          paymentMethodId: paymentMethod.id,
          status: isCreditCard ? "COMPLETED" : "PENDING",
          paidAt: isCreditCard ? new Date() : null,
        },
      });

      await tx.shipment.create({
        data: { orderId: newOrder.id, company: shippingCompany },
      });

      // 9. STOK DÜŞME
      await decrementStock(tx, items);

      // 10. SEPETİ BOŞALTMA
      await clearCart(tx, userId);

      return newOrder;
    });
  }
};