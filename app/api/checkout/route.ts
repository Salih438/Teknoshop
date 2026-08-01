import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { CheckoutService, CheckoutError } from "@/lib/services/checkout.service";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";

// 1. INPUT VALIDATION (ZOD SCHEMA)
// SADECE BU KISMI DEĞİŞTİR:
const checkoutSchema = z.object({
  addressId: z.string().uuid("Geçersiz adres ID'si."),
  paymentMethodId: z.string().uuid("Geçersiz ödeme yöntemi seçimi."), // 🚀 YENİ
  items: z.array(
    z.object({
      id: z.string().uuid("Geçersiz ürün ID'si."),
      variantId: z.string().uuid("Geçersiz varyasyon ID'si.").optional(),
      quantity: z.number().int().positive("Adet sayısı en az 1 olmalıdır."),
    })
  ).nonempty("Sepetiniz boş olamaz."),
  couponCode: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // 2. KİMLİK DOĞRULAMA (CLERK)
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Siparişi tamamlamak için giriş yapmalısınız." }, { status: 401 });
    }

    const identifier = getClientIdentifier(request, clerkUser.id);
    const rateLimit = await checkRateLimit(identifier, { limit: 5, windowSeconds: 600 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit, "Çok fazla sipariş denemesinde bulundunuz. Lütfen 10 dakika bekleyip tekrar deneyin.");
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Kullanıcı e-posta adresi bulunamadı." }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true } // Sadece gerekli alanı çekiyoruz
    });
    
    if (!dbUser) {
      return NextResponse.json({ error: "Kullanıcı kaydı bulunamadı." }, { status: 404 });
    }

    // 3. VERİ DOĞRULAMA (ZOD)
    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz veri formatı.", details: validation.error.format() },
        { status: 400 }
      );
    }

    // 4. İŞ MANTIĞINI (BUSINESS LOGIC) SERVİSE DEVRET
    const order = await CheckoutService.processOrder({
      userId: dbUser.id,
      ...validation.data
    });

    return NextResponse.json({ success: true, orderId: order.id }, { status: 200 });

  // 🚀 DÜZELTİLEN KISIM: 'any' yerine 'unknown' kullanılarak TypeScript hatası giderildi
  } catch (error: unknown) {
    console.error("Sipariş Oluşturma Hatası:", error);

    // GÜVENLİ HATA YÖNETİMİ
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Siparişiniz işlenirken sistemsel bir hata oluştu." },
      { status: 500 }
    );
  }
}