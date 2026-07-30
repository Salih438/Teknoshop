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
    await requireAdmin("MANAGE_CATEGORIES");
    const resolvedParams = await params;
    const categoryId = resolvedParams.id;

    if (!categoryId) {
      return NextResponse.json({ error: "Geçersiz Kategori ID'si." }, { status: 400 });
    }

    // Ürün ilişkisi kontrolü
    const productCount = await prisma.product.count({
      where: { categoryId: categoryId },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Silinemez! Bu kategoriye ait ${productCount} adet ürün bulunuyor. Önce ürünleri silin veya kategorilerini değiştirin.` },
        { status: 400 }
      );
    }

    const categoryToDelete = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });

    await prisma.category.delete({
      where: { id: categoryId },
    });

    // 🛡️ DENETİM İZİ (Audit Log)
    await AuditLogService.createAuditLog({
      action: "DELETE_CATEGORY",
      entityType: "Category",
      entityId: categoryId,
      entityName: categoryToDelete?.name || categoryId,
      riskLevel: AuditRiskLevel.LOW,
    });

    return NextResponse.json({ success: true, message: "Kategori başarıyla silindi." }, { status: 200 });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Kategori silme hatası detay:", error);
    return NextResponse.json({ error: "Kategori silinirken sistemsel bir hata oluştu." }, { status: 500 });
  }
}