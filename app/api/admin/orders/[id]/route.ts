// app/api/admin/orders/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("GÜVENLİ LOGLAMA - Sipariş Durumu Güncelleme Hatası:", error);
    return NextResponse.json(
      { error: "Sistemde bir hata oluştu, lütfen daha sonra tekrar deneyin." },
      { status: 500 }
    );
  }
}