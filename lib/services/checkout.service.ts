import { prisma } from "@/lib/prisma";
import { AdminNotificationService } from "@/lib/services/admin-notification.service";
import { EmailService } from "@/lib/email-service";

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
    where: { id: { in: itemIds }, isActive: true },
    include: { variants: true },
  });

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  for (const item of items) {
    if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new CheckoutError("Adet sayısı pozitif bir tam sayı olmalıdır.", 400);
    }

    const dbProduct = productMap.get(item.id);

    if (!dbProduct) throw new CheckoutError(`Ürün bulunamadı veya artık satışta değil: ${item.id}`, 404);

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

  // Atomic coupon usage limit check and increment
  const result = await tx.coupon.updateMany({
    where: {
      id: dbCoupon.id,
      usedCount: { lt: dbCoupon.usageLimit },
    },
    data: { usedCount: { increment: 1 } },
  });

  if (result.count === 0) {
    throw new CheckoutError("Bu kuponun kullanım limiti dolmuş.", 400);
  }

  discount = Math.round(((calculatedTotalPrice * dbCoupon.discount) / 100) * 100) / 100;
  appliedCouponId = dbCoupon.id;

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
  // Process all items in parallel — each item is independent, and all writes
  // are inside the same Prisma transaction so atomicity is guaranteed.
  await Promise.all(
    items.map(async (item) => {
      if (item.variantId) {
        // ── VARIANT PRODUCT ────────────────────────────────────────────────
        // Rule (consistent with return.service.ts and exchange.service.ts):
        //   • ProductVariant.stock  → decrement  (variant owns its own stock)
        //   • Product.stock         → DO NOT TOUCH (always 0 for variant products)
        //   • Product.salesCount    → increment   (analytics counter only)
        //
        // The stock guard (`stock: { gte: quantity }`) is applied ONLY on the
        // variant row. The parent Product.stock is intentionally 0 and must
        // never be used as a stock gate for variant purchases.

        const variantResult = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (variantResult.count === 0) {
          // Race condition protection: another transaction depleted this
          // variant's stock between our pre-flight check and this write.
          throw new CheckoutError(
            "Satın almaya çalıştığınız ürünün stoku tükendi.",
            409
          );
        }

        // Increment salesCount on the parent product unconditionally.
        // No stock guard — Product.stock is irrelevant for variant products.
        await tx.product.update({
          where: { id: item.id },
          data: { salesCount: { increment: item.quantity } },
        });
      } else {
        // ── SIMPLE PRODUCT (no variant) ────────────────────────────────────
        // Product.stock is the single source of truth.
        // Stock guard is applied here to prevent overselling.

        const productResult = await tx.product.updateMany({
          where: { id: item.id, stock: { gte: item.quantity } },
          data: {
            stock: { decrement: item.quantity },
            salesCount: { increment: item.quantity },
          },
        });

        if (productResult.count === 0) {
          throw new CheckoutError(
            "Satın almaya çalıştığınız ürünün stoku tükendi.",
            409
          );
        }
      }
    })
  );
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
    const newOrder = await prisma.$transaction(async (tx) => {
      const storeSettings = await tx.storeSettings.findFirst();
      const freeShippingThreshold = storeSettings?.freeShippingThreshold ?? 5000;
      const shippingFee = storeSettings?.shippingFee ?? 149.99;
      const shippingCompany = storeSettings?.shippingCompany ?? "Yurtiçi Kargo";

      const address = await validateAddress(tx, addressId, userId);
      const { calculatedTotalPrice, orderItemsToCreate } = await calculateItemsAndPrice(tx, items);

      // 1. Kupon indirimi hesaplama
      let discount = 0;
      let appliedCouponId: string | null = null;
      if (couponCode) {
        const result = await applyCoupon(tx, couponCode, userId, calculatedTotalPrice);
        discount = result.discount;
        appliedCouponId = result.appliedCouponId;
      }

      // 2. İndirimli ara toplam (Discounted Subtotal)
      const discountedSubtotal = Math.max(0, calculatedTotalPrice - discount);

      const paymentMethod = await validatePaymentMethod(tx, paymentMethodId);

      // 3. Ücretsiz kargo barajı kontrolü İNDİRİMLİ ARA TOPLAM üzerinden yapılır!
      const shippingCost = discountedSubtotal >= freeShippingThreshold ? 0 : shippingFee;
      const paymentFee = paymentMethod.fee;

      // 4. Nihai toplam tutar (2 basamağa yuvarlanmış)
      const finalTotalPrice = Math.round(Math.max(0, discountedSubtotal + shippingCost + paymentFee) * 100) / 100;

      const order = await tx.order.create({
        data: {
          totalPrice: finalTotalPrice,
          discountAmount: discount,
          status: "PENDING",
          userId,
          addressId: address.id,
          items: { create: orderItemsToCreate },
        },
        include: {
          user: true,
        },
      });

      if (appliedCouponId) {
        await tx.couponUsage.create({
          data: {
            couponId: appliedCouponId,
            userId,
            orderId: order.id,
          },
        });
      }

      const isCreditCard = paymentMethod.type === "CREDIT_CARD";
      await tx.payment.create({
        data: {
          orderId: order.id,
          paymentMethodId: paymentMethod.id,
          status: isCreditCard ? "COMPLETED" : "PENDING",
          paidAt: isCreditCard ? new Date() : null,
        },
      });

      await tx.shipment.create({
        data: { orderId: order.id, company: shippingCompany },
      });

      await decrementStock(tx, items);
      await clearCart(tx, userId);

      return order;
    });

    // 🚀 ADMİN BİLDİRİMİ VE MÜŞTERİ E-POSTASI ÜRETME
    try {
      const orderCode = `#ORD-${newOrder.id.slice(-8).toUpperCase()}`;
      const customerName = newOrder.user?.name || "Müşteri";

      // 1. Müşteriye Sipariş Onay E-postası Gönder
      if (newOrder.user?.email) {
        await EmailService.sendOrderConfirmationEmail(
          {
            id: newOrder.id,
            totalPrice: newOrder.totalPrice,
            discountAmount: newOrder.discountAmount,
          },
          newOrder.user.email,
          customerName
        );
      }

      // 2. Yeni Sipariş Bildirimi
      await AdminNotificationService.createNotification({
        type: "NEW_ORDER",
        title: "🛒 Yeni Sipariş",
        message: `${customerName} • ${newOrder.totalPrice.toLocaleString("tr-TR")} ₺ (${orderCode})`,
        link: `/admin/orders/${newOrder.id}`,
        metadata: `NEW_ORDER_${newOrder.id}`,
      });

      // 3. LOW_STOCK kontrolü.
      const simpleProductIds = items
        .filter((i) => !i.variantId)
        .map((i) => i.id);

      const variantIds = items
        .filter((i) => i.variantId)
        .map((i) => i.variantId as string);

      const LOW_STOCK_THRESHOLD = 5;

      const [lowStockProducts, lowStockVariants] = await Promise.all([
        simpleProductIds.length > 0
          ? prisma.product.findMany({
              where: { id: { in: simpleProductIds }, stock: { lte: LOW_STOCK_THRESHOLD } },
              select: { id: true, name: true, stock: true },
            })
          : [],
        variantIds.length > 0
          ? prisma.productVariant.findMany({
              where: { id: { in: variantIds }, stock: { lte: LOW_STOCK_THRESHOLD } },
              select: { id: true, stock: true, color: true, storage: true, product: { select: { id: true, name: true } } },
            })
          : [],
      ]);

      const notifPromises: Promise<unknown>[] = [];

      for (const prod of lowStockProducts) {
        notifPromises.push(
          AdminNotificationService.createNotification({
            type: "LOW_STOCK",
            title: "⚠️ Kritik Stok Uyarısı",
            message: `"${prod.name}" stoğu azaldı! Kalan: ${prod.stock} adet`,
            link: `/admin/products/${prod.id}/edit`,
            metadata: `LOW_STOCK_${prod.id}`,
          })
        );
      }

      for (const variant of lowStockVariants) {
        const variantLabel = [variant.color, variant.storage].filter(Boolean).join(" ");
        notifPromises.push(
          AdminNotificationService.createNotification({
            type: "LOW_STOCK",
            title: "⚠️ Kritik Stok Uyarısı",
            message: `"${variant.product.name}${variantLabel ? ` (${variantLabel})` : ""}" varyant stoğu azaldı! Kalan: ${variant.stock} adet`,
            link: `/admin/products/${variant.product.id}/edit`,
            metadata: `LOW_STOCK_VARIANT_${variant.id}`,
          })
        );
      }

      await Promise.all(notifPromises);
    } catch (notifErr) {
      console.error("Admin bildirim fırlatma hatası (Sipariş sonrası):", notifErr);
    }

    return newOrder;
  }
};