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
    const brandId = resolvedParams.id;

    if (!brandId) {
      return NextResponse.json({ error: "Geçersiz Marka ID'si." }, { status: 400 });
    }

    // Ürün ilişkisi kontrolü
    const productCount = await prisma.product.count({
      where: { brandId: brandId },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Silinemez! Bu markaya ait ${productCount} adet ürün bulunuyor.` },
        { status: 400 }
      );
    }

    await prisma.brand.delete({
      where: { id: brandId },
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    // Terminalde hata detayını görmek için log ekledik
    console.error("Marka silme hatası detay:", error);
    return NextResponse.json({ error: "Marka silinirken sistemsel bir hata oluştu." }, { status: 500 });
  }
}