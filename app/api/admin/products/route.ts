import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    // --- GÜVENLİK DUVARI BAŞLANGICI ---
    const clerkUser = await currentUser();
    if (!clerkUser) return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { email: clerkUser.emailAddresses[0].emailAddress },
    });
    if (!dbUser || dbUser.role !== "ADMIN") return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
    // --- GÜVENLİK DUVARI BİTİŞİ ---

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

    if (!name || !slug || !price || !categoryId || !brandId || !imageUrl) {
      return NextResponse.json({ error: "Lütfen tüm zorunlu alanları doldurun." }, { status: 400 });
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
        images: {
          create: [
            { imageUrl: imageUrl }
          ]
        }
      }
    });

    return NextResponse.json(newProduct, { status: 201 });
    
  } catch (error) {
    console.error("Ürün eklenirken sunucu hatası oluştu:", error);
    return NextResponse.json({ error: "Sunucu hatası yaşandı." }, { status: 500 });
  }
}