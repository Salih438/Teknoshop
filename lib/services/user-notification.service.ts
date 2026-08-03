import { prisma } from "@/lib/prisma";
import { UserNotificationType, UserNotification, Prisma } from "@prisma/client";

export interface CreateUserNotificationInput {
  userId: string;
  type: UserNotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  entityType?: string;
  entityId?: string;
}

export class UserNotificationService {
  /**
   * 🚀 Müşteriye Yeni Bildirim Oluştur (Non-Blocking / Graceful Error Handling)
   */
  static async createNotification(
    input: CreateUserNotificationInput
  ): Promise<UserNotification | null> {
    try {
      const notification = await prisma.userNotification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title.trim(),
          message: input.message.trim(),
          linkUrl: input.linkUrl?.trim() || null,
          entityType: input.entityType?.trim() || null,
          entityId: input.entityId?.trim() || null,
        },
      });

      return notification;
    } catch (error) {
      console.error("UserNotificationService.createNotification Hata:", error);
      return null;
    }
  }

  /**
   * 📬 Müşterinin Bildirimlerini ve Okunmamış Sayısını Getir
   */
  static async getUserNotifications(
    userId: string,
    categoryFilter?: string
  ): Promise<{ notifications: UserNotification[]; unreadCount: number }> {
    try {
      const whereCondition: Prisma.UserNotificationWhereInput = { userId };

      // Kategori bazlı filtreleme map
      if (categoryFilter && categoryFilter !== "all") {
        if (categoryFilter === "orders") {
          whereCondition.type = {
            in: ["ORDER_CREATED", "ORDER_PREPARING", "ORDER_SHIPPED", "ORDER_DELIVERED"],
          };
        } else if (categoryFilter === "returns") {
          whereCondition.type = {
            in: [
              "RETURN_APPROVED",
              "RETURN_REJECTED",
              "RETURN_COMPLETED",
              "EXCHANGE_APPROVED",
              "EXCHANGE_REJECTED",
              "EXCHANGE_RECEIVED",
              "EXCHANGE_SHIPPED",
              "EXCHANGE_COMPLETED",
            ],
          };
        } else if (categoryFilter === "campaigns") {
          whereCondition.type = {
            in: ["NEW_COUPON", "NEW_CAMPAIGN"],
          };
        } else if (categoryFilter === "system") {
          whereCondition.type = "SYSTEM_ANNOUNCEMENT";
        }
      }

      const [notifications, unreadCount] = await Promise.all([
        prisma.userNotification.findMany({
          where: whereCondition,
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.userNotification.count({
          where: { userId, isRead: false },
        }),
      ]);

      return { notifications, unreadCount };
    } catch (error) {
      console.error("UserNotificationService.getUserNotifications Hata:", error);
      return { notifications: [], unreadCount: 0 };
    }
  }

  /**
   * ✓ Bildirimi Okundu İşaretle
   */
  static async markAsRead(id: string, userId: string): Promise<boolean> {
    try {
      const updated = await prisma.userNotification.updateMany({
        where: { id, userId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return updated.count > 0;
    } catch (error) {
      console.error("UserNotificationService.markAsRead Hata:", error);
      return false;
    }
  }

  /**
   * ✓ Tüm Bildirimleri Okundu İşaretle
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await prisma.userNotification.updateMany({
        where: { userId, isRead: false },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error("UserNotificationService.markAllAsRead Hata:", error);
      return false;
    }
  }

  /**
   * 🗑️ Bildirim Sil
   */
  static async deleteNotification(id: string, userId: string): Promise<boolean> {
    try {
      const deleted = await prisma.userNotification.deleteMany({
        where: { id, userId },
      });

      return deleted.count > 0;
    } catch (error) {
      console.error("UserNotificationService.deleteNotification Hata:", error);
      return false;
    }
  }
}
