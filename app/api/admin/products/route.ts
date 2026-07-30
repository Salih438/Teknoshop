import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";

type ParsedVariant = {
  combination: string;
  price: number | null;
  discountedPrice: number | null;
  stock: number;
  sku: string | null;
  isActive: boolean;
};

export async function POST(request: Request) {
  try {
    await requireAdmin("MANAGE_PRODUCTS");

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

    if (typeof price === "number" && (isNaN(price) || price < 0)) {
      return NextResponse.json({ error: "Ürün fiyatı negatif olamaz." }, { status: 400 });
    }

    if (comparePrice !== null && !isNaN(comparePrice) && comparePrice <= price) {
      return NextResponse.json(
        { error: "Karşılaştırma fiyatı (eski fiyat), satış fiyatından büyük olmalıdır." },
        { status: 400 }
      );
    }

    if (typeof stock === "number" && (isNaN(stock) || stock < 0)) {
      return NextResponse.json({ error: "Stok miktarı negatif olamaz." }, { status: 400 });
    }

    let parsedVariants: ParsedVariant[] = [];
    
    if (variantsData) {
      try {
        const rawVariants = JSON.parse(variantsData) as Record<string, any>[];
        
        parsedVariants = rawVariants.map((v) => ({
          combination: v.combination,
          price: v.price ? parseFloat(v.price) : null,
          discountedPrice: v.discountedPrice ? parseFloat(v.discountedPrice) : null,
          stock: parseInt(v.stock, 10) || 0,
          sku: v.sku?.trim() || null,
          isActive: Boolean(v.isActive),
        }));
      } catch {
        return NextResponse.json({ error: "Varyasyon verisi işlenemedi veya bozuk formatta." }, { status: 400 });
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

    const galleryImagesData = formData.get("galleryImages") as string | null;
    let galleryImages: string[] = [];
    if (galleryImagesData) {
      try {
        galleryImages = JSON.parse(galleryImagesData);
      } catch {
        galleryImages = [];
      }
    }

    const newProduct = await prisma.product.create({
      data: {
        name: name,
        slug: slug,
        description: description,
        price: price,
        comparePrice: comparePrice,
        stock: stock,
        categoryId: categoryId,
        brandId: brandId,
        sku: sku,               
        isActive: isActive,
        imageUrl: imageUrl, 
        ...(galleryImages.length > 0 && {
          images: {
            create: galleryImages.map(url => ({ imageUrl: url }))
          }
        }),
        ...(parsedVariants.length > 0 && {
          variants: {
            create: parsedVariants
          }
        })
      }
    });

    // 🛡️ DENETİM İZİ (Audit Log)
    await AuditLogService.createAuditLog({
      action: "CREATE_PRODUCT",
      entityType: "Product",
      entityId: newProduct.id,
      entityName: newProduct.name,
      riskLevel: AuditRiskLevel.MEDIUM,
      newValue: { name: newProduct.name, price: newProduct.price, stock: newProduct.stock },
    });

    return NextResponse.json(newProduct, { status: 201 });
    
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Bu SKU veya URL adresi (slug) zaten başka bir ürün tarafından kullanılıyor." },
        { status: 400 }
      );
    }
    console.error("Ürün eklenirken sunucu hatası oluştu:", error);
    return NextResponse.json({ error: "Sunucu hatası yaşandı." }, { status: 500 });
  }
}