import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AddressService } from "@/lib/services/address.service"; // 🚀 Servisi içeri aldık

// ZOD GÜVENLİK VE DOĞRULAMA ŞEMASI
const addressSchema = z.object({
  title: z.string().min(2, "Adres başlığı en az 2 karakter olmalıdır.").max(50, "Adres başlığı çok uzun."),
  city: z.string().min(2, "Şehir adı en az 2 karakter olmalıdır.").max(50, "Şehir adı çok uzun."),
  district: z.string().min(2, "İlçe adı en az 2 karakter olmalıdır.").max(50, "İlçe adı çok uzun."),
  address: z.string().min(10, "Açık adres en az 10 karakter olmalıdır.").max(500, "Açık adres çok uzun."),
  isDefault: z.boolean().optional().default(false),
});

// Yardımcı Fonksiyon: Clerk üzerinden veritabanı kullanıcısını bul (Kod tekrarını önler)
async function getDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;
  return await prisma.user.findUnique({
    where: { email: clerkUser.emailAddresses[0].emailAddress },
  });
}

// --- 1. ADRESLERİ LİSTELEME (GET) ---
export async function GET() {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: "Oturum açmalısınız" }, { status: 401 });

    // 🚀 Veritabanı işini Servis Katmanına devrettik
    const addresses = await AddressService.getUserAddresses(dbUser.id);
    
    return NextResponse.json({ addresses }, { status: 200 });
  } catch (error) {
    console.error("Adresleri Getirme Hatası:", error);
    return NextResponse.json({ error: "Adresler yüklenirken bir hata oluştu" }, { status: 500 });
  }
}

// --- 2. ADRES EKLEME (POST) ---
export async function POST(request: Request) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: "Oturum açmalısınız" }, { status: 401 });

    const body = await request.json();
    
    // 🚀 Zod Kalkanı
    const validation = addressSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Geçersiz veya eksik veri gönderildi.", 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    // 🚀 Veritabanı işini Servis Katmanına devrettik
    const newAddress = await AddressService.createAddress(dbUser.id, validation.data);

    return NextResponse.json({ success: true, address: newAddress }, { status: 201 });
  } catch (error) {
    console.error("Adres Ekleme Hatası:", error);
    return NextResponse.json({ error: "Adres eklenirken bir hata oluştu" }, { status: 500 });
  }
}