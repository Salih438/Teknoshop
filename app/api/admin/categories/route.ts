// app/api/admin/categories/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) {
      return NextResponse.json({ error: "Kategori adı zorunludur." }, { status: 400 });
    }

    // Prisma ile yeni kategoriyi veritabanına yazıyoruz
    const newCategory = await prisma.category.create({
      data: {
        name: name,
        description: description || null,
      }
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Kategori ekleme hatası:", error);
    return NextResponse.json({ error: "Kategori eklenemedi, bu isim zaten var olabilir." }, { status: 500 });
  }
}