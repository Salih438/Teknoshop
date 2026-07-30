import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ALL_PERMISSIONS, SystemRole, hasPermission, ROLE_PERMISSIONS } from "@/lib/rbac";
import AdminRolesClient, { AdminUserRoleDTO } from "@/components/admin/roles/AdminRolesClient";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  // 1. SUNUCU RBAC GÜVENLİK KONTROLÜ (MANAGE_ROLES Yetkisi Zorunlu)
  try {
    await requireAdmin("MANAGE_ROLES");
  } catch {
    redirect("/");
  }

  // 2. TÜM ADMİN KULLANICILARI VE SİSTEM ROLLERİNİ GETİR
  const dbAdmins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "desc" },
  });

  const adminsDTO: AdminUserRoleDTO[] = dbAdmins.map((u) => {
    const systemRole = (u.systemRole as SystemRole) || "SUPER_ADMIN";
    const permissions = ROLE_PERMISSIONS[systemRole] || [];

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      systemRole,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      permissions,
    };
  });

  // 3. PERMISSION MATRIX DÖNÜŞÜMÜ
  const matrix = ALL_PERMISSIONS.map((perm) => ({
    permission: perm as string,
    SUPER_ADMIN: hasPermission("SUPER_ADMIN", perm),
    ADMIN: hasPermission("ADMIN", perm),
    CUSTOMER_SUPPORT: hasPermission("CUSTOMER_SUPPORT", perm),
    CONTENT_MANAGER: hasPermission("CONTENT_MANAGER", perm),
    ANALYST: hasPermission("ANALYST", perm),
  }));

  return (
    <div className="w-full">
      <AdminRolesClient admins={adminsDTO} matrix={matrix} />
    </div>
  );
}
