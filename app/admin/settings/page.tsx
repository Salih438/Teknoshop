import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import StoreSettingsClient from "@/components/admin/settings/StoreSettingsClient";

export const dynamic = "force-dynamic";

export default async function StoreSettingsPage() {
  try {
    await requireAdmin("MANAGE_SETTINGS");
  } catch {
    redirect("/");
  }

  return <StoreSettingsClient />;
}
