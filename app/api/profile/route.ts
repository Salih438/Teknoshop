import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

// Zod şemasına avatarUrl eklendi
const profileSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır.").max(50),
  phone: z
    .string()
    .regex(/^05\d{9}$/, "Telefon numarası '05XXXXXXXXX' formatında olmalıdır.")
    .or(z.literal(""))
    .nullable()
    .optional(),
  avatarUrl: z.string().url().optional(), // YENİ: Opsiyonel resim linki
});

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

    const { name, phone, avatarUrl } = validation.data;

    // Sadece gönderilen verileri güncellemek için dinamik data objesi oluşturuyoruz
    const updateData: any = {
      name,
      phone: phone || null,
    };
    
    // Eğer istekte avatarUrl geldiyse, güncelleme objesine ekle
    if (avatarUrl) {
      updateData.avatarUrl = avatarUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });

  } catch (error) {
    console.error("Profil Güncelleme Hatası:", error);
    return NextResponse.json({ error: "Profil güncellenirken sistemsel bir hata oluştu." }, { status: 500 });
  }
}