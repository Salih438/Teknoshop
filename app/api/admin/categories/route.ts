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
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) {
      return NextResponse.json({ error: "Kategori adı zorunludur." }, { status: 400 });
    }

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