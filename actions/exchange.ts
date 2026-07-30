"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  ExchangeService,
  CreateExchangeItemInput,
} from "@/lib/services/exchange.service";
import { UserNotificationService } from "@/lib/services/user-notification.service";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { ExchangeStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { AdminNotificationService } from "@/lib/services/admin-notification.service";
import { EmailService } from "@/lib/email-service";

/**
 * 1. Müşteri: Ürün Değişim Talebi Oluşturma Action'ı
 */
export async function createExchangeAction(input: {
  orderId: string;
  customerNote?: string;
  items: CreateExchangeItemInput[];
}) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { success: false, error: "Oturum açmanız gerekmektedir." };
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: clerkUser.emailAddresses[0].emailAddress },
    });

    if (!dbUser) {
      return { success: false, error: "Kullanıcı kaydı bulunamadı." };
    }

    const exchangeRequest = await ExchangeService.createExchangeRequest({
      orderId: input.orderId,
      userId: dbUser.id,
      customerNote: input.customerNote,
      items: input.items,
    });

    // 🚀 ADMİN BİLDİRİMİ (EXCHANGE_REQUEST)
    try {
      const orderCode = `#ORD-${input.orderId.slice(-8).toUpperCase()}`;
      await AdminNotificationService.createNotification({
        type: "EXCHANGE_REQUEST",
        title: "🔁 Yeni Değişim Talebi",
        message: `${dbUser.name} tarafından ${orderCode} nolu sipariş için değişim oluşturuldu.`,
        link: `/admin/exchanges`,
        metadata: `EXCHANGE_REQUEST_${exchangeRequest.id}`,
      });
    } catch (notifErr) {
      console.error("Admin bildirim hatası (Değişim):", notifErr);
    }

    revalidatePath(`/profile/orders/${input.orderId}`);
    revalidatePath("/profile");

    return { success: true, data: exchangeRequest };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Değişim talebi oluşturulurken bir hata oluştu.";
    return { success: false, error: errorMessage };
  }
}

/**
 * 2. Admin: Değişim Talebini Onaylama Action'ı
 */
export async function approveExchangeAction(
  exchangeRequestId: string,
  returnTrackingNumber?: string,
  adminNote?: string
) {
  try {
    const adminUser = await requireAdmin("MANAGE_EXCHANGES");

    const previousRequest = await prisma.exchangeRequest.findUnique({
      where: { id: exchangeRequestId },
      select: { status: true },
    });
    const previousStatus = previousRequest?.status || "UNKNOWN";

    const updated = await ExchangeService.approveExchangeRequest(
      exchangeRequestId,
      returnTrackingNumber,
      adminNote
    );

    // 🛡️ AUDIT LOG
    try {
      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "EXCHANGE_APPROVE",
        entityType: "ExchangeRequest",
        entityId: updated.id,
        entityName: `Sipariş #${updated.orderId.slice(-8).toUpperCase()} Değişim Onayı`,
        riskLevel: "MEDIUM",
        oldValue: { status: previousStatus },
        newValue: {
          status: "APPROVED",
          returnTrackingNumber: updated.returnTrackingNumber,
          adminNote: updated.adminNote,
          approvedAt: updated.approvedAt,
        },
      });
    } catch (auditErr) {
      console.error("Audit log hatası (Değişim Onay):", auditErr);
    }

    // 🚀 MÜŞTERİ BİLDİRİMİ (EXCHANGE_APPROVED)
    try {
      await UserNotificationService.createNotification({
        userId: updated.userId,
        type: "EXCHANGE_APPROVED",
        title: "Ürün Değişim Talebiniz Onaylandı! 🔁",
        message: `#ORD-${updated.orderId.slice(-8).toUpperCase()} nolu siparişinizin değişim talebi onaylanmıştır.${
          updated.returnTrackingNumber ? ` Ücretsiz İade Kargo Kodunuz: ${updated.returnTrackingNumber}` : ""
        }`,
        linkUrl: `/profile/orders/${updated.orderId}`,
        entityType: "ExchangeRequest",
        entityId: updated.id,
      });
    } catch (notifErr) {
      console.error("Müşteri bildirim hatası (Değişim Onay):", notifErr);
    }

    // 📧 TRANSACTIONAL EMAIL (EXCHANGE_APPROVED)
    if (updated.user?.email) {
      try {
        await EmailService.sendExchangeApprovedEmail(
          updated.id,
          updated.user.email,
          updated.user.name || "Müşteri",
          updated.returnTrackingNumber || undefined
        );
      } catch (emailErr) {
        console.error("Email send failed (Exchange Approved):", emailErr);
      }
    }

    revalidatePath("/admin/exchanges");
    revalidatePath("/profile");
    revalidatePath("/profile/notifications");
    revalidatePath(`/profile/orders/${updated.orderId}`);
    return { success: true, data: updated };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "İşlem başarısız.";
    return { success: false, error: errorMessage };
  }
}

/**
 * 3. Admin: Değişim Talebini Reddetme Action'ı
 */
export async function rejectExchangeAction(
  exchangeRequestId: string,
  adminNote: string
) {
  try {
    const adminUser = await requireAdmin("MANAGE_EXCHANGES");

    const updated = await ExchangeService.rejectExchangeRequest(
      exchangeRequestId,
      adminNote
    );

    // 🛡️ AUDIT LOG
    try {
      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "EXCHANGE_REJECT",
        entityType: "ExchangeRequest",
        entityId: updated.id,
        entityName: `Sipariş #${updated.orderId.slice(-8).toUpperCase()} Değişim Reddi`,
        riskLevel: "MEDIUM",
        oldValue: { status: "PENDING" },
        newValue: {
          status: "REJECTED",
          adminNote: updated.adminNote,
        },
      });
    } catch (auditErr) {
      console.error("Audit log hatası (Değişim Red):", auditErr);
    }

    // 🚀 MÜŞTERİ BİLDİRİMİ (EXCHANGE_REJECTED)
    try {
      await UserNotificationService.createNotification({
        userId: updated.userId,
        type: "EXCHANGE_REJECTED",
        title: "Değişim Talebiniz Reddedildi ❌",
        message: `#ORD-${updated.orderId.slice(-8).toUpperCase()} nolu siparişinizin değişim talebi reddedilmiştir. Neden: ${adminNote}`,
        linkUrl: `/profile/orders/${updated.orderId}`,
        entityType: "ExchangeRequest",
        entityId: updated.id,
      });
    } catch (notifErr) {
      console.error("Müşteri bildirim hatası (Değişim Red):", notifErr);
    }

    // 📧 TRANSACTIONAL EMAIL (EXCHANGE_REJECTED)
    if (updated.user?.email) {
      try {
        await EmailService.sendExchangeRejectedEmail(
          updated.id,
          updated.user.email,
          updated.user.name || "Müşteri",
          adminNote
        );
      } catch (emailErr) {
        console.error("Email send failed (Exchange Rejected):", emailErr);
      }
    }

    revalidatePath("/admin/exchanges");
    revalidatePath("/profile");
    revalidatePath("/profile/notifications");
    revalidatePath(`/profile/orders/${updated.orderId}`);
    return { success: true, data: updated };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "İşlem başarısız.";
    return { success: false, error: errorMessage };
  }
}

/**
 * 4. Admin: Değişim Ürünü Depoda Teslim Alındı Action'ı
 */
export async function receiveExchangeAction(
  exchangeRequestId: string,
  adminNote?: string
) {
  try {
    const adminUser = await requireAdmin("MANAGE_EXCHANGES");

    const updated = await ExchangeService.receiveExchangeRequest(
      exchangeRequestId,
      adminNote
    );

    // 🛡️ AUDIT LOG
    try {
      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "EXCHANGE_RECEIVE",
        entityType: "ExchangeRequest",
        entityId: updated.id,
        entityName: `Sipariş #${updated.orderId.slice(-8).toUpperCase()} Değişim Ürünü Teslim Alındı`,
        riskLevel: "LOW",
        oldValue: { status: "APPROVED" },
        newValue: {
          status: "RECEIVED",
          receivedAt: updated.receivedAt,
          adminNote: updated.adminNote,
        },
      });
    } catch (auditErr) {
      console.error("Audit log hatası (Değişim Teslim Alındı):", auditErr);
    }

    // 🚀 MÜŞTERİ BİLDİRİMİ (EXCHANGE_RECEIVED)
    try {
      await UserNotificationService.createNotification({
        userId: updated.userId,
        type: "EXCHANGE_RECEIVED",
        title: "Değişim Ürününüz Depomuza Ulaştı 📦",
        message: `#ORD-${updated.orderId.slice(-8).toUpperCase()} nolu değişim ürününüz teslim alınmış ve incelemeye alınmıştır.`,
        linkUrl: `/profile/orders/${updated.orderId}`,
        entityType: "ExchangeRequest",
        entityId: updated.id,
      });
    } catch (notifErr) {
      console.error("Müşteri bildirim hatası (Değişim Teslim Alındı):", notifErr);
    }

    // 📧 TRANSACTIONAL EMAIL (EXCHANGE_RECEIVED)
    if (updated.user?.email) {
      try {
        await EmailService.sendExchangeReceivedEmail(
          updated.id,
          updated.user.email,
          updated.user.name || "Müşteri"
        );
      } catch (emailErr) {
        console.error("Email send failed (Exchange Received):", emailErr);
      }
    }

    revalidatePath("/admin/exchanges");
    revalidatePath("/profile");
    revalidatePath("/profile/notifications");
    revalidatePath(`/profile/orders/${updated.orderId}`);
    return { success: true, data: updated };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "İşlem başarısız.";
    return { success: false, error: errorMessage };
  }
}

/**
 * 5. Admin: Değişim Kargo / Durum Güncelleme Action'ı
 */
export async function updateExchangeStatusAction(
  exchangeRequestId: string,
  status: ExchangeStatus,
  newShipmentTrackingNumber?: string,
  adminNote?: string
) {
  try {
    const adminUser = await requireAdmin("MANAGE_EXCHANGES");

    const previousRequest = await prisma.exchangeRequest.findUnique({
      where: { id: exchangeRequestId },
      select: { status: true },
    });
    const previousStatus = previousRequest?.status || "UNKNOWN";

    const updated = await ExchangeService.updateShipmentStatus(
      exchangeRequestId,
      status,
      newShipmentTrackingNumber,
      adminNote
    );

    // 🛡️ AUDIT LOG
    try {
      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "EXCHANGE_SHIPMENT_UPDATE",
        entityType: "ExchangeRequest",
        entityId: updated.id,
        entityName: `Sipariş #${updated.orderId.slice(-8).toUpperCase()} Değişim Durumu: ${status}`,
        riskLevel: "LOW",
        oldValue: { status: previousStatus },
        newValue: {
          status: updated.status,
          newShipmentTrackingNumber: updated.newShipmentTrackingNumber,
          adminNote: updated.adminNote,
        },
      });
    } catch (auditErr) {
      console.error("Audit log hatası (Değişim Kargo Güncelleme):", auditErr);
    }

    // 🚀 MÜŞTERİ BİLDİRİMİ & 📧 EMAIL (EXCHANGE_SHIPPED - Sadece SHIPPED durumuna geçildiğinde)
    if (status === ExchangeStatus.SHIPPED) {
      try {
        await UserNotificationService.createNotification({
          userId: updated.userId,
          type: "EXCHANGE_SHIPPED",
          title: "Yeni Değişim Ürününüz Kargoya Verildi 🚚",
          message: `#ORD-${updated.orderId.slice(-8).toUpperCase()} nolu siparişinizin yeni değişim ürünü kargolanmıştır.${
            updated.newShipmentTrackingNumber ? ` Takip Kargo Kodunuz: ${updated.newShipmentTrackingNumber}` : ""
          }`,
          linkUrl: `/profile/orders/${updated.orderId}`,
          entityType: "ExchangeRequest",
          entityId: updated.id,
        });
      } catch (notifErr) {
        console.error("Müşteri bildirim hatası (Değişim Kargolandı):", notifErr);
      }

      if (updated.user?.email) {
        try {
          await EmailService.sendExchangeShippedEmail(
            updated.id,
            updated.user.email,
            updated.user.name || "Müşteri",
            updated.newShipmentTrackingNumber || undefined
          );
        } catch (emailErr) {
          console.error("Email send failed (Exchange Shipped):", emailErr);
        }
      }
    }

    revalidatePath("/admin/exchanges");
    revalidatePath("/profile");
    revalidatePath("/profile/notifications");
    revalidatePath(`/profile/orders/${updated.orderId}`);
    return { success: true, data: updated };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "İşlem başarısız.";
    return { success: false, error: errorMessage };
  }
}

/**
 * 6. Admin: Değişimi Tamamlama Action'ı (Stok Değişimi & Atomik Kilit)
 */
export async function completeExchangeAction(
  exchangeRequestId: string,
  adminNote?: string
) {
  try {
    const adminUser = await requireAdmin("MANAGE_EXCHANGES");

    const previousRequest = await prisma.exchangeRequest.findUnique({
      where: { id: exchangeRequestId },
      select: { status: true },
    });
    const previousStatus = previousRequest?.status || "UNKNOWN";

    const updated = await ExchangeService.completeExchangeRequest(
      exchangeRequestId,
      adminNote
    );

    if (updated) {
      // 🛡️ AUDIT LOG
      try {
        await AuditLogService.createAuditLog({
          adminId: adminUser.id,
          adminName: adminUser.name,
          adminEmail: adminUser.email,
          action: "EXCHANGE_COMPLETE",
          entityType: "ExchangeRequest",
          entityId: updated.id,
          entityName: `Sipariş #${updated.orderId.slice(-8).toUpperCase()} Değişim Tamamlama & Stok Hareketi`,
          riskLevel: "HIGH",
          oldValue: { status: previousStatus },
          newValue: {
            status: "COMPLETED",
            completedAt: updated.completedAt,
            adminNote: updated.adminNote,
          },
        });
      } catch (auditErr) {
        console.error("Audit log hatası (Değişim Tamamlama):", auditErr);
      }

      // 🚀 MÜŞTERİ BİLDİRİMİ (EXCHANGE_COMPLETED)
      try {
        await UserNotificationService.createNotification({
          userId: updated.userId,
          type: "EXCHANGE_COMPLETED",
          title: "Değişim İşleminiz Tamamlandı ✨",
          message: `#ORD-${updated.orderId.slice(-8).toUpperCase()} nolu ürün değişim süreciniz başarıyla tamamlanmıştır.`,
          linkUrl: `/profile/orders/${updated.orderId}`,
          entityType: "ExchangeRequest",
          entityId: updated.id,
        });
      } catch (notifErr) {
        console.error("Müşteri bildirim hatası (Değişim Tamamlama):", notifErr);
      }

      // 📧 TRANSACTIONAL EMAIL (EXCHANGE_COMPLETED)
      if (updated.user?.email) {
        try {
          await EmailService.sendExchangeCompletedEmail(
            updated.id,
            updated.user.email,
            updated.user.name || "Müşteri"
          );
        } catch (emailErr) {
          console.error("Email send failed (Exchange Completed):", emailErr);
        }
      }

      revalidatePath("/admin/exchanges");
      revalidatePath("/profile");
      revalidatePath("/profile/notifications");
      revalidatePath(`/profile/orders/${updated.orderId}`);
    }

    return { success: true, data: updated };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "İşlem başarısız.";
    return { success: false, error: errorMessage };
  }
}
