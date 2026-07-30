import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";

export async function PATCH(request: Request) {
  try {
    const adminUser = await requireAdmin("MANAGE_COUPONS");

    const body = await request.json();
    const { couponIds, action } = body;

    if (!Array.isArray(couponIds) || couponIds.length === 0) {
      return NextResponse.json({ error: "Lütfen en az bir kupon seçiniz." }, { status: 400 });
    }

    if (action === "activate") {
      await prisma.coupon.updateMany({
        where: { id: { in: couponIds } },
        data: { isActive: true },
      });

      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "COUPON_BULK_ACTIVATE",
        entityType: "Coupon",
        riskLevel: AuditRiskLevel.MEDIUM,
        newValue: { couponIdsCount: couponIds.length, couponIds },
      });

      return NextResponse.json({ success: true, message: `${couponIds.length} kupon aktifleştirildi.` });
    }

    if (action === "deactivate") {
      await prisma.coupon.updateMany({
        where: { id: { in: couponIds } },
        data: { isActive: false },
      });

      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "COUPON_BULK_DEACTIVATE",
        entityType: "Coupon",
        riskLevel: AuditRiskLevel.MEDIUM,
        newValue: { couponIdsCount: couponIds.length, couponIds },
      });

      return NextResponse.json({ success: true, message: `${couponIds.length} kupon pasifleştirildi.` });
    }

    if (action === "delete") {
      // 🛡️ FK SAFEGUARD: Veri bütünlüğü ve geçmiş sipariş ilişkilerini korumak adına yumuşak silme (soft-delete)
      await prisma.coupon.updateMany({
        where: { id: { in: couponIds } },
        data: { isDeleted: true, isActive: false },
      });

      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "COUPON_BULK_DELETE",
        entityType: "Coupon",
        riskLevel: AuditRiskLevel.HIGH,
        oldValue: { couponIdsCount: couponIds.length, couponIds },
      });

      return NextResponse.json({ success: true, message: `${couponIds.length} kupon kaydı başarıyla silindi.` });
    }

    return NextResponse.json({ error: "Geçersiz toplu aksiyon." }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Bulk Coupon Action Error:", error);
    return NextResponse.json({ error: "Toplu işlem sırasında hata oluştu." }, { status: 500 });
  }
}
