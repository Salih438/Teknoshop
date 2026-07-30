import { checkIsAdmin } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import AdminNotificationsClient from "@/components/admin/AdminNotificationsClient";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="w-full">
      <AdminNotificationsClient />
    </div>
  );
}
