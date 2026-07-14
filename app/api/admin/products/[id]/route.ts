import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

// Ortak Güvenlik Fonksiyonu
async function checkAdminAuth() {
  const clerkUser = await currentUser();
  if (!clerkUser) return false;
  
  const dbUser = await prisma.user.findUnique({
    where: { email: clerkUser.emailAddresses[0].emailAddress },
  });
  return dbUser?.role === "ADMIN";
}

// SİLME İŞLEMİ
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });

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

// GÜNCELLEME İŞLEMİ
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });

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
        sku,             
        isActive,        
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