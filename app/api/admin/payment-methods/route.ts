import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel, PaymentType, PaymentProvider } from "@prisma/client";

export async function GET() {
  try {
    await requireAdmin("MANAGE_PAYMENT_METHODS");

    const paymentMethods = await prisma.paymentMethod.findMany({
      include: {
        bankAccounts: true,
      },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Admin Payment Methods GET Error:", error);
    return NextResponse.json({ error: "Ödeme yöntemleri yüklenemedi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin("MANAGE_PAYMENT_METHODS");

    const body = await request.json();
    const { name, description, type, provider, fee, displayOrder, bankAccounts } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Ödeme yöntemi adı ve tipi zorunludur." }, { status: 400 });
    }

    const parsedFee = fee ? parseFloat(fee) : 0;
    if (parsedFee < 0) {
      return NextResponse.json({ error: "Ek işlem ücreti negatif bir değer olamaz." }, { status: 400 });
    }

    // 🛡️ DUPLICATE GUARD: Aynı sistem türünde ödeme yöntemi kontrolü
    const existingType = await prisma.paymentMethod.findFirst({
      where: { type: type as PaymentType },
    });

    if (existingType) {
      return NextResponse.json(
        { error: `'${type}' sistem türünde zaten tanımlanmış bir ödeme yöntemi bulunmaktadır.` },
        { status: 400 }
      );
    }

    const created = await prisma.paymentMethod.create({
      data: {
        name,
        description: description || null,
        type: type as PaymentType,
        provider: (provider as PaymentProvider) || "CUSTOM",
        fee: parsedFee,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        bankAccounts: bankAccounts && Array.isArray(bankAccounts) ? {
          create: bankAccounts.map((b: any) => ({
            bankName: b.bankName,
            accountHolder: b.accountHolder,
            iban: b.iban,
            currency: b.currency || "TRY",
          })),
        } : undefined,
      },
      include: {
        bankAccounts: true,
      },
    });

    await AuditLogService.createAuditLog({
      adminId: adminUser.id,
      adminName: adminUser.name,
      adminEmail: adminUser.email,
      action: "PAYMENT_METHOD_CREATE",
      entityType: "PaymentMethod",
      entityId: created.id,
      entityName: created.name,
      riskLevel: AuditRiskLevel.HIGH,
      newValue: { name: created.name, type: created.type, fee: created.fee },
    });

    return NextResponse.json({ success: true, paymentMethod: created });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Admin Payment Methods POST Error:", error);
    return NextResponse.json({ error: "Ödeme yöntemi oluşturulurken sunucu hatası oluştu." }, { status: 500 });
  }
}
