"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AdminNotificationService } from "@/lib/services/admin-notification.service";
import { OrderService } from "@/lib/services/order.service";

export async function cancelOrderAction(orderId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { success: false, error: "Yetkisiz erişim. Lütfen giriş yapınız." };
    }

    const email = clerkUser.emailAddresses[0].emailAddress;
    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) {
      return { success: false, error: "Kullanıcı kaydı bulunamadı." };
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: dbUser.id,
      },
      select: { id: true, status: true },
    });

    if (!order) {
      return { success: false, error: "Sipariş bulunamadı." };
    }

    if (order.status !== "PENDING" && order.status !== "PROCESSING") {
      return {
        success: false,
        error: "Bu sipariş kargoya verildiği veya tamamlandığı için iptal edilemez.",
      };
    }

    // Call atomic, idempotent OrderService cancellation (handles stock, salesCount, coupon, CouponUsage, payment)
    const result = await OrderService.cancelOrder(orderId, { userId: dbUser.id });

    if (!result.alreadyCancelled) {
      // 🚀 ADMİN BİLDİRİMİ (ORDER_CANCELLED)
      try {
        const orderCode = `#ORD-${orderId.slice(-8).toUpperCase()}`;
        await AdminNotificationService.createNotification({
          type: "ORDER_CANCELLED",
          title: "🛑 Sipariş İptal Edildi",
          message: `${dbUser.name} tarafından ${orderCode} nolu sipariş iptal edildi.`,
          link: `/admin/orders/${orderId}`,
          metadata: `ORDER_CANCELLED_${orderId}`,
        });
      } catch (notifErr) {
        console.error("Admin bildirim hatası (İptal):", notifErr);
      }
    }

    revalidatePath("/profile");
    revalidatePath(`/profile/orders/${orderId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Sipariş iptal hatası:", error);
    return { success: false, error: error?.message || "Sipariş iptal edilirken bir sunucu hatası oluştu." };
  }
}

