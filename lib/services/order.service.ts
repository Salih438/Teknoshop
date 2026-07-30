import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export class OrderService {
  /**
   * Cancel an order with full atomic transaction consistency and idempotency:
   * 1. Order status -> CANCELLED (atomic updateMany guard against race conditions)
   * 2. Stock & salesCount restoration (simple products vs variant products)
   * 3. Coupon.usedCount decrement (guaranteed >= 0)
   * 4. CouponUsage record deletion for this order
   * 5. Payment status -> REFUNDED (if payment exists)
   */
  static async cancelOrder(orderId: string, options?: { userId?: string }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch order with items, payment, and coupon usages
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payment: true,
          couponUsages: {
            include: {
              coupon: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (options?.userId && order.userId !== options.userId) {
        throw new Error("UNAUTHORIZED");
      }

      // If already cancelled, return early (idempotency guard)
      if (order.status === OrderStatus.CANCELLED) {
        return { success: true, order, alreadyCancelled: true };
      }

      // Atomic status update guard: ensure order status is still not CANCELLED
      const updateResult = await tx.order.updateMany({
        where: {
          id: orderId,
          status: { not: OrderStatus.CANCELLED },
        },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });

      // If another concurrent request cancelled it first, exit cleanly
      if (updateResult.count === 0) {
        return { success: true, order, alreadyCancelled: true };
      }

      // 2. Restore Product Stock & Sales Count
      for (const item of order.items) {
        if (item.variantId) {
          // Variant Product: Restore variant stock, decrement parent salesCount
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: { salesCount: { decrement: item.quantity } },
          });
        } else {
          // Simple Product: Restore product stock, decrement product salesCount
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              salesCount: { decrement: item.quantity },
            },
          });
        }
      }

      // 3. Restore Coupon.usedCount & Delete CouponUsage
      if (order.couponUsages && order.couponUsages.length > 0) {
        for (const usage of order.couponUsages) {
          // Decrement usedCount on the coupon, ensuring it never drops below 0
          await tx.coupon.updateMany({
            where: {
              id: usage.couponId,
              usedCount: { gt: 0 },
            },
            data: {
              usedCount: { decrement: 1 },
            },
          });
        }

        // Delete CouponUsage records specifically belonging to this order
        await tx.couponUsage.deleteMany({
          where: { orderId: order.id },
        });
      }

      // 4. Update Payment status according to Production Payment Lifecycle rules
      if (order.payment) {
        if (order.payment.status === "COMPLETED") {
          // Rule 1: Money was collected -> Mark as REFUNDED with full order amount & timestamp
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              status: "REFUNDED",
              refundedAmount: order.totalPrice,
              refundedAt: new Date(),
            },
          });
        } else if (order.payment.status === "PENDING") {
          // Rule 2: No money was collected -> Void pending payment by setting status to FAILED
          // Do NOT set refundedAmount or refundedAt
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              status: "FAILED",
            },
          });
        }
        // Rule 3: If payment status is already FAILED (or REFUNDED), do nothing.
      }

      // Fetch final updated order state
      const finalOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payment: true, user: true },
      });

      return { success: true, order: finalOrder, alreadyCancelled: false };
    });
  }
}
