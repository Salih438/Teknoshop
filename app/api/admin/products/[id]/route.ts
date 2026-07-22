import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";

// 🚀 ESLint 'any' hatasından kaçınmak için tip tanımı
type ParsedVariant = {
  color: string | null;
  storage: string | null;
  price: number | null;
  stock: number;
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

    // 🚀 YENİ: Varyasyonları parse edip güvenli formata çeviriyoruz
    let parsedVariants: ParsedVariant[] = [];
    if (variantsData) {
      try {
        const rawVariants = JSON.parse(variantsData) as Record<string, unknown>[];
        parsedVariants = rawVariants.map((v) => ({
          color: typeof v.color === "string" && v.color.trim() !== "" ? v.color.trim() : null,
          storage: typeof v.storage === "string" && v.storage.trim() !== "" ? v.storage.trim() : null,
          price: v.price !== null && v.price !== undefined && String(v.price).trim() !== "" ? parseFloat(String(v.price)) : null,
          stock: typeof v.stock === "number" ? v.stock : parseInt(String(v.stock), 10) || 0,
        }));
      } catch {
        return NextResponse.json({ error: "Varyasyon verisi işlenemedi." }, { status: 400 });
      }
    }

    // 🚀 GÜVENLİK DUVARI: Mükerrer (Duplicate) Varyasyon Kontrolü
    if (parsedVariants.length > 0) {
      const seenVariants = new Set<string>();
      for (const v of parsedVariants) {
        const key = `${v.color || "null"}-${v.storage || "null"}`;
        if (seenVariants.has(key)) {
          return NextResponse.json({ 
            error: `Aynı renk ve hafıza kombinasyonu birden fazla kez eklenemez: ${v.color || "Belirtilmemiş"} / ${v.storage || "Belirtilmemiş"}` 
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

      for (const pv of parsedVariants) {
        const matchIndex = existingVariants.findIndex(
          (ev) => ev.color === pv.color && ev.storage === pv.storage
        );
        if (matchIndex !== -1) {
          variantsToUpdate.push({ id: existingVariants[matchIndex].id, ...pv });
          existingVariants.splice(matchIndex, 1); 
        } else {
          variantsToCreate.push(pv);
        }
      }

      // 1. Silinen varyasyonların N+1 yaratmayan (Toplu / IN) şekilde yönetimi
      if (existingVariants.length > 0) {
        const variantIdsToDelete = existingVariants.map(v => v.id);

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

        // Satılmışsa (kullanımdaysa) sadece stok sıfırla (Soft-Delete)
        if (idsToSoftDelete.length > 0) {
          await tx.productVariant.updateMany({
            where: { id: { in: idsToSoftDelete } },
            data: { stock: 0 }
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
          data: { price: vu.price, stock: vu.stock }
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