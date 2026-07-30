import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";

export async function POST(request: Request) {
  try {
    await requireAdmin("MANAGE_PRODUCTS");

    const body = await request.json();
    const { action, productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Geçersiz ürün ID." }, { status: 400 });
    }

    // 🚀 1. HIZLI STOK GÜNCELLEME
    if (action === "updateStock") {
      const { newStock } = body;
      if (typeof newStock !== "number" || newStock < 0) {
        return NextResponse.json({ error: "Geçersiz stok miktarı." }, { status: 400 });
      }

      const existing = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, stock: true },
      });

      const updated = await prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      await AuditLogService.createAuditLog({
        action: "PRODUCT_STOCK_UPDATE",
        entityType: "Product",
        entityId: productId,
        entityName: existing?.name || "Ürün",
        riskLevel: AuditRiskLevel.LOW,
        oldValue: { stock: existing?.stock },
        newValue: { stock: newStock },
      });

      return NextResponse.json({ success: true, product: updated });
    }

    // 🚀 2. HIZLI FİYAT GÜNCELLEME
    if (action === "updatePrice") {
      const { price, comparePrice } = body;
      if (typeof price !== "number" || price < 0) {
        return NextResponse.json({ error: "Geçersiz fiyat miktarı." }, { status: 400 });
      }

      const existing = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, price: true, comparePrice: true },
      });

      const updated = await prisma.product.update({
        where: { id: productId },
        data: {
          price,
          comparePrice: typeof comparePrice === "number" ? comparePrice : null,
        },
      });

      await AuditLogService.createAuditLog({
        action: "PRODUCT_PRICE_UPDATE",
        entityType: "Product",
        entityId: productId,
        entityName: existing?.name || "Ürün",
        riskLevel: AuditRiskLevel.LOW,
        oldValue: { price: existing?.price, comparePrice: existing?.comparePrice },
        newValue: { price, comparePrice },
      });

      return NextResponse.json({ success: true, product: updated });
    }

    // 🚀 3. AKTİFLİK TOGGLE
    if (action === "toggleActive") {
      const existing = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, isActive: true },
      });
      if (!existing) {
        return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
      }

      const updated = await prisma.product.update({
        where: { id: productId },
        data: { isActive: !existing.isActive },
      });

      await AuditLogService.createAuditLog({
        action: "PRODUCT_TOGGLE_ACTIVE",
        entityType: "Product",
        entityId: productId,
        entityName: existing.name,
        riskLevel: AuditRiskLevel.LOW,
        oldValue: { isActive: existing.isActive },
        newValue: { isActive: updated.isActive },
      });

      return NextResponse.json({ success: true, isActive: updated.isActive });
    }

    // 🚀 4. ÜRÜN ÇOĞALT (DUPLICATE PRODUCT)
    if (action === "duplicateProduct") {
      const originalProduct = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          images: true,
          variants: true,
        },
      });

      if (!originalProduct) {
        return NextResponse.json({ error: "Kopyalanacak ürün bulunamadı." }, { status: 404 });
      }

      const timestamp = Date.now().toString().slice(-5);
      const newSlug = `${originalProduct.slug}-kopya-${timestamp}`;
      const newSku = originalProduct.sku ? `${originalProduct.sku}-COPY-${timestamp}` : `SKU-COPY-${timestamp}`;

      const newProduct = await prisma.product.create({
        data: {
          name: `${originalProduct.name} (Kopya)`,
          slug: newSlug,
          description: originalProduct.description,
          price: originalProduct.price,
          comparePrice: originalProduct.comparePrice,
          stock: originalProduct.stock,
          imageUrl: originalProduct.imageUrl,
          sku: newSku,
          isActive: false,
          categoryId: originalProduct.categoryId,
          brandId: originalProduct.brandId,
          images: {
            create: originalProduct.images.map((img) => ({
              imageUrl: img.imageUrl,
            })),
          },
          variants: {
            create: originalProduct.variants.map((v) => ({
              color: v.color,
              storage: v.storage,
              combination: v.combination,
              discountedPrice: v.discountedPrice,
              price: v.price,
              stock: v.stock,
              sku: v.sku ? `${v.sku}-COPY-${timestamp}` : undefined,
            })),
          },
        },
      });

      await AuditLogService.createAuditLog({
        action: "PRODUCT_DUPLICATE",
        entityType: "Product",
        entityId: newProduct.id,
        entityName: newProduct.name,
        riskLevel: AuditRiskLevel.MEDIUM,
        oldValue: { originalId: originalProduct.id },
        newValue: { newProductId: newProduct.id, sku: newSku },
      });

      return NextResponse.json({ success: true, newProduct });
    }

    return NextResponse.json({ error: "Geçersiz aksiyon türü." }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Quick Product Action Error:", error);
    return NextResponse.json({ error: "İşlem sırasında sunucu hatası oluştu." }, { status: 500 });
  }
}
