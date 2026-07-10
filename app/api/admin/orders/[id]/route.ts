// app/api/admin/orders/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;
    
    // Gelen JSON verisinden yeni durumu (status) alıyoruz
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Sipariş durumu belirtilmedi." }, { status: 400 });
    }

    // Siparişi veritabanında güncelliyoruz
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status }
    });

    return NextResponse.json(
      { success: true, message: "Sipariş durumu güncellendi." }, 
      { status: 200 }
    );
  } catch (error) {
    console.error("Sipariş güncellenirken hata:", error);
    return NextResponse.json({ error: "Sunucu hatası yaşandı." }, { status: 500 });
  }
}