import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";

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
    await requireAdmin();

    const resolvedParams = await params;
    const productId = resolvedParams.id;

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({ message: "Ürün başarıyla silindi." }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
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
    await requireAdmin();

    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
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
    
    // 🚀 YENİ: Frontend'den gelen varyasyon JSON verisini yakalıyoruz
    const variantsData = formData.get("variants") as string | null;

    if (!name || !slug || !price || !categoryId || !brandId || !imageUrl) {
      return NextResponse.json({ error: "Lütfen tüm zorunlu alanları doldurun." }, { status: 400 });
    }

    let parsedVariants: ParsedVariant[] = [];
    if (variantsData) {
      try {
        const rawVariants = JSON.parse(variantsData) as Record<string, any>[];
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

    // 🚀 TRANSACTION MANTIĞI: Yabancı anahtar (Foreign Key) çökmesini engelleyen akıllı upsert algoritması
    const updatedProduct = await prisma.$transaction(async (tx) => {
      
      const existingVariants = await tx.productVariant.findMany({ where: { productId } });
      const variantsToCreate = [];
      const variantsToUpdate = [];

      // Sadece DB'den gelmiş ve hala DB'de olan ID'leri belirlemek için
      const existingIds = new Set(existingVariants.map(v => v.id));

      for (const pv of parsedVariants) {
        if (pv.id && existingIds.has(pv.id)) {
          variantsToUpdate.push(pv);
          existingIds.delete(pv.id); // Kalanlar silinecek
        } else {
          // Frontend crypto.randomUUID() vermiş olabilir, DB id'si değilse create atıyoruz
          // Ancak kombinasyon ismi eşleşirse onu update edebiliriz (Zero data loss fallback)
          const matchIndex = existingVariants.findIndex(
            (ev) => ev.combination === pv.combination || 
            (ev.color && ev.storage && `${ev.color} / ${ev.storage}` === pv.combination)
          );
          if (matchIndex !== -1 && existingIds.has(existingVariants[matchIndex].id)) {
            variantsToUpdate.push({ ...pv, id: existingVariants[matchIndex].id });
            existingIds.delete(existingVariants[matchIndex].id);
          } else {
            // DB id'si yok, yeni insert
            const { id, ...createData } = pv;
            variantsToCreate.push(createData);
          }
        }
      }

      const variantIdsToDelete = Array.from(existingIds);

      // 1. Silinen varyasyonların N+1 yaratmayan (Toplu / IN) şekilde yönetimi
      if (variantIdsToDelete.length > 0) {
        // Kullanımda olanları tek sorguda bul
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

        // Satılmışsa (kullanımdaysa) sadece aktifliği kapat ve stoğu sıfırla (Soft-Delete)
        if (idsToSoftDelete.length > 0) {
          await tx.productVariant.updateMany({
            where: { id: { in: idsToSoftDelete } },
            data: { stock: 0, isActive: false }
          });
        }

        // Hiç kullanılmamışsa fiziksel olarak sil (Hard-Delete)
        if (idsToHardDelete.length > 0) {
          await tx.productVariant.deleteMany({
            where: { id: { in: idsToHardDelete } }
          });
        }
      }

      // 2. Eşleşenleri güncelle
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

      // 3. Ürünü, görselleri ve YENİ varyasyonları güncelliyoruz
      return await tx.product.update({
        where: { id: productId },
        data: {
          name, 
          slug, 
          description, 
          price, 
          stock, 
          categoryId, 
          brandId,
          sku,            
          isActive,        
          images: {
            deleteMany: {}, 
            create: [{ imageUrl }] 
          },
          variants: variantsToCreate.length > 0 ? {
            create: variantsToCreate
          } : undefined
        }
      });
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Güncelleme hatası:", error);
    return NextResponse.json({ error: "Güncelleme işlemi başarısız oldu." }, { status: 500 });
  }
}