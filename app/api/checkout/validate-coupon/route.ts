import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";
import { CouponService } from "@/lib/services/coupon.service";

const validateCouponSchema = z.object({
  couponCode: z.string().min(1, "Kupon kodu zorunludur."),
  subTotal: z.number().positive("Geçersiz sepet tutarı."),
});

export async function POST(request: Request) {
  try {
    // 1. KİMLİK DOĞRULAMA (CLERK)
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "İşlem yapmak için giriş yapmalısınız." }, { status: 401 });
    }

    const identifier = getClientIdentifier(request, clerkUser.id);
    const rateLimit = await checkRateLimit(identifier, { limit: 10, windowSeconds: 600 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit, "Çok fazla kupon denemesi yaptınız. Lütfen 10 dakika bekleyip tekrar deneyin.");
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Kullanıcı e-posta adresi bulunamadı." }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    
    if (!dbUser) {
      return NextResponse.json({ error: "Kullanıcı kaydı bulunamadı." }, { status: 404 });
    }

    // 2. VERİ DOĞRULAMA (ZOD)
    const body = await request.json();
    const validation = validateCouponSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz veri formatı." },
        { status: 400 }
      );
    }

    const { couponCode, subTotal } = validation.data;

    // 3. KUPON KONTROLLERİ (CouponService)
    const result = await CouponService.validateCoupon(couponCode, subTotal, dbUser.id);

    if (!result.isValid) {
      return NextResponse.json({ error: result.error || "Kupon geçersiz." }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      discount: result.discountAmount,
      message: "Kupon başarıyla uygulandı!"
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Kupon Doğrulama Hatası:", error);
    return NextResponse.json(
      { error: "Kupon doğrulanırken sistemsel bir hata oluştu." },
      { status: 500 }
    );
  }
}
