import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

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
    const normalizedCouponCode = couponCode.trim().toUpperCase();

    // 3. KUPON KONTROLLERİ
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCouponCode }
    });

    if (!coupon) {
      return NextResponse.json({ error: "Girdiğiniz kupon kodu geçersiz." }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: "Bu kupon kodu artık aktif değil." }, { status: 400 });
    }

    if (coupon.expireDate && coupon.expireDate < new Date()) {
      return NextResponse.json({ error: "Bu kuponun kullanım süresi dolmuş." }, { status: 400 });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Bu kuponun kullanım limiti dolmuş." }, { status: 400 });
    }

    if (coupon.minAmount && subTotal < coupon.minAmount) {
      return NextResponse.json({ error: `Bu kuponu kullanmak için sepet tutarı en az ${coupon.minAmount} TL olmalıdır.` }, { status: 400 });
    }

    // 4. TEK KULLANIMLIK (SINGLE USE) KONTROLÜ
    if (coupon.isSingleUse) {
      const existingUsage = await prisma.couponUsage.findFirst({
        where: {
          couponId: coupon.id,
          userId: dbUser.id
        }
      });

      if (existingUsage) {
        return NextResponse.json({ error: "Bu kupon yalnızca bir kez kullanılabilir ve siz zaten kullandınız." }, { status: 400 });
      }
    }

    // 5. İNDİRİM HESAPLAMA
    // Not: Kuponlar sistemde yüzde bazlı ("discount" alanı) olarak ele alınmaktadır.
    const discountAmount = (subTotal * coupon.discount) / 100;

    return NextResponse.json({ 
      success: true, 
      discount: discountAmount,
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
