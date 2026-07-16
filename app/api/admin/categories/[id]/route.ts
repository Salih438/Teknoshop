import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 16 için Promise olarak tanımladık
) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { email: clerkUser.emailAddresses[0].emailAddress },
    });
    if (!dbUser || dbUser.role !== "ADMIN") return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });

    // 🚀 YENİ KURAL: params nesnesini önce await ediyoruz!
    const resolvedParams = await params;
    const categoryId = resolvedParams.id;

    if (!categoryId) {
      return NextResponse.json({ error: "Geçersiz Kategori ID'si." }, { status: 400 });
    }

    // Ürün ilişkisi kontrolü
    const productCount = await prisma.product.count({
      where: { categoryId: categoryId },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Silinemez! Bu kategoriye ait ${productCount} adet ürün bulunuyor. Önce ürünleri silin veya kategorilerini değiştirin.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true, message: "Kategori başarıyla silindi." }, { status: 200 });

  } catch (error) {
    console.error("Kategori silme hatası detay:", error);
    return NextResponse.json({ error: "Kategori silinirken sistemsel bir hata oluştu." }, { status: 500 });
  }
}