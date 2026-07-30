import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminCouponsClient, { CouponDTO } from "@/components/admin/coupons/AdminCouponsClient";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
}) {
  // 1. SUNUCU RBAC GÜVENLİK KONTROLÜ (MANAGE_COUPONS İzni)
  try {
    await requireAdmin("MANAGE_COUPONS");
  } catch {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams?.q?.trim().toUpperCase() || "";
  const statusFilter = resolvedParams?.status || "";

  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // 2. PARALEL SUNUCU METRİK SORGULARI (Promise.all ile Maximum Performans)
  const [
    totalCoupons,
    activeCount,
    expiringSoonCount,
    passiveCount,
    couponUsages,
    dbCoupons,
  ] = await Promise.all([
    prisma.coupon.count({ where: { isDeleted: false } }),
    prisma.coupon.count({ where: { isDeleted: false, isActive: true, expireDate: { gt: now } } }),
    prisma.coupon.count({ where: { isDeleted: false, isActive: true, expireDate: { gte: now, lte: sevenDaysLater } } }),
    prisma.coupon.count({
      where: { isDeleted: false, OR: [{ isActive: false }, { expireDate: { lte: now } }] },
    }),
    prisma.couponUsage.findMany({
      include: {
        order: { select: { totalPrice: true } },
      },
    }),
    prisma.coupon.findMany({
      where: { isDeleted: false },
      orderBy: { expireDate: "desc" },
      include: {
        usages: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            user: { select: { name: true, email: true } },
            order: { select: { id: true, totalPrice: true, status: true } },
          },
        },
      },
      take: 200,
    }),
  ]);

  // Finansal Metrikler
  const couponRevenue = couponUsages.reduce((sum, u) => sum + (u.order?.totalPrice || 0), 0);
  const totalPossibleUsages = dbCoupons.reduce((sum, c) => sum + c.usageLimit, 0);
  const totalActualUsages = dbCoupons.reduce((sum, c) => sum + c.usedCount, 0);
  const usageRate = totalPossibleUsages > 0 ? Math.round((totalActualUsages / totalPossibleUsages) * 100) : 0;

  // DTO Dönüşümü
  let processedCoupons: CouponDTO[] = dbCoupons.map((c) => ({
    id: c.id,
    code: c.code,
    discount: c.discount,
    minAmount: c.minAmount,
    isSingleUse: c.isSingleUse,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    expireDate: c.expireDate.toISOString(),
    isActive: c.isActive,
    createdAt: c.expireDate.toISOString(),
    usages: c.usages.map((u) => ({
      id: u.id,
      createdAt: u.createdAt.toISOString(),
      user: u.user,
      order: u.order,
    })),
  }));

  // Filtreleme
  if (statusFilter === "active") {
    processedCoupons = processedCoupons.filter((c) => c.isActive && new Date(c.expireDate) > now);
  } else if (statusFilter === "passive") {
    processedCoupons = processedCoupons.filter((c) => !c.isActive || new Date(c.expireDate) <= now);
  }

  if (searchQuery) {
    processedCoupons = processedCoupons.filter((c) => c.code.includes(searchQuery));
  }

  return (
    <div className="w-full">
      <AdminCouponsClient
        coupons={processedCoupons}
        totalCoupons={totalCoupons}
        activeCount={activeCount}
        expiringSoonCount={expiringSoonCount}
        passiveCount={passiveCount}
        couponRevenue={couponRevenue}
        usageRate={usageRate}
      />
    </div>
  );
}