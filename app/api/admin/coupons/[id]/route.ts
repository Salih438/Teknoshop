import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const resolvedParams = await params;
    const couponId = resolvedParams.id;

    if (!couponId) {
      return NextResponse.json({ error: "Geçersiz Kupon ID'si." }, { status: 400 });
    }

    // 🚀 SOFT-DELETE MİMARİSİ
    // Artık fiziksel silme (prisma.coupon.delete) YAPMIYORUZ.
    // Kullanım sayısını (usageCount) kontrol edip admini engellemeye gerek kalmadı.
    // Veriyi güvenli bir şekilde pasife ve "silinmiş" statüsüne çekiyoruz.
    await prisma.coupon.update({
      where: { id: couponId },
      data: { 
        isDeleted: true,  // Mantıksal olarak silindi
        isActive: false   // Güvenlik amaçlı aynı zamanda pasife alındı
      },
    });

    return NextResponse.json({ success: true, message: "Kupon başarıyla silindi." }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Kupon silme hatası detay:", error);
    return NextResponse.json({ error: "Kupon silinirken sistemsel bir hata oluştu." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const resolvedParams = await params;
    const couponId = resolvedParams.id;

    if (!couponId) {
      return NextResponse.json({ error: "Geçersiz Kupon ID'si." }, { status: 400 });
    }

    const body = await request.json();
    const { isActive } = body;

    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: { isActive },
    });

    return NextResponse.json({ success: true, data: updatedCoupon }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Kupon güncelleme hatası:", error);
    return NextResponse.json({ error: "Kupon güncellenirken hata oluştu." }, { status: 500 });
  }
}