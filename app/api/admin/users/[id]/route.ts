import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("MANAGE_USERS");

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    
    const body = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, role: true, isActive: true },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.role && { role: body.role }),
        ...(body.isActive !== undefined && { isActive: body.isActive })
      }
    });

    // Rol değişikliği var ise CRITICAL risk logla
    if (body.role && existingUser && body.role !== existingUser.role) {
      await AuditLogService.createAuditLog({
        action: "ROLE_CHANGE",
        entityType: "User",
        entityId: userId,
        entityName: existingUser.name,
        riskLevel: AuditRiskLevel.CRITICAL,
        oldValue: { role: existingUser.role },
        newValue: { role: body.role },
      });
    }

    // Aktiflik değişikliği var ise HIGH risk logla
    if (body.isActive !== undefined && existingUser && body.isActive !== existingUser.isActive) {
      await AuditLogService.createAuditLog({
        action: body.isActive ? "USER_ACTIVATE" : "USER_DEACTIVATE",
        entityType: "User",
        entityId: userId,
        entityName: existingUser.name,
        riskLevel: AuditRiskLevel.HIGH,
        oldValue: { isActive: existingUser.isActive },
        newValue: { isActive: body.isActive },
      });
    }

    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("GÜVENLİ LOGLAMA - Kullanıcı güncellenirken hata:", error);
    return NextResponse.json({ error: "İşlem başarısız oldu." }, { status: 500 });
  }
}