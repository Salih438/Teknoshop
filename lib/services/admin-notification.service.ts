import { prisma } from "@/lib/prisma";
import { AdminNotificationType, Prisma } from "@prisma/client";

interface CreateNotificationInput {
  type: AdminNotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: string;
}

export class AdminNotificationService {
  /**
   * 🚀 Akıllı Bildirim Üretme (Duplicate Engelli)
   */
  static async createNotification(input: CreateNotificationInput) {
    try {
      const { type, title, message, link, metadata } = input;

      // Duplicate Engeli: Eğer aynı metadata ile henüz okunmamış bir bildirim varsa tekrar fırlatma
      if (metadata) {
        const existingNotif = await prisma.adminNotification.findFirst({
          where: {
            metadata,
            isRead: false,
          },
        });

        if (existingNotif) {
          // Zaten aynı aktif uyarı veritabanında okunmamış olarak duruyor
          return existingNotif;
        }
      }

      // Yeni bildirimi veritabanına ekle
      const notification = await prisma.adminNotification.create({
        data: {
          type,
          title,
          message,
          link,
          metadata,
        },
      });

      return notification;
    } catch (error) {
      console.error("AdminNotificationService.createNotification Hata:", error);
      return null;
    }
  }

  /**
   * 🚀 Bildirimleri Çek ve Zaman Dilimlerine Göre Grupla
   */
  static async getNotifications(typeFilter?: string) {
    try {
      const whereClause: Prisma.AdminNotificationWhereInput = {};
      if (typeFilter && typeFilter !== "all") {
        if (typeFilter === "orders") {
          whereClause.type = { in: ["NEW_ORDER", "ORDER_CANCELLED"] };
        } else if (typeFilter === "stock") {
          whereClause.type = "LOW_STOCK";
        } else if (typeFilter === "returns") {
          whereClause.type = { in: ["RETURN_REQUEST", "EXCHANGE_REQUEST"] };
        } else if (typeFilter === "system") {
          whereClause.type = { in: ["SYSTEM", "USER_REGISTERED"] };
        }
      }

      const [notifications, unreadCount] = await Promise.all([
        prisma.adminNotification.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.adminNotification.count({
          where: { isRead: false },
        }),
      ]);

      // Zaman Gruplama (Bugün, Dün, Bu Hafta, Daha Eski)
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

      const grouped = {
        today: [] as typeof notifications,
        yesterday: [] as typeof notifications,
        thisWeek: [] as typeof notifications,
        older: [] as typeof notifications,
      };

      notifications.forEach((item) => {
        const itemDate = new Date(item.createdAt);
        if (itemDate >= startOfToday) {
          grouped.today.push(item);
        } else if (itemDate >= startOfYesterday) {
          grouped.yesterday.push(item);
        } else if (itemDate >= startOfWeek) {
          grouped.thisWeek.push(item);
        } else {
          grouped.older.push(item);
        }
      });

      return {
        notifications,
        grouped,
        unreadCount,
      };
    } catch (error) {
      console.error("AdminNotificationService.getNotifications Hata:", error);
      return {
        notifications: [],
        grouped: { today: [], yesterday: [], thisWeek: [], older: [] },
        unreadCount: 0,
      };
    }
  }

  /**
   * 🚀 Okundu İşaretleme
   */
  static async markAsRead(id: string) {
    try {
      await prisma.adminNotification.update({
        where: { id },
        data: { isRead: true },
      });
      return true;
    } catch (error) {
      console.error("AdminNotificationService.markAsRead Hata:", error);
      return false;
    }
  }

  /**
   * 🚀 Tümünü Okundu İşaretleme
   */
  static async markAllAsRead() {
    try {
      await prisma.adminNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
      return true;
    } catch (error) {
      console.error("AdminNotificationService.markAllAsRead Hata:", error);
      return false;
    }
  }

  /**
   * 🚀 Seçili Bildirimleri Silme
   */
  static async deleteNotifications(ids: string[]) {
    try {
      await prisma.adminNotification.deleteMany({
        where: { id: { in: ids } },
      });
      return true;
    } catch (error) {
      console.error("AdminNotificationService.deleteNotifications Hata:", error);
      return false;
    }
  }

  /**
   * 🚀 Tüm Bildirimleri Temizleme
   */
  static async deleteAllNotifications() {
    try {
      await prisma.adminNotification.deleteMany({});
      return true;
    } catch (error) {
      console.error("AdminNotificationService.deleteAllNotifications Hata:", error);
      return false;
    }
  }
}
