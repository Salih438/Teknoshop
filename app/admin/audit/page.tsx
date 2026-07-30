import { checkIsAdmin } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminAuditClient, { AuditLogDTO } from "@/components/admin/audit/AdminAuditClient";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    risk?: string;
    entity?: string;
  }>;
}) {
  // 1. SUNUCU RBAC GÜVENLİK KONTROLÜ
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams?.q?.trim().toLowerCase() || "";
  const riskFilter = resolvedParams?.risk || "";
  const entityFilter = resolvedParams?.entity || "";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // 2. PARALEL SUNUCU METRİK SORGULARI (Promise.all ile Maximum Performans)
  const [
    totalLogs,
    todayLogsCount,
    criticalLogsCount,
    productLogsCount,
    orderLogsCount,
    userLogsCount,
    dbLogs,
  ] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.auditLog.count({ where: { riskLevel: "CRITICAL" } }),
    prisma.auditLog.count({ where: { entityType: "Product" } }),
    prisma.auditLog.count({ where: { entityType: "Order" } }),
    prisma.auditLog.count({ where: { entityType: "User" } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
  ]);

  // DTO Dönüşümü
  let processedLogs: AuditLogDTO[] = dbLogs.map((l) => ({
    id: l.id,
    adminId: l.adminId,
    adminName: l.adminName,
    adminEmail: l.adminEmail,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    entityName: l.entityName,
    riskLevel: l.riskLevel as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    oldValue: l.oldValue,
    newValue: l.newValue,
    ipAddress: l.ipAddress,
    userAgent: l.userAgent,
    createdAt: l.createdAt.toISOString(),
  }));

  // Filtreleme
  if (riskFilter) {
    processedLogs = processedLogs.filter((l) => l.riskLevel === riskFilter);
  }

  if (entityFilter) {
    processedLogs = processedLogs.filter((l) => l.entityType === entityFilter);
  }

  if (searchQuery) {
    processedLogs = processedLogs.filter(
      (l) =>
        l.adminName.toLowerCase().includes(searchQuery) ||
        l.action.toLowerCase().includes(searchQuery) ||
        (l.adminEmail && l.adminEmail.toLowerCase().includes(searchQuery)) ||
        (l.ipAddress && l.ipAddress.includes(searchQuery))
    );
  }

  return (
    <div className="w-full">
      <AdminAuditClient
        logs={processedLogs}
        totalLogs={totalLogs}
        todayLogsCount={todayLogsCount}
        criticalLogsCount={criticalLogsCount}
        productLogsCount={productLogsCount}
        orderLogsCount={orderLogsCount}
        userLogsCount={userLogsCount}
      />
    </div>
  );
}
