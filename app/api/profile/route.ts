// Dosya: app/api/profile/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { ProfileService } from "@/lib/services/profile.service"; // 🚀 Servisi içeri aldık

// Zod güvenlik şeması (HTTP veri doğrulama katmanı)
const profileSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır.").max(50),
  phone: z
    .string()
    .regex(/^05\d{9}$/, "Telefon numarası '05XXXXXXXXX' formatında olmalıdır.")
    .or(z.literal(""))
    .nullable()
    .optional(),
  avatarUrl: z.string().url().optional(),
});

export async function PUT(request: Request) {
  try {
    // 1. Kapı Güvenliği: Kimlik Doğrulama
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0].emailAddress;
    const body = await request.json();
    
    // 2. Veri Doğrulama: Zod Kalkanı
    const validation = profileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz form verisi.", details: validation.error.format() },
        { status: 400 }
      );
    }

    // 3. İş Katmanı: Veritabanı İşlemlerini Service Katmanına Devret (SOLID)
    const updatedUser = await ProfileService.updateProfile(email, validation.data);

    // 4. Yanıt Döndürme
    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });

  } catch (error) {
    console.error("Profil Güncelleme Hatası:", error);
    return NextResponse.json({ error: "Profil güncellenirken sistemsel bir hata oluştu." }, { status: 500 });
  }
}