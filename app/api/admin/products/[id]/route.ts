// app/api/admin/products/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// SİLME İŞLEMİ (Mevcut kodunu koruyoruz)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({ message: "Ürün başarıyla silindi." }, { status: 200 });
  } catch (error) {
    console.error("Ürün silinirken hata:", error);
    return NextResponse.json({ error: "Silme işlemi başarısız oldu." }, { status: 500 });
  }
}

// GÜNCELLEME İŞLEMİ (Yeni alanlar eklendi)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
    // Formdan gelen verileri alıyoruz
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const stock = parseInt(formData.get("stock") as string, 10);
    const categoryId = formData.get("categoryId") as string;
    const brandId = formData.get("brandId") as string;
    const imageUrl = formData.get("imageUrl") as string;

    // YENİ: SKU ve Aktif/Pasif durumunu yakalıyoruz
    const skuData = formData.get("sku") as string;
    const sku = skuData ? skuData.trim() : undefined; 
    const isActive = formData.get("isActive") === "true";

    // Prisma ile mevcut ürünü güncelliyoruz
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name, 
        slug, 
        description, 
        price, 
        stock, 
        categoryId, 
        brandId,
        sku,             // YENİ: Veritabanında güncellenir
        isActive,        // YENİ: Veritabanında güncellenir
        // Eski resmi silip yenisini ekleyen taktiğin
        images: {
          deleteMany: {}, 
          create: [{ imageUrl }] 
        }
      }
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    return NextResponse.json({ error: "Güncelleme işlemi başarısız oldu." }, { status: 500 });
  }
}