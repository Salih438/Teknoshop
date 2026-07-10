// app/api/admin/brands/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = (formData.get("name") as string)?.trim();

    if (!name) {
      return NextResponse.json({ error: "Marka adı zorunludur." }, { status: 400 });
    }

    // Marka zaten var mı diye kontrol ediyoruz
    const existingBrand = await prisma.brand.findUnique({
      where: { name }
    });

    if (existingBrand) {
      return NextResponse.json({ error: "Bu marka zaten mevcut." }, { status: 409 });
    }

    // Yeni markayı kaydediyoruz
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