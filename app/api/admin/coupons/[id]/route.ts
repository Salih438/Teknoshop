import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("MANAGE_COUPONS");

    const resolvedParams = await params;
    const couponId = resolvedParams.id;

    if (!couponId) {
      return NextResponse.json({ error: "Geçersiz Kupon ID'si." }, { status: 400 });
    }

    const couponToDelete = await prisma.coupon.findUnique({
      where: { id: couponId },
      select: { code: true },
    });

    await prisma.coupon.update({
      where: { id: couponId },
      data: { 
        isDeleted: true,
        isActive: false
      },
    });

    // 🛡️ DENETİM İZİ (Audit Log)
    await AuditLogService.createAuditLog({
      action: "DELETE_COUPON",
      entityType: "Coupon",
      entityId: couponId,
      entityName: couponToDelete?.code || couponId,
      riskLevel: AuditRiskLevel.HIGH,
    });

    return NextResponse.json({ success: true, message: "Kupon başarıyla silindi." }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Kupon silme hatası detay:", error);
    return NextResponse.json({ error: "Kupon silinirken sistemsel bir hata oluştu." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("MANAGE_COUPONS");

    const resolvedParams = await params;
    const couponId = resolvedParams.id;

    if (!couponId) {
      return NextResponse.json({ error: "Geçersiz Kupon ID'si." }, { status: 400 });
    }

    const body = await request.json();
    const { isActive } = body;

    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: { isActive },
    });

    // 🛡️ DENETİM İZİ (Audit Log)
    await AuditLogService.createAuditLog({
      action: "UPDATE_COUPON_STATUS",
      entityType: "Coupon",
      entityId: couponId,
      entityName: updatedCoupon.code,
      riskLevel: AuditRiskLevel.LOW,
      newValue: { isActive: updatedCoupon.isActive },
    });

    return NextResponse.json({ success: true, data: updatedCoupon }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Kupon güncelleme hatası:", error);
    return NextResponse.json({ error: "Kupon güncellenirken hata oluştu." }, { status: 500 });
  }
}