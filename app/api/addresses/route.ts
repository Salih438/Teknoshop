import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

// --- 1. ADRESLERİ LİSTELEME (GET) ---
// Ödeme sayfası veya profil sayfası yüklendiğinde kullanıcının adreslerini getirir
export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: clerkUser.emailAddresses[0].emailAddress },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // Kullanıcının tüm adreslerini en yeni eklenenden başlayarak çekiyoruz
    const addresses = await prisma.address.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ addresses }, { status: 200 });
  } catch (error) {
    console.error("Adresleri Getirme Hatası:", error);
    return NextResponse.json({ error: "Adresler yüklenirken bir hata oluştu" }, { status: 500 });
  }
}

// --- 2. ADRES EKLEME (POST) ---
export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: clerkUser.emailAddresses[0].emailAddress },
    });
    if (!dbUser) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

    const body = await request.json();
    const { title, city, district, address, isDefault } = body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: dbUser.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    const existingCount = await prisma.address.count({ where: { userId: dbUser.id } });
    const finalIsDefault = existingCount === 0 ? true : isDefault;

    const newAddress = await prisma.address.create({
      data: {
        title,
        city,
        district,
        address,
        isDefault: finalIsDefault,
        userId: dbUser.id,
      },
    });

    return NextResponse.json({ success: true, address: newAddress }, { status: 201 });
  } catch (error) {
    console.error("Adres Ekleme Hatası:", error);
    return NextResponse.json({ error: "Adres eklenirken bir hata oluştu" }, { status: 500 });
  }
}