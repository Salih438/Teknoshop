import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    // --- GÜVENLİK DUVARI BAŞLANGICI ---
    const clerkUser = await currentUser();
    if (!clerkUser) return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { email: clerkUser.emailAddresses[0].emailAddress },
    });
    if (!dbUser || dbUser.role !== "ADMIN") return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
    // --- GÜVENLİK DUVARI BİTİŞİ ---

    const formData = await request.formData();
    const name = (formData.get("name") as string)?.trim();

    if (!name) {
      return NextResponse.json({ error: "Marka adı zorunludur." }, { status: 400 });
    }

    const existingBrand = await prisma.brand.findUnique({
      where: { name }
    });

    if (existingBrand) {
      return NextResponse.json({ error: "Bu marka zaten mevcut." }, { status: 409 });
    }

    const newBrand = await prisma.brand.create({
      data: { name }
    });

    return NextResponse.json(
      { success: true, message: "Marka başarıyla eklendi.", data: newBrand },
      { status: 201 }
    );
  } catch (error) {
    console.error("Marka ekleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası yaşandı." }, { status: 500 });
  }
}