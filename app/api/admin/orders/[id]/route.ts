// app/api/admin/orders/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. GÜVENLİK DUVARI: İstek atan kişi sisteme giriş yapmış mı?
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: "Yetkisiz erişim: Lütfen önce giriş yapın." },
        { status: 401 }
      );
    }

    // 2. YETKİLENDİRME DUVARI: Giriş yapan kullanıcının rolü veritabanında ADMIN mi?
    const email = clerkUser.emailAddresses[0].emailAddress;
    const dbUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Yetkisiz işlem: Bu işlemi gerçekleştirmek için yetkiniz yok!" },
        { status: 403 }
      );
    }

    // --- KONTROLLER BAŞARIYLA GEÇİLDİ - İŞLEM BAŞLIYOR ---
    const resolvedParams = await params;
    const orderId = resolvedParams.id;
    const body = await request.json();
    const { status } = body;

    // Sipariş durumunu doğrula (Enum kontrolü)
    const allowedStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Geçersiz sipariş durumu girdisi." },
        { status: 400 }
      );
    }

    // Siparişi veritabanında güncelle
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json({ success: true, order: updatedOrder }, { status: 200 });

  } catch (error) {
    console.error("GÜVENLİ LOGLAMA - Sipariş Durumu Güncelleme Hatası:", error);
    return NextResponse.json(
      { error: "Sipariş güncellenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}