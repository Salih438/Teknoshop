import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { ProfileService } from "@/lib/services/profile.service";
import { prisma } from "@/lib/prisma";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";

// Zod güvenlik şeması (Trim ve sanitasyon eklendi)
const profileSchema = z.object({
  name: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 2, "İsim en az 2 karakter olmalıdır.")
    .refine((val) => val.length <= 50, "İsim en fazla 50 karakter olabilir."),
  phone: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val === "" || /^05\d{9}$/.test(val), "Telefon numarası '05XXXXXXXXX' formatında olmalıdır.")
    .nullable()
    .optional(),
  avatarUrl: z.string().url("Geçersiz profil resmi bağlantısı.").optional(),
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
        _count: {
          select: {
            orders: true,
            returns: true,
            exchanges: true,
          },
        },
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

    const identifier = getClientIdentifier(request, clerkUser.id);
    const rateLimit = await checkRateLimit(identifier, { limit: 10, windowSeconds: 600 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit, "Çok fazla profil güncelleme isteğinde bulundunuz. Lütfen 10 dakika bekleyip tekrar deneyin.");
    }

    const email = clerkUser.emailAddresses[0].emailAddress;
    const body = await request.json();
    
    const validation = profileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz form verisi.", details: validation.error.flatten().fieldErrors },
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