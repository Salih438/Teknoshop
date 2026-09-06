import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { AuditRiskLevel } from "@prisma/client";
import { SystemRole } from "@/lib/rbac";
import { getClientIdentifier, checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";
import { assertCanModifyUserRoleOrStatus } from "@/lib/auth/role-guards";
import { formatApiError } from "@/lib/utils/error-handler";

export async function POST(request: Request) {
  try {
    // 1. CENTRALIZED RBAC AUTHORIZATION
    const adminUser = await requireAdmin("MANAGE_ROLES");

    const identifier = getClientIdentifier(request, adminUser.id);
    const rateLimit = await checkRateLimit(identifier, { limit: 20, windowSeconds: 60 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit, "Çok fazla rol atama denemesinde bulundunuz. Lütfen bekleyin.");
    }

    const body = await request.json();
    const { userId, newSystemRole, newRole } = body;

    const validSystemRoles: SystemRole[] = ["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT", "CONTENT_MANAGER", "ANALYST"];
    const isDemotingToCustomer = newRole === "USER" || newSystemRole === "USER";

    if (!userId || (!isDemotingToCustomer && !validSystemRoles.includes(newSystemRole as SystemRole))) {
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

    const currentTargetRole = (targetUser.systemRole as SystemRole) || "ANALYST";

    // 3. CENTRALIZED ROLE GUARDS (Self-demotion, privilege escalation, last super-admin)
    const guard = await assertCanModifyUserRoleOrStatus(
      { id: adminUser.id, systemRole: adminUser.systemRole },
      targetUser,
      {
        role: isDemotingToCustomer ? "USER" : "ADMIN",
        systemRole: isDemotingToCustomer ? "USER" : (newSystemRole as SystemRole),
      }
    );

    if (!guard.allowed) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    // 4. ATOMIC TRANSACTION: LAST SUPER_ADMIN GUARD + ROLE UPDATE + AUDIT LOG
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Re-verify guard inside transaction for atomic concurrency safety
      const txGuard = await assertCanModifyUserRoleOrStatus(
        { id: adminUser.id, systemRole: adminUser.systemRole },
        targetUser,
        {
          role: isDemotingToCustomer ? "USER" : "ADMIN",
          systemRole: isDemotingToCustomer ? "USER" : (newSystemRole as SystemRole),
        },
        tx
      );

      if (!txGuard.allowed) {
        throw new AuthError(txGuard.error || "Yetkisiz işlem.", txGuard.status);
      }

      // Update role: If demoting to USER, role = USER, systemRole = ANALYST. Otherwise role = ADMIN, systemRole = newSystemRole.
      const targetBaseRole = isDemotingToCustomer ? "USER" : "ADMIN";
      const targetSystemRole = isDemotingToCustomer ? "ANALYST" : (newSystemRole as SystemRole);

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          role: targetBaseRole,
          systemRole: targetSystemRole,
        },
      });

      // Audit Log inside same transaction
      await AuditLogService.createAuditLog(
        {
          adminId: adminUser.id,
          adminName: adminUser.name,
          adminEmail: adminUser.email,
          action: isDemotingToCustomer ? "ROLE_DEMOTION_TO_USER" : "SYSTEM_ROLE_UPDATE",
          entityType: "User",
          entityId: userId,
          entityName: targetUser.name || targetUser.email,
          riskLevel: AuditRiskLevel.CRITICAL,
          oldValue: { role: targetUser.role, systemRole: currentTargetRole },
          newValue: { role: targetBaseRole, systemRole: targetSystemRole },
        },
        tx
      );

      return updated;
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: unknown) {
    return formatApiError(error, "İşlem sırasında sunucu hatası oluştu.");
  }
}
