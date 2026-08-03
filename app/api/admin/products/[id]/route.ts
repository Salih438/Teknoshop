import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";

type ParsedVariant = {
  id?: string;
  combination: string;
  price: number | null;
  discountedPrice: number | null;
  stock: number;
  sku: string | null;
  isActive: boolean;
};

// SİLME İŞLEMİ
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("DELETE_PRODUCTS");

    const resolvedParams = await params;
    const productId = resolvedParams.id;

    const productToDelete = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    // 🛡️ DENETİM İZİ (Audit Log)
    await AuditLogService.createAuditLog({
      action: "DELETE_PRODUCT",
      entityType: "Product",
      entityId: productId,
      entityName: productToDelete?.name || productId,
      riskLevel: AuditRiskLevel.HIGH,
    });

    return NextResponse.json({ message: "Ürün başarıyla silindi." }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const code = (error as { code?: string })?.code;
    const message = error instanceof Error ? error.message : "";
    if (
      code === "P2003" ||
      (message.includes("Foreign key") || message.includes("OrderItem") || message.includes("cartItem"))
    ) {
      return NextResponse.json(
        { error: "Bu ürün geçmiş siparişlerde yer aldığı için silinemez. Ürünü silmek yerine pasife alabilirsiniz." },
        { status: 400 }
      );
    }

    console.error("Ürün silinirken hata:", error);
    return NextResponse.json({ error: "Silme işlemi başarısız oldu." }, { status: 500 });
  }
}

// GÜNCELLEME İŞLEMİ
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("MANAGE_PRODUCTS");

    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const comparePriceInput = formData.get("comparePrice") as string | null;
    const comparePrice = comparePriceInput && comparePriceInput.trim() !== "" ? parseFloat(comparePriceInput) : null;
    const stock = parseInt(formData.get("stock") as string, 10);
    const categoryId = formData.get("categoryId") as string;
    const brandId = formData.get("brandId") as string;
    const imageUrl = formData.get("imageUrl") as string;

    const skuData = formData.get("sku") as string;
    const sku = skuData ? skuData.trim() : undefined; 
    const isActive = formData.get("isActive") === "true";
    
    const variantsData = formData.get("variants") as string | null;

    if (!name || !slug || !price || !categoryId || !brandId || !imageUrl) {
      return NextResponse.json({ error: "Lütfen tüm zorunlu alanları doldurun." }, { status: 400 });
    }

    if (comparePrice !== null && !isNaN(comparePrice) && comparePrice <= price) {
      return NextResponse.json(
        { error: "Karşılaştırma fiyatı (eski fiyat), satış fiyatından büyük olmalıdır." },
        { status: 400 }
      );
    }

    const galleryImagesData = formData.get("galleryImages") as string | null;
    let galleryImages: string[] = [];
    if (galleryImagesData) {
      try {
        galleryImages = JSON.parse(galleryImagesData);
      } catch {
        galleryImages = [];
      }
    }

    let parsedVariants: ParsedVariant[] = [];
    if (variantsData) {
      try {
        const rawVariants = JSON.parse(variantsData) as Record<string, unknown>[];
        parsedVariants = rawVariants.map((v) => ({
          id: typeof v.id === "string" ? v.id : undefined,
          combination: String(v.combination),
          price: v.price !== null && v.price !== undefined && String(v.price).trim() !== "" ? parseFloat(String(v.price)) : null,
          discountedPrice: v.discountedPrice !== null && v.discountedPrice !== undefined && String(v.discountedPrice).trim() !== "" ? parseFloat(String(v.discountedPrice)) : null,
          stock: typeof v.stock === "number" ? v.stock : parseInt(String(v.stock), 10) || 0,
          sku: typeof v.sku === "string" && v.sku.trim() !== "" ? v.sku.trim() : null,
          isActive: Boolean(v.isActive),
        }));
      } catch {
        return NextResponse.json({ error: "Varyasyon verisi işlenemedi." }, { status: 400 });
      }
    }

    if (parsedVariants.length > 0) {
      const seenVariants = new Set<string>();
      for (const v of parsedVariants) {
        const key = v.combination;
        if (seenVariants.has(key)) {
          return NextResponse.json({ 
            error: `Aynı kombinasyon birden fazla kez eklenemez: ${v.combination}` 
          }, { status: 400 });
        }
        seenVariants.add(key);
      }
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const existingVariants = await tx.productVariant.findMany({ where: { productId } });
      const variantsToCreate = [];
      const variantsToUpdate = [];

      const existingIds = new Set(existingVariants.map(v => v.id));

      for (const pv of parsedVariants) {
        if (pv.id && existingIds.has(pv.id)) {
          variantsToUpdate.push(pv);
          existingIds.delete(pv.id);
        } else {
          const matchIndex = existingVariants.findIndex(
            (ev) => ev.combination === pv.combination || 
            (ev.color && ev.storage && `${ev.color} / ${ev.storage}` === pv.combination)
          );
          if (matchIndex !== -1 && existingIds.has(existingVariants[matchIndex].id)) {
            variantsToUpdate.push({ ...pv, id: existingVariants[matchIndex].id });
            existingIds.delete(existingVariants[matchIndex].id);
          } else {
            const { id, ...createData } = pv;
            variantsToCreate.push(createData);
          }
        }
      }

      const variantIdsToDelete = Array.from(existingIds);

      if (variantIdsToDelete.length > 0) {
        const [usedInOrders, usedInCarts] = await Promise.all([
          tx.orderItem.findMany({ 
            where: { variantId: { in: variantIdsToDelete } }, 
            select: { variantId: true } 
          }),
          tx.cartItem.findMany({ 
            where: { variantId: { in: variantIdsToDelete } }, 
            select: { variantId: true } 
          })
        ]);

        const usedIds = new Set([
          ...usedInOrders.map(o => o.variantId),
          ...usedInCarts.map(c => c.variantId)
        ]);

        const idsToSoftDelete = variantIdsToDelete.filter(id => usedIds.has(id));
        const idsToHardDelete = variantIdsToDelete.filter(id => !usedIds.has(id));

        if (idsToSoftDelete.length > 0) {
          await tx.productVariant.updateMany({
            where: { id: { in: idsToSoftDelete } },
            data: { stock: 0, isActive: false }
          });
        }

        if (idsToHardDelete.length > 0) {
          await tx.productVariant.deleteMany({
            where: { id: { in: idsToHardDelete } }
          });
        }
      }

      for (const vu of variantsToUpdate) {
        await tx.productVariant.update({
          where: { id: vu.id },
          data: { 
            combination: vu.combination,
            price: vu.price, 
            discountedPrice: vu.discountedPrice,
            stock: vu.stock,
            sku: vu.sku,
            isActive: vu.isActive
          }
        });
      }

      return await tx.product.update({
        where: { id: productId },
        data: {
          name, 
          slug, 
          description, 
          price, 
          comparePrice,
          stock, 
          categoryId, 
          brandId,
          sku,            
          isActive,        
          images: {
            deleteMany: {}, 
            ...(galleryImages.length > 0 && {
              create: galleryImages.map(url => ({ imageUrl: url }))
            })
          },
          variants: variantsToCreate.length > 0 ? {
            create: variantsToCreate
          } : undefined
        }
      });
    });

    // 🛡️ DENETİM İZİ (Audit Log)
    await AuditLogService.createAuditLog({
      action: "UPDATE_PRODUCT",
      entityType: "Product",
      entityId: updatedProduct.id,
      entityName: updatedProduct.name,
      riskLevel: AuditRiskLevel.LOW,
      newValue: { name: updatedProduct.name, price: updatedProduct.price, stock: updatedProduct.stock },
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const code = (error as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Bu SKU veya URL adresi (slug) zaten başka bir ürün tarafından kullanılıyor." },
        { status: 400 }
      );
    }
    console.error("Güncelleme hatası:", error);
    return NextResponse.json({ error: "Güncelleme işlemi başarısız oldu." }, { status: 500 });
  }
}