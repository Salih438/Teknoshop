// Dosya: app/api/addresses/[id]/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { AddressService } from "@/lib/services/address.service";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";

// Yardımcı Fonksiyon
async function getDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;
  return await prisma.user.findUnique({
    where: { email: clerkUser.emailAddresses[0].emailAddress },
    select: { id: true } 
  });
}

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