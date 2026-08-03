import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";
import { SystemRole, hasPermission } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    // 1. CENTRALIZED RBAC AUTHORIZATION
    const adminUser = await requireAdmin("MANAGE_ROLES");

    const body = await request.json();
    const { userId, newSystemRole } = body;

    const validRoles: SystemRole[] = ["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT", "CONTENT_MANAGER", "ANALYST"];

    if (!userId || !newSystemRole || !validRoles.includes(newSystemRole as SystemRole)) {
      return NextResponse.json({ error: "Geçersiz kullanıcı veya sistem rolü." }, { status: 400 });
    }

    // 2. TARGET USER INSPECTION
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, systemRole: true, role: true, isActive: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    const currentTargetRole = (targetUser.systemRole as SystemRole) || "SUPER_ADMIN";

    // 3. SELF-DEMOTION SAFEGUARD
    if (adminUser.id === userId) {
      if (!hasPermission(newSystemRole as SystemRole, "MANAGE_ROLES")) {
        return NextResponse.json(
          { error: "Kendi hesabınızın rol yönetimi yetkisini kaldıramaz veya kendi rolünüzü düşüremezsiniz." },
          { status: 400 }
        );
      }
    }

    // 4. PRIVILEGE ESCALATION PROTECTION
    const actorRole = (adminUser.systemRole as SystemRole) || "SUPER_ADMIN";

    // Non-SUPER_ADMIN cannot grant SUPER_ADMIN role
    if (newSystemRole === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Sadece SUPER_ADMIN yetkisine sahip yöneticiler bir kullanıcıya SUPER_ADMIN rolü atayabilir." },
        { status: 403 }
      );
    }

    // Non-SUPER_ADMIN cannot alter a SUPER_ADMIN user
    if (currentTargetRole === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "SUPER_ADMIN rolüne sahip bir yöneticinin rolünü değiştirme yetkiniz bulunmamaktadır." },
        { status: 403 }
      );
    }

    // 5. ATOMIC TRANSACTION: LAST SUPER_ADMIN GUARD + ROLE UPDATE + AUDIT LOG
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Last SUPER_ADMIN Protection: If target is currently SUPER_ADMIN and changing to lower role
      if (currentTargetRole === "SUPER_ADMIN" && newSystemRole !== "SUPER_ADMIN") {
        const activeSuperAdminCount = await tx.user.count({
          where: {
            role: "ADMIN",
            systemRole: "SUPER_ADMIN",
            isActive: true,
          },
        });

        if (activeSuperAdminCount <= 1) {
          throw new Error("Sistemdeki son aktif SUPER_ADMIN rolü değiştirilemez veya düşürülemez.");
        }
      }

      // Update role
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          role: "ADMIN",
          systemRole: newSystemRole as SystemRole,
        },
      });

      // Audit Log inside same transaction
      await AuditLogService.createAuditLog(
        {
          adminId: adminUser.id,
          adminName: adminUser.name,
          adminEmail: adminUser.email,
          action: "SYSTEM_ROLE_UPDATE",
          entityType: "User",
          entityId: userId,
          entityName: targetUser.name || targetUser.email,
          riskLevel: AuditRiskLevel.CRITICAL,
          oldValue: { systemRole: currentTargetRole },
          newValue: { systemRole: newSystemRole },
        },
        tx
      );

      return updated;
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "";
    if (message && !message.includes("prisma")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Assign Role API Error:", error);
    return NextResponse.json({ error: "İşlem sırasında sunucu hatası oluştu." }, { status: 500 });
  }
}
