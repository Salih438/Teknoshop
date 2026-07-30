import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";

// 🚀 DÜZELTME 1: 'any' hatasından kurtulmak için verinin tipini önden tanımlıyoruz
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
    await requireAdmin();

    const formData = await request.formData();
    
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const stock = parseInt(formData.get("stock") as string, 10);
    const categoryId = formData.get("categoryId") as string;
    const brandId = formData.get("brandId") as string;
    const imageUrl = formData.get("imageUrl") as string; 

    const skuData = formData.get("sku") as string;
    const sku = skuData ? skuData.trim() : undefined; 
    
    const isActive = formData.get("isActive") === "true"; 

    // Frontend'den gelen varyasyon JSON verisini yakalıyoruz
    const variantsData = formData.get("variants") as string | null;

    if (!name || !slug || !price || !categoryId || !brandId || !imageUrl) {
      return NextResponse.json({ error: "Lütfen tüm zorunlu alanları doldurun." }, { status: 400 });
    }

    // 🚀 DÜZELTME 2: Tanımladığımız 'ParsedVariant' tipini kullanıyoruz
    let parsedVariants: ParsedVariant[] = [];
    
    if (variantsData) {
      try {
        // Gelen JSON stringini Record (Obje) dizisi olarak işliyoruz
        // VariantRow { combination, price, discountedPrice, stock, sku, isActive }
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

    // 🚀 GÜVENLİK DUVARI: Mükerrer (Duplicate) Varyasyon Kontrolü
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

    const newProduct = await prisma.product.create({
      data: {
        name: name,
        slug: slug,
        description: description,
        price: price,
        stock: stock,
        categoryId: categoryId,
        brandId: brandId,
        sku: sku,               
        isActive: isActive,
        imageUrl: imageUrl, 
        images: {
          create: [
            { imageUrl: imageUrl } 
          ]
        },
        // Eğer admin varyasyon eklediyse, Prisma bunları da tek seferde (Atomic) ürüne bağlayıp kaydedecek
        ...(parsedVariants.length > 0 && {
          variants: {
            create: parsedVariants
          }
        })
      }
    });

    return NextResponse.json(newProduct, { status: 201 });
    
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Ürün eklenirken sunucu hatası oluştu:", error);
    return NextResponse.json({ error: "Sunucu hatası yaşandı." }, { status: 500 });
  }
}