import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";

export async function POST(request: Request) {
  try {
    await requireAdmin("MANAGE_CATEGORIES");

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) {
      return NextResponse.json({ error: "Kategori adı zorunludur." }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name,
        description: description || null,
      }
    });

    // 🛡️ DENETİM İZİ (Audit Log)
    await AuditLogService.createAuditLog({
      action: "CREATE_CATEGORY",
      entityType: "Category",
      entityId: newCategory.id,
      entityName: newCategory.name,
      riskLevel: AuditRiskLevel.LOW,
      newValue: { name: newCategory.name },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Kategori ekleme hatası:", error);
    return NextResponse.json({ error: "Kategori eklenemedi, bu isim zaten var olabilir." }, { status: 500 });
  }
}