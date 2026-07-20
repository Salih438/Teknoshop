import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { CheckoutService, CheckoutError } from "@/lib/services/checkout.service";

// 1. INPUT VALIDATION (ZOD SCHEMA)
// SADECE BU KISMI DEĞİŞTİR:
const checkoutSchema = z.object({
  addressId: z.string().uuid("Geçersiz adres ID'si."),
  paymentMethodId: z.string().uuid("Geçersiz ödeme yöntemi seçimi."), // 🚀 YENİ
  items: z.array(
    z.object({
      id: z.string().uuid("Geçersiz ürün ID'si."),
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

    const dbUser = await prisma.user.findUnique({
      where: { email: clerkUser.emailAddresses[0].emailAddress },
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