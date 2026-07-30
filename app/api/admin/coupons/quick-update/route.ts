import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await request.json();
    const { action, couponId } = body;

    // 🚀 1. HIZLI DURUM DEĞİŞTİRME (TOGGLE ACTIVE)
    if (action === "toggleActive" && couponId) {
      const existing = await prisma.coupon.findUnique({
        where: { id: couponId },
        select: { isActive: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "Kupon bulunamadı." }, { status: 404 });
      }

      const updated = await prisma.coupon.update({
        where: { id: couponId },
        data: { isActive: !existing.isActive },
      });

      return NextResponse.json({ success: true, isActive: updated.isActive });
    }

    // 🚀 2. KUPON ÇOĞALT (DUPLICATE COUPON)
    if (action === "duplicateCoupon" && couponId) {
      const original = await prisma.coupon.findUnique({
        where: { id: couponId },
      });

      if (!original) {
        return NextResponse.json({ error: "Kopyalanacak kupon bulunamadı." }, { status: 404 });
      }

      const timestamp = Date.now().toString().slice(-4);
      const newCode = `${original.code}_COPY_${timestamp}`;

      const duplicated = await prisma.coupon.create({
        data: {
          code: newCode,
          discount: original.discount,
          minAmount: original.minAmount,
          isSingleUse: original.isSingleUse,
          usageLimit: original.usageLimit,
          expireDate: original.expireDate,
          isActive: false, // Pasif kopyalanır
        },
      });

      return NextResponse.json({ success: true, newCoupon: duplicated });
    }

    // 🚀 3. WIZARD İLE YENİ KUPON OLUŞTURMA
    if (action === "createCoupon") {
      const { code, discount, minAmount, isSingleUse, usageLimit, expireDate } = body;

      if (!code || !discount || !expireDate) {
        return NextResponse.json({ error: "Lütfen gerekli alanları doldurunuz." }, { status: 400 });
      }

      const formattedCode = String(code).trim().toUpperCase();

      const existingCode = await prisma.coupon.findUnique({
        where: { code: formattedCode },
      });

      if (existingCode) {
        return NextResponse.json({ error: "Bu kupon kodu zaten kullanımda." }, { status: 400 });
      }

      const newCoupon = await prisma.coupon.create({
        data: {
          code: formattedCode,
          discount: Number(discount),
          minAmount: minAmount ? Number(minAmount) : null,
          isSingleUse: Boolean(isSingleUse),
          usageLimit: usageLimit ? Number(usageLimit) : 100,
          expireDate: new Date(expireDate),
          isActive: true,
        },
      });

      return NextResponse.json({ success: true, coupon: newCoupon });
    }

    return NextResponse.json({ error: "Geçersiz aksiyon." }, { status: 400 });
  } catch (error) {
    console.error("Quick Coupon Action Error:", error);
    return NextResponse.json({ error: "İşlem sırasında hata oluştu." }, { status: 500 });
  }
}
