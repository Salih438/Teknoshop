"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserNotificationService } from "@/lib/services/user-notification.service";
import { revalidatePath } from "next/cache";

/**
 * 🔒 Yardımcı: Oturum Açmış DB Kullanıcısını Getir
 */
async function getAuthDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  return await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

/**
 * 📬 Müşteri Bildirimlerini Getir Action'ı
 */
export async function getUserNotificationsAction(categoryFilter?: string) {
  try {
    const dbUser = await getAuthDbUser();
    if (!dbUser) {
      return { success: false, error: "Oturum açmanız gerekmektedir." };
    }

    const data = await UserNotificationService.getUserNotifications(
      dbUser.id,
      categoryFilter
    );

    return { success: true, data };
  } catch (error) {
    console.error("getUserNotificationsAction Hata:", error);
    return { success: false, error: "Bildirimler getirilirken bir hata oluştu." };
  }
}

/**
 * ✓ Bildirimi Okundu İşaretle Action'ı
 */
export async function markNotificationReadAction(id: string) {
  try {
    const dbUser = await getAuthDbUser();
    if (!dbUser) {
      return { success: false, error: "Oturum açmanız gerekmektedir." };
    }

    const success = await UserNotificationService.markAsRead(id, dbUser.id);
    if (success) {
      revalidatePath("/profile/notifications");
      revalidatePath("/profile");
    }

    return { success };
  } catch (error) {
    console.error("markNotificationReadAction Hata:", error);
    return { success: false, error: "İşlem başarısız." };
  }
}

/**
 * ✓ Tüm Bildirimleri Okundu İşaretle Action'ı
 */
export async function markAllNotificationsReadAction() {
  try {
    const dbUser = await getAuthDbUser();
    if (!dbUser) {
      return { success: false, error: "Oturum açmanız gerekmektedir." };
    }

    const success = await UserNotificationService.markAllAsRead(dbUser.id);
    if (success) {
      revalidatePath("/profile/notifications");
      revalidatePath("/profile");
    }

    return { success };
  } catch (error) {
    console.error("markAllNotificationsReadAction Hata:", error);
    return { success: false, error: "İşlem başarısız." };
  }
}

/**
 * 🗑️ Bildirimi Sil Action'ı
 */
export async function deleteNotificationAction(id: string) {
  try {
    const dbUser = await getAuthDbUser();
    if (!dbUser) {
      return { success: false, error: "Oturum açmanız gerekmektedir." };
    }

    const success = await UserNotificationService.deleteNotification(id, dbUser.id);
    if (success) {
      revalidatePath("/profile/notifications");
      revalidatePath("/profile");
    }

    return { success };
  } catch (error) {
    console.error("deleteNotificationAction Hata:", error);
    return { success: false, error: "İşlem başarısız." };
  }
}
