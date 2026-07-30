import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { productIds, action, targetId } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "Lütfen en az bir ürün seçiniz." }, { status: 400 });
    }

    if (action === "delete") {
      await requireAdmin("DELETE_PRODUCTS");
    } else {
      await requireAdmin("MANAGE_PRODUCTS");
    }

    if (action === "activate") {
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { isActive: true },
      });

      await AuditLogService.createAuditLog({
        action: "BULK_PRODUCT_ACTIVATE",
        entityType: "Product",
        riskLevel: AuditRiskLevel.MEDIUM,
        newValue: { count: productIds.length, productIds },
      });

      return NextResponse.json({ success: true, message: `${productIds.length} ürün aktifleştirildi.` });
    }

    if (action === "deactivate") {
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { isActive: false },
      });

      await AuditLogService.createAuditLog({
        action: "BULK_PRODUCT_DEACTIVATE",
        entityType: "Product",
        riskLevel: AuditRiskLevel.MEDIUM,
        newValue: { count: productIds.length, productIds },
      });

      return NextResponse.json({ success: true, message: `${productIds.length} ürün pasifleştirildi.` });
    }

    if (action === "changeCategory" && targetId) {
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { categoryId: targetId },
      });

      await AuditLogService.createAuditLog({
        action: "BULK_PRODUCT_CHANGE_CATEGORY",
        entityType: "Product",
        riskLevel: AuditRiskLevel.MEDIUM,
        newValue: { count: productIds.length, targetId },
      });

      return NextResponse.json({ success: true, message: `${productIds.length} ürünün kategorisi değiştirildi.` });
    }

    if (action === "changeBrand" && targetId) {
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { brandId: targetId },
      });

      await AuditLogService.createAuditLog({
        action: "BULK_PRODUCT_CHANGE_BRAND",
        entityType: "Product",
        riskLevel: AuditRiskLevel.MEDIUM,
        newValue: { count: productIds.length, targetId },
      });

      return NextResponse.json({ success: true, message: `${productIds.length} ürünün markası değiştirildi.` });
    }

    if (action === "delete") {
      const usedInOrders = await prisma.orderItem.findMany({
        where: { productId: { in: productIds } },
        select: { productId: true },
      });

      const orderedProductIds = new Set(usedInOrders.map((o) => o.productId));
      const idsToSoftDelete = productIds.filter((id: string) => orderedProductIds.has(id));
      const idsToHardDelete = productIds.filter((id: string) => !orderedProductIds.has(id));

      if (idsToSoftDelete.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: idsToSoftDelete } },
          data: { isActive: false },
        });
      }

      if (idsToHardDelete.length > 0) {
        await prisma.product.deleteMany({
          where: { id: { in: idsToHardDelete } },
        });
      }

      await AuditLogService.createAuditLog({
        action: "BULK_PRODUCT_DELETE",
        entityType: "Product",
        riskLevel: AuditRiskLevel.HIGH,
        newValue: { hardDeletedCount: idsToHardDelete.length, softDeletedCount: idsToSoftDelete.length },
      });

      let message = `${idsToHardDelete.length} adet ürün başarıyla silindi.`;
      if (idsToSoftDelete.length > 0) {
        message += ` Geçmiş siparişlerde yer alan ${idsToSoftDelete.length} adet ürün ise satış verisi bütünlüğü için pasife alındı.`;
      }

      return NextResponse.json({ success: true, message });
    }

    return NextResponse.json({ error: "Geçersiz toplu aksiyon türü." }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Bulk Product Action Error:", error);
    return NextResponse.json({ error: "Toplu işlem sırasında sunucu hatası oluştu." }, { status: 500 });
  }
}
