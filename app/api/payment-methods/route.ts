import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { isActive: true }, // Sadece adminin aktifleştirdiği yöntemler gelsin
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json({ paymentMethods }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Ödeme yöntemleri getirilemedi." }, { status: 500 });
  }
}