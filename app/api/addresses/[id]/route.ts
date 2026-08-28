// Dosya: app/api/addresses/[id]/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { AddressService } from "@/lib/services/address.service";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";
import { z } from "zod";

const addressUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Adres başlığı en az 2 karakter olmalıdır.")
    .max(50, "Adres başlığı en fazla 50 karakter olabilir."),
  city: z
    .string()
    .trim()
    .min(2, "Şehir en az 2 karakter olmalıdır.")
    .max(50, "Şehir en fazla 50 karakter olabilir."),
  district: z
    .string()
    .trim()
    .min(2, "İlçe en az 2 karakter olmalıdır.")
    .max(50, "İlçe en fazla 50 karakter olabilir."),
  address: z
    .string()
    .trim()
    .min(5, "Açık adres en az 5 karakter olmalıdır.")
    .max(300, "Açık adres en fazla 300 karakter olabilir."),
  isDefault: z.boolean().optional(),
});

// Yardımcı Fonksiyon: Oturum açmış kullanıcıyı veritabanından getir
async function getDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;
  return await prisma.user.findUnique({
    where: { email: clerkUser.emailAddresses[0].emailAddress },
    select: { id: true },
  });
}

// PUT: Adres Bilgilerini Güncelle (In-place Edit)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const identifier = getClientIdentifier(request, dbUser.id);
    const rateLimit = await checkRateLimit(identifier, { limit: 15, windowSeconds: 600 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit, "Çok fazla adres güncelleme denemesinde bulundunuz. Lütfen bekleyip tekrar deneyin.");
    }

    const resolvedParams = await params;
    const addressId = resolvedParams.id;
    const body = await request.json();

    const parsed = addressUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Geçersiz adres bilgisi girdiniz.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const updatedAddress = await AddressService.updateAddress(addressId, dbUser.id, parsed.data);

    return NextResponse.json({ success: true, address: updatedAddress }, { status: 200 });
  } catch (error: unknown) {
    console.error("Adres Güncelleme Hatası:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Bu adresi güncelleme yetkiniz bulunmamaktadır." }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Adres güncellenirken sistemsel bir hata oluştu." }, { status: 500 });
  }
}

// DELETE: Adres Sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });

    const identifier = getClientIdentifier(request, dbUser.id);
    const rateLimit = await checkRateLimit(identifier, { limit: 10, windowSeconds: 600 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit, "Çok fazla silme denemesinde bulundunuz. Lütfen 10 dakika bekleyip tekrar deneyin.");
    }

    const resolvedParams = await params;
    const addressId = resolvedParams.id;

    // 🚀 Veritabanı ve Güvenlik işlerini Servis Katmanına devrettik
    await AddressService.deleteAddress(addressId, dbUser.id);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Adres Silme Hatası:", error);
    
    // Servis katmanından gelen özel hataları güvenli şekilde yakalıyoruz (Type Narrowing)
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
      }
      if (error.message === "HAS_ORDERS") {
        return NextResponse.json(
          { error: "Bu adres geçmiş veya aktif siparişlerinizde kullanıldığı için silinemez." }, 
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: "Adres silinirken bir hata oluştu." }, { status: 500 });
  }
}