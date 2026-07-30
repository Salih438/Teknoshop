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
    await requireAdmin("MANAGE_BRANDS");
    const resolvedParams = await params;
    const brandId = resolvedParams.id;

    if (!brandId) {
      return NextResponse.json({ error: "Geçersiz Marka ID'si." }, { status: 400 });
    }

    // Ürün ilişkisi kontrolü
    const productCount = await prisma.product.count({
      where: { brandId: brandId },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Silinemez! Bu markaya ait ${productCount} adet ürün bulunuyor.` },
        { status: 400 }
      );
    }

    const brandToDelete = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { name: true },
    });

    await prisma.brand.delete({
      where: { id: brandId },
    });

    // 🛡️ DENETİM İZİ (Audit Log)
    await AuditLogService.createAuditLog({
      action: "DELETE_BRAND",
      entityType: "Brand",
      entityId: brandId,
      entityName: brandToDelete?.name || brandId,
      riskLevel: AuditRiskLevel.LOW,
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Marka silme hatası detay:", error);
    return NextResponse.json({ error: "Marka silinirken sistemsel bir hata oluştu." }, { status: 500 });
  }
}