import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/auth-utils";
import { hasPermission, SystemRole } from "@/lib/rbac";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // SUNUCU SEVİYESİ RBAC GÜVENLİK KONTROLÜ:
  // Giriş yapmamış VEYA rolü ADMIN olmayan tüm kullanıcıları vitrine yönlendir
  const dbUser = await getDbUser();

  if (!dbUser || dbUser.role !== "ADMIN" || !dbUser.isActive) {
    redirect("/");
  }

  const systemRole = (dbUser.systemRole as SystemRole) || "ADMIN";
  const canManageRoles = hasPermission(systemRole, "MANAGE_ROLES");

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row w-full max-w-full overflow-x-hidden p-0 m-0 border-none">
      {/* RESPONSIVE MOBİL DRAWER / MASAÜSTÜ SIDEBAR */}
      <AdminSidebarNav canManageRoles={canManageRoles} />

      {/* SAĞ İÇERİK ALANI */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}