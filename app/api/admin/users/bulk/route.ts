import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userIds, action } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Lütfen en az bir kullanıcı seçiniz." }, { status: 400 });
    }

    if (action === "activate") {
      const adminUser = await requireAdmin("MANAGE_USERS");

      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isActive: true },
      });

      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "USER_BULK_ACTIVATE",
        entityType: "User",
        riskLevel: AuditRiskLevel.MEDIUM,
        newValue: { userIdsCount: userIds.length, userIds },
      });

      return NextResponse.json({ success: true, message: `${userIds.length} kullanıcı hesabı aktifleştirildi.` });
    }

    if (action === "deactivate") {
      const adminUser = await requireAdmin("MANAGE_USERS");

      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isActive: false },
      });

      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "USER_BULK_DEACTIVATE",
        entityType: "User",
        riskLevel: AuditRiskLevel.HIGH,
        newValue: { userIdsCount: userIds.length, userIds },
      });

      return NextResponse.json({ success: true, message: `${userIds.length} kullanıcı hesabı pasifleştirildi.` });
    }

    if (action === "delete") {
      const adminUser = await requireAdmin("DELETE_USERS");

      // 🛡️ İLİŞKİSEL KORUMA: Sipariş, Adres veya İade/Değişim geçmişi olan kullanıcılar tespit edilir
      const usersWithHistory = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          OR: [
            { orders: { some: {} } },
            { addresses: { some: {} } },
            { returns: { some: {} } },
            { exchanges: { some: {} } },
            { reviews: { some: {} } },
          ],
        },
        select: { id: true },
      });

      const protectedUserIds = new Set(usersWithHistory.map((u) => u.id));
      const idsToHardDelete = userIds.filter((id) => !protectedUserIds.has(id));
      const idsToSoftDeactivate = userIds.filter((id) => protectedUserIds.has(id));

      // 1. İlişkisi bulunmayan kullanıcılar kalıcı silinir
      if (idsToHardDelete.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: idsToHardDelete } },
        });
      }

      // 2. Geçmiş işlemi olan kullanıcılar veri bütünlüğünü korumak adına pasife (isActive: false) alınır
      if (idsToSoftDeactivate.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: idsToSoftDeactivate } },
          data: { isActive: false },
        });
      }

      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "USER_BULK_DELETE",
        entityType: "User",
        riskLevel: AuditRiskLevel.CRITICAL,
        oldValue: {
          totalRequested: userIds.length,
          hardDeletedCount: idsToHardDelete.length,
          softDeactivatedCount: idsToSoftDeactivate.length,
        },
      });

      let responseMsg = "";
      if (idsToHardDelete.length > 0 && idsToSoftDeactivate.length > 0) {
        responseMsg = `${idsToHardDelete.length} adet test hesabı silindi. İşlem/sipariş geçmişi bulunan ${idsToSoftDeactivate.length} adet müşteri ise pasife alındı.`;
      } else if (idsToHardDelete.length > 0) {
        responseMsg = `${idsToHardDelete.length} kullanıcı kaydı tamamen silindi.`;
      } else {
        responseMsg = `Seçilen ${idsToSoftDeactivate.length} kullanıcının sipariş ve işlem geçmişi olduğu için hesapları silinmek yerine güvenle pasife alındı.`;
      }

      return NextResponse.json({ success: true, message: responseMsg });
    }

    return NextResponse.json({ error: "Geçersiz toplu aksiyon türü." }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Bulk User Action Error:", error);
    return NextResponse.json({ error: "Toplu işlem sırasında sunucu hatası oluştu." }, { status: 500 });
  }
}
