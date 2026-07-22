import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 16 için Promise olarak tanımladık
) {
  try {
    await requireAdmin();
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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Kategori silme hatası detay:", error);
    return NextResponse.json({ error: "Kategori silinirken sistemsel bir hata oluştu." }, { status: 500 });
  }
}