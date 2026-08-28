import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNotificationsClient from "@/components/admin/AdminNotificationsClient";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  // 1. SUNUCU RBAC GÜVENLİK KONTROLÜ (MANAGE_NOTIFICATIONS İzni)
  try {
    await requireAdmin("MANAGE_NOTIFICATIONS");
  } catch {
    redirect("/admin");
  }

  return (
    <div className="w-full">
      <AdminNotificationsClient />
    </div>
  );
}
