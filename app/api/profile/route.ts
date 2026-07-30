import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { ProfileService } from "@/lib/services/profile.service";
import { prisma } from "@/lib/prisma";

// Zod güvenlik şeması
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

// GET: Kullanıcı profilini ve rol bilgisini getir
export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0].emailAddress;
    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser }, { status: 200 });
  } catch (error) {
    console.error("Profil Getirme Hatası:", error);
    return NextResponse.json({ error: "Profil bilgileri alınamadı." }, { status: 500 });
  }
}

// PUT: Kullanıcı profilini güncelle
export async function PUT(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Oturum açmalısınız." }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0].emailAddress;
    const body = await request.json();
    
    const validation = profileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz form verisi.", details: validation.error.format() },
        { status: 400 }
      );
    }

    const updatedUser = await ProfileService.updateProfile(email, validation.data);

    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });

  } catch (error) {
    console.error("Profil Güncelleme Hatası:", error);
    return NextResponse.json({ error: "Profil güncellenirken sistemsel bir hata oluştu." }, { status: 500 });
  }
}