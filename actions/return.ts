"use server";

import { currentUser } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReturnService, CreateReturnItemInput } from "@/lib/services/return.service";
import { UserNotificationService } from "@/lib/services/user-notification.service";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { ReturnStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { AdminNotificationService } from "@/lib/services/admin-notification.service";
import { EmailService } from "@/lib/email-service";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * Müşteri: İade Talebi Oluşturma
 */
export async function createReturnAction(input: {
  orderId: string;
  customerNote?: string;
  items: CreateReturnItemInput[];
  imageUrls?: string[];
}) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { success: false, error: "İade talebi oluşturmak için giriş yapmalısınız." };
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      return { success: false, error: "Geçerli bir e-posta adresi bulunamadı." };
    }

    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

    if (!dbUser) {
      return { success: false, error: "Kullanıcı kaydı bulunamadı." };
    }

    const returnRequest = await ReturnService.createReturnRequest({
      orderId: input.orderId,
      userId: dbUser.id,
      customerNote: input.customerNote,
      items: input.items,
      imageUrls: input.imageUrls,
    });

    // 🚀 ADMİN BİLDİRİMİ (RETURN_REQUEST)
    try {
      const orderCode = `#ORD-${input.orderId.slice(-8).toUpperCase()}`;
      await AdminNotificationService.createNotification({
        type: "RETURN_REQUEST",
        title: "↩️ Yeni İade Talebi",
        message: `${dbUser.name} tarafından ${orderCode} nolu sipariş için iade oluşturuldu.`,
        link: `/admin/returns`,
        metadata: `RETURN_REQUEST_${returnRequest.id}`,
      });
    } catch (notifErr) {
      console.error("Admin bildirim hatası (İade):", notifErr);
    }

    revalidatePath("/profile");
    revalidatePath(`/profile/orders/${input.orderId}`);
    revalidatePath("/admin/returns");

    return { success: true, data: returnRequest };
  } catch (error: unknown) {
    console.error("createReturnAction error:", error);
    return { success: false, error: getErrorMessage(error, "İade talebi oluşturulurken bir hata oluştu.") };
  }
}

/**
 * Admin: İade Talebini Onaylama
 */
export async function approveReturnAction(returnRequestId: string, returnTrackingNumber?: string, adminNote?: string) {
  try {
    const adminUser = await requireAdmin("MANAGE_RETURNS");

    const result = await ReturnService.approveReturnRequest(returnRequestId, returnTrackingNumber, adminNote);

    // 🛡️ AUDIT LOG
    try {
      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "RETURN_APPROVE",
        entityType: "ReturnRequest",
        entityId: result.id,
        entityName: `Sipariş #${result.orderId.slice(-8).toUpperCase()} İade Onayı`,
        riskLevel: "MEDIUM",
        oldValue: { status: "PENDING" },
        newValue: {
          status: "APPROVED",
          returnTrackingNumber: result.returnTrackingNumber,
          adminNote: result.adminNote,
          approvedAt: result.approvedAt,
        },
      });
    } catch (auditErr) {
      console.error("Audit log hatası (İade Onay):", auditErr);
    }

    // 🚀 MÜŞTERİ BİLDİRİMİ (RETURN_APPROVED)
    try {
      await UserNotificationService.createNotification({
        userId: result.userId,
        type: "RETURN_APPROVED",
        title: "İade Talebiniz Onaylandı! 🔄",
        message: `#ORD-${result.orderId.slice(-8).toUpperCase()} nolu siparişinizin iade talebi onaylanmıştır.${
          result.returnTrackingNumber ? ` Ücretsiz İade Kargo Kodunuz: ${result.returnTrackingNumber}` : ""
        }`,
        linkUrl: `/profile/orders/${result.orderId}`,
        entityType: "ReturnRequest",
        entityId: result.id,
      });
    } catch (notifErr) {
      console.error("Müşteri bildirim hatası (İade Onay):", notifErr);
    }

    // 📧 TRANSACTIONAL EMAIL (RETURN_APPROVED)
    if (result.user?.email) {
      try {
        await EmailService.sendReturnApprovedEmail(
          result.id,
          result.user.email,
          result.user.name || "Müşteri",
          result.returnTrackingNumber || undefined
        );
      } catch (emailErr) {
        console.error("Email send failed (Return Approved):", emailErr);
      }
    }

    revalidatePath("/admin/returns");
    revalidatePath("/profile");
    revalidatePath("/profile/notifications");
    revalidatePath(`/profile/orders/${result.orderId}`);

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("approveReturnAction error:", error);
    return { success: false, error: getErrorMessage(error, "İade onaylanırken hata oluştu.") };
  }
}

/**
 * Admin: İade Talebini Reddetme
 */
export async function rejectReturnAction(returnRequestId: string, adminNote: string) {
  try {
    const adminUser = await requireAdmin("MANAGE_RETURNS");

    const result = await ReturnService.rejectReturnRequest(returnRequestId, adminNote);

    // 🛡️ AUDIT LOG
    try {
      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "RETURN_REJECT",
        entityType: "ReturnRequest",
        entityId: result.id,
        entityName: `Sipariş #${result.orderId.slice(-8).toUpperCase()} İade Reddi`,
        riskLevel: "MEDIUM",
        oldValue: { status: "PENDING" },
        newValue: {
          status: "REJECTED",
          adminNote: result.adminNote,
        },
      });
    } catch (auditErr) {
      console.error("Audit log hatası (İade Red):", auditErr);
    }

    // 🚀 MÜŞTERİ BİLDİRİMİ (RETURN_REJECTED)
    try {
      await UserNotificationService.createNotification({
        userId: result.userId,
        type: "RETURN_REJECTED",
        title: "İade Talebiniz Reddedildi ❌",
        message: `#ORD-${result.orderId.slice(-8).toUpperCase()} nolu siparişinizin iade talebi reddedilmiştir. Neden: ${adminNote}`,
        linkUrl: `/profile/orders/${result.orderId}`,
        entityType: "ReturnRequest",
        entityId: result.id,
      });
    } catch (notifErr) {
      console.error("Müşteri bildirim hatası (İade Red):", notifErr);
    }

    // 📧 TRANSACTIONAL EMAIL (RETURN_REJECTED)
    if (result.user?.email) {
      try {
        await EmailService.sendReturnRejectedEmail(
          result.id,
          result.user.email,
          result.user.name || "Müşteri",
          adminNote
        );
      } catch (emailErr) {
        console.error("Email send failed (Return Rejected):", emailErr);
      }
    }

    revalidatePath("/admin/returns");
    revalidatePath("/profile");
    revalidatePath("/profile/notifications");
    revalidatePath(`/profile/orders/${result.orderId}`);

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("rejectReturnAction error:", error);
    return { success: false, error: getErrorMessage(error, "İade reddedilirken hata oluştu.") };
  }
}

/**
 * Admin: İade Depoya Ulaştı (Teslim Alındı)
 */
export async function receiveReturnAction(returnRequestId: string, adminNote?: string) {
  try {
    const adminUser = await requireAdmin("MANAGE_RETURNS");

    const result = await ReturnService.receiveReturnRequest(returnRequestId, adminNote);

    // 🛡️ AUDIT LOG
    try {
      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "RETURN_RECEIVE",
        entityType: "ReturnRequest",
        entityId: result.id,
        entityName: `Sipariş #${result.orderId.slice(-8).toUpperCase()} İade Teslim Alındı`,
        riskLevel: "LOW",
        oldValue: { status: "APPROVED" },
        newValue: {
          status: "RECEIVED",
          receivedAt: result.receivedAt,
          adminNote: result.adminNote,
        },
      });
    } catch (auditErr) {
      console.error("Audit log hatası (İade Teslim Alındı):", auditErr);
    }

    revalidatePath("/admin/returns");
    revalidatePath("/profile");
    revalidatePath("/profile/notifications");
    revalidatePath(`/profile/orders/${result.orderId}`);

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("receiveReturnAction error:", error);
    return { success: false, error: getErrorMessage(error, "İade durumu güncellenirken hata oluştu.") };
  }
}

/**
 * Admin: İadeyi Tamamlama (Stok++ & Ödeme İadesi)
 */
export async function completeReturnAction(returnRequestId: string, refundMethod?: string, adminNote?: string) {
  try {
    const adminUser = await requireAdmin("MANAGE_RETURNS");

    const result = await ReturnService.completeReturnRequest(returnRequestId, refundMethod, adminNote);

    if (result) {
      // 🛡️ AUDIT LOG
      try {
        await AuditLogService.createAuditLog({
          adminId: adminUser.id,
          adminName: adminUser.name,
          adminEmail: adminUser.email,
          action: "RETURN_COMPLETE",
          entityType: "ReturnRequest",
          entityId: result.id,
          entityName: `Sipariş #${result.orderId.slice(-8).toUpperCase()} İade Tamamlama & Ödeme İadesi`,
          riskLevel: "HIGH",
          oldValue: { status: "RECEIVED" },
          newValue: {
            status: "COMPLETED",
            refundAmount: result.refundAmount,
            refundMethod: result.refundMethod,
            completedAt: result.completedAt,
            adminNote: result.adminNote,
          },
        });
      } catch (auditErr) {
        console.error("Audit log hatası (İade Tamamlama):", auditErr);
      }

      // 🚀 MÜŞTERİ BİLDİRİMİ (RETURN_COMPLETED)
      try {
        await UserNotificationService.createNotification({
          userId: result.userId,
          type: "RETURN_COMPLETED",
          title: "İade Tutarı Hesabınıza Tanımlandı 💳",
          message: `#ORD-${result.orderId.slice(-8).toUpperCase()} nolu iade talebinize ait ${result.refundAmount.toLocaleString("tr-TR")} ₺ ödeme iadesi tamamlanmıştır.`,
          linkUrl: `/profile/orders/${result.orderId}`,
          entityType: "ReturnRequest",
          entityId: result.id,
        });
      } catch (notifErr) {
        console.error("Müşteri bildirim hatası (İade Tamamlama):", notifErr);
      }

      // 📧 TRANSACTIONAL EMAIL (RETURN_COMPLETED)
      if (result.user?.email) {
        try {
          await EmailService.sendReturnCompletedEmail(
            result.id,
            result.user.email,
            result.user.name || "Müşteri",
            result.refundAmount
          );
        } catch (emailErr) {
          console.error("Email send failed (Return Completed):", emailErr);
        }
      }

      revalidatePath("/admin/returns");
      revalidatePath("/admin/orders");
      revalidatePath("/profile");
      revalidatePath("/profile/notifications");
      revalidatePath(`/profile/orders/${result.orderId}`);
    }

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("completeReturnAction error:", error);
    return { success: false, error: getErrorMessage(error, "İade tamamlanırken hata oluştu.") };
  }
}

/**
 * Müşteri: Kendi İade Taleplerini Getir
 */
export async function getUserReturnsAction() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      return { success: false, error: "Geçerli e-posta bulunamadı." };
    }

    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!dbUser) {
      return { success: false, error: "Kullanıcı bulunamadı." };
    }

    const returns = await ReturnService.getUserReturnRequests(dbUser.id);
    return { success: true, data: returns };
  } catch (error: unknown) {
    console.error("getUserReturnsAction error:", error);
    return { success: false, error: "İade talepleri getirilemedi." };
  }
}

/**
 * Admin: Tüm İade Taleplerini Getir
 */
export async function getAdminReturnsAction(statusFilter?: ReturnStatus) {
  try {
    await requireAdmin("MANAGE_RETURNS");

    const returns = await ReturnService.getAdminReturnRequests(statusFilter);
    return { success: true, data: returns };
  } catch (error: unknown) {
    console.error("getAdminReturnsAction error:", error);
    return { success: false, error: "İade talepleri getirilemedi." };
  }
}
