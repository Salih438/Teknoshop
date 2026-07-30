import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { isActive: true },
      include: {
        bankAccounts: {
          where: { isActive: true },
        },
      },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "asc" },
      ],
    });
    return NextResponse.json({ paymentMethods }, { status: 200 });
  } catch (error) {
    console.error("Payment Methods API Error:", error);
    return NextResponse.json({ error: "Ödeme yöntemleri getirilemedi." }, { status: 500 });
  }
}