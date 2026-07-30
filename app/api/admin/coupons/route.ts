import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";

export async function GET() {
  try {
    await requireAdmin();

    const coupons = await prisma.coupon.findMany({
      where: { isDeleted: false },
      orderBy: { expireDate: "desc" },
    });

    return NextResponse.json({ coupons }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Kuponlar getirilirken bir hata oluştu." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("MANAGE_COUPONS");

    const body = await request.json();
    const {
      code,
      discount,
      minAmount,
      isSingleUse,
      usageLimit,
      expireDate,
      isActive,
    } = body;

    if (!code || typeof discount !== "number" || !expireDate) {
      return NextResponse.json({ error: "Gerekli alanlar eksik (code, discount, expireDate)." }, { status: 400 });
    }

    if (discount <= 0 || discount > 100) {
      return NextResponse.json({ error: "İndirim oranı 0'dan büyük ve en fazla 100 olmalıdır." }, { status: 400 });
    }

    if (minAmount !== undefined && minAmount !== null && minAmount < 0) {
      return NextResponse.json({ error: "Minimum sepet tutarı negatif olamaz." }, { status: 400 });
    }

    if (usageLimit !== undefined && usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit <= 0)) {
      return NextResponse.json({ error: "Kullanım limiti pozitif bir tam sayı olmalıdır." }, { status: 400 });
    }

    const parsedExpireDate = new Date(expireDate);
    if (parsedExpireDate <= new Date()) {
      return NextResponse.json({ error: "Son kullanma tarihi geçmiş bir tarih olamaz." }, { status: 400 });
    }

    const normalizedCode = String(code).trim().toUpperCase();

    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (existingCoupon) {
      return NextResponse.json({ error: "Bu kupon kodu zaten mevcut." }, { status: 409 });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        discount,
        minAmount: minAmount || null,
        isSingleUse: !!isSingleUse,
        usageLimit: usageLimit || 100,
        expireDate: new Date(expireDate),
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // 🛡️ DENETİM İZİ (Audit Log)
    await AuditLogService.createAuditLog({
      action: "CREATE_COUPON",
      entityType: "Coupon",
      entityId: newCoupon.id,
      entityName: newCoupon.code,
      riskLevel: AuditRiskLevel.MEDIUM,
      newValue: { code: newCoupon.code, discount: newCoupon.discount },
    });

    return NextResponse.json(
      { success: true, message: "Kupon başarıyla oluşturuldu.", data: newCoupon },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Kupon oluşturma hatası:", error);
    return NextResponse.json({ error: "Kupon oluşturulurken bir hata meydana geldi." }, { status: 500 });
  }
}
