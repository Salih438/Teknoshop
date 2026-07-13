// app/api/admin/products/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Formdan gelen verileri teslim alıyoruz
    const formData = await request.formData();
    
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const stock = parseInt(formData.get("stock") as string, 10);
    const categoryId = formData.get("categoryId") as string;
    const brandId = formData.get("brandId") as string;
    const imageUrl = formData.get("imageUrl") as string;

    // YENİ EKLENEN ALANLARI YAKALAMA
    const skuData = formData.get("sku") as string;
    // SKU boş girildiyse null atıyoruz ki veritabanında "benzersizlik" (unique) çakışması yapmasın
    const sku = skuData ? skuData.trim() : undefined; 
    
    // Checkbox'tan gelen "true" / "false" string değerini gerçek Boolean'a çeviriyoruz
    const isActive = formData.get("isActive") === "true"; 

    // Basit bir güvenlik kontrolü (Boş alan var mı?)
    if (!name || !slug || !price || !categoryId || !brandId || !imageUrl) {
      return NextResponse.json({ error: "Lütfen tüm zorunlu alanları doldurun." }, { status: 400 });
    }

    // Prisma ile veritabanına KUSURSUZ İLİŞKİSEL KAYIT yapıyoruz
    const newProduct = await prisma.product.create({
      data: {
        name: name,
        slug: slug,
        description: description,
        price: price,
        stock: stock,
        categoryId: categoryId,
        brandId: brandId,
        sku: sku,               // YENİ: Veritabanına yazılıyor
        isActive: isActive,     // YENİ: Veritabanına yazılıyor
        images: {
          create: [
            { imageUrl: imageUrl }
          ]
        }
      }
    });

    // Başarılı olursa 201 (Oluşturuldu) koduyla ürünü geri gönder
    return NextResponse.json(newProduct, { status: 201 });
    
  } catch (error) {
    console.error("Ürün eklenirken sunucu hatası oluştu:", error);
    return NextResponse.json({ error: "Sunucu hatası yaşandı." }, { status: 500 });
  }
}