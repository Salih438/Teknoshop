import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";

export async function POST(request: Request) {
  try {
    await requireAdmin("MANAGE_BRANDS");

    const formData = await request.formData();
    const name = (formData.get("name") as string)?.trim();

    if (!name) {
      return NextResponse.json({ error: "Marka adı zorunludur." }, { status: 400 });
    }

    const existingBrand = await prisma.brand.findUnique({
      where: { name }
    });

    if (existingBrand) {
      return NextResponse.json({ error: "Bu marka zaten mevcut." }, { status: 409 });
    }

    const newBrand = await prisma.brand.create({
      data: { name }
    });

    // 🛡️ DENETİM İZİ (Audit Log)
    await AuditLogService.createAuditLog({
      action: "CREATE_BRAND",
      entityType: "Brand",
      entityId: newBrand.id,
      entityName: newBrand.name,
      riskLevel: AuditRiskLevel.LOW,
      newValue: { name: newBrand.name },
    });

    return NextResponse.json(
      { success: true, message: "Marka başarıyla eklendi.", data: newBrand },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Marka ekleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası yaşandı." }, { status: 500 });
  }
}