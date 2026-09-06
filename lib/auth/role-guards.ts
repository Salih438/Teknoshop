import { prisma } from "@/lib/prisma";
import { SystemRole, hasPermission } from "@/lib/rbac";
import { Prisma } from "@prisma/client";

export interface UserModificationTarget {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  systemRole?: string | null;
  isActive?: boolean;
}

export interface UserModificationUpdates {
  role?: "USER" | "ADMIN";
  systemRole?: SystemRole | "USER";
  isActive?: boolean;
  delete?: boolean;
}

export interface UserModificationActor {
  id: string;
  systemRole?: string | null;
}

export interface GuardCheckResult {
  allowed: boolean;
  error?: string;
  status: number;
}

/**
 * Validates role or status modifications on a single user.
 * Enforces:
 * 1. Self-demotion / self-deactivation / self-deletion prevention (403)
 * 2. Privilege escalation prevention (non-SUPER_ADMIN cannot grant or alter SUPER_ADMIN) (403)
 * 3. Last active SUPER_ADMIN lockout prevention (403)
 */
export async function assertCanModifyUserRoleOrStatus(
  actor: UserModificationActor,
  target: UserModificationTarget,
  updates: UserModificationUpdates,
  dbClient: Prisma.TransactionClient | typeof prisma = prisma
): Promise<GuardCheckResult> {
  const actorRole = (actor.systemRole as SystemRole) || "ANALYST";
  const targetCurrentSystemRole = (target.systemRole as SystemRole) || "ANALYST";
  const isTargetActiveSuperAdmin =
    target.role === "ADMIN" && targetCurrentSystemRole === "SUPER_ADMIN" && target.isActive !== false;

  const isDemotingToCustomer = updates.role === "USER" || updates.systemRole === "USER";

  // 1. SELF-MODIFICATION SAFEGUARD
  if (actor.id === target.id) {
    // Cannot demote self to USER or remove own MANAGE_ROLES capability
    if (
      isDemotingToCustomer ||
      (updates.systemRole &&
        updates.systemRole !== "USER" &&
        !hasPermission(updates.systemRole, "MANAGE_ROLES"))
    ) {
      return {
        allowed: false,
        error: "Kendi hesabınızın rol yönetimi yetkisini kaldıramaz veya kendi rolünüzü düşüremezsiniz.",
        status: 403,
      };
    }

    // Cannot deactivate self
    if (updates.isActive === false) {
      return {
        allowed: false,
        error: "Kendi hesabınızı pasife alamazsınız.",
        status: 403,
      };
    }

    // Cannot delete self
    if (updates.delete === true) {
      return {
        allowed: false,
        error: "Kendi hesabınızı silemezsiniz.",
        status: 403,
      };
    }
  }

  // 2. PRIVILEGE ESCALATION PROTECTION
  // Non-SUPER_ADMIN cannot grant SUPER_ADMIN
  if (updates.systemRole === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN") {
    return {
      allowed: false,
      error: "Sadece SUPER_ADMIN yetkisine sahip yöneticiler bir kullanıcıya SUPER_ADMIN rolü atayabilir.",
      status: 403,
    };
  }

  // Non-SUPER_ADMIN cannot alter a SUPER_ADMIN user
  if (targetCurrentSystemRole === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN") {
    return {
      allowed: false,
      error: "SUPER_ADMIN rolüne sahip bir yöneticinin rolünü veya durumunu değiştirme yetkiniz bulunmamaktadır.",
      status: 403,
    };
  }

  // 3. LAST ACTIVE SUPER_ADMIN LOCKOUT GUARD
  // Triggered if the target is currently an active SUPER_ADMIN and the update removes SUPER_ADMIN status:
  // - demoting role to USER
  // - changing systemRole to anything other than SUPER_ADMIN
  // - setting isActive to false
  // - deleting the user
  const willLoseActiveSuperAdminStatus =
    isTargetActiveSuperAdmin &&
    (isDemotingToCustomer ||
      (updates.systemRole && updates.systemRole !== "SUPER_ADMIN") ||
      updates.isActive === false ||
      updates.delete === true);

  if (willLoseActiveSuperAdminStatus) {
    const remainingActiveSuperAdmins = await dbClient.user.count({
      where: {
        id: { not: target.id },
        role: "ADMIN",
        systemRole: "SUPER_ADMIN",
        isActive: true,
      },
    });

    if (remainingActiveSuperAdmins === 0) {
      return {
        allowed: false,
        error: "Sistemdeki son aktif SUPER_ADMIN hesabı pasife alınamaz, silinemez veya rolü düşürülemez.",
        status: 403,
      };
    }
  }

  return { allowed: true, status: 200 };
}

/**
 * Validates bulk actions on users (deactivate or delete).
 */
export async function assertCanBulkModifyUsers(
  actor: UserModificationActor,
  userIds: string[],
  action: "deactivate" | "delete",
  dbClient: Prisma.TransactionClient | typeof prisma = prisma
): Promise<GuardCheckResult> {
  const actorRole = (actor.systemRole as SystemRole) || "ANALYST";

  // 1. Self-action check
  if (userIds.includes(actor.id)) {
    return {
      allowed: false,
      error: `Kendi hesabınızı toplu işlem ile ${action === "delete" ? "silemezsiniz" : "pasife alamazsınız"}.`,
      status: 403,
    };
  }

  // 2. Non-SUPER_ADMIN cannot deactivate or delete any SUPER_ADMIN
  if (actorRole !== "SUPER_ADMIN") {
    const targetedSuperAdminCount = await dbClient.user.count({
      where: {
        id: { in: userIds },
        systemRole: "SUPER_ADMIN",
      },
    });

    if (targetedSuperAdminCount > 0) {
      return {
        allowed: false,
        error: "SUPER_ADMIN rolüne sahip yöneticileri pasife alma veya silme yetkiniz bulunmamaktadır.",
        status: 403,
      };
    }
  }

  // 3. Last active SUPER_ADMIN lockout check
  const targetedActiveSuperAdmins = await dbClient.user.count({
    where: {
      id: { in: userIds },
      role: "ADMIN",
      systemRole: "SUPER_ADMIN",
      isActive: true,
    },
  });

  if (targetedActiveSuperAdmins > 0) {
    const remainingActiveSuperAdmins = await dbClient.user.count({
      where: {
        id: { notIn: userIds },
        role: "ADMIN",
        systemRole: "SUPER_ADMIN",
        isActive: true,
      },
    });

    if (remainingActiveSuperAdmins === 0) {
      return {
        allowed: false,
        error: "Sistemdeki son aktif SUPER_ADMIN hesabı pasife alınamaz veya silinemez.",
        status: 403,
      };
    }
  }

  return { allowed: true, status: 200 };
}
