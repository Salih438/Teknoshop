import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";
import { hasPermission, SystemRole } from "@/lib/rbac";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin("MANAGE_USERS");

    const identifier = getClientIdentifier(request, adminUser.id);
    const rateLimit = await checkRateLimit(identifier, { limit: 30, windowSeconds: 60 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit, "Çok fazla kullanıcı güncelleme isteği gönderdiniz. Lütfen bekleyin.");
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    
    const body = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, systemRole: true, isActive: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    // 🛡️ P0 GÜVENLİK: MANAGE_USERS izni tek başına kullanıcı rolünü (role/systemRole) DEĞİŞTİREMEZ!
    // Rol değişikliği için çağıran yöneticinin kesinlikle MANAGE_ROLES iznine sahip olması zorunludur.
    if (body.role !== undefined && body.role !== existingUser.role) {
      const canManageRoles = hasPermission(adminUser.systemRole as SystemRole, "MANAGE_ROLES");
      if (!canManageRoles) {
        return NextResponse.json(
          { error: "Kullanıcı rolünü değiştirmek için MANAGE_ROLES yetkisine sahip olmalısınız." },
          { status: 403 }
        );
      }

      // Sadece geçerli Prisma Role değerlerine izin ver
      if (body.role !== "USER" && body.role !== "ADMIN") {
        return NextResponse.json({ error: "Geçersiz kullanıcı rolü." }, { status: 400 });
      }

      // Hedef SUPER_ADMIN ise ve aktör SUPER_ADMIN değilse engelle
      if (existingUser.systemRole === "SUPER_ADMIN" && adminUser.systemRole !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "SUPER_ADMIN rolüne sahip bir yöneticinin rolünü değiştirme yetkiniz bulunmamaktadır." },
          { status: 403 }
        );
      }
    }

    const updateData: { role?: "USER" | "ADMIN"; isActive?: boolean; systemRole?: SystemRole } = {};

    if (body.role && (body.role === "USER" || body.role === "ADMIN")) {
      updateData.role = body.role;
      // Eğer kullanıcı normal USER'a düşürülüyorsa systemRole'ü de güvenli varsayılana çek
      if (body.role === "USER") {
        updateData.systemRole = "ANALYST";
      }
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Rol değişikliği var ise CRITICAL risk logla
    if (body.role && body.role !== existingUser.role) {
      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
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
    if (body.isActive !== undefined && body.isActive !== existingUser.isActive) {
      await AuditLogService.createAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
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