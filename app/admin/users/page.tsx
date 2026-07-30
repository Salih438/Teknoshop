import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";
import AdminUsersClient, { CustomerDTO } from "@/components/admin/users/AdminUsersClient";

export const dynamic = "force-dynamic";

function getCustomerSegment(totalSpent: number, ordersCount: number, createdAt: Date, isActive: boolean) {
  if (!isActive) {
    return { label: "Pasif / Engelli", bg: "bg-red-50", text: "text-red-700", icon: "🚫" };
  }
  if (totalSpent >= 10000 || ordersCount >= 5) {
    return { label: "VIP Müşteri", bg: "bg-amber-50", text: "text-amber-700", icon: "🏆" };
  }
  if (ordersCount >= 3) {
    return { label: "Sadık Müşteri", bg: "bg-purple-50", text: "text-purple-700", icon: "💎" };
  }
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (createdAt >= thirtyDaysAgo) {
    return { label: "Yeni Üye", bg: "bg-emerald-50", text: "text-emerald-700", icon: "🆕" };
  }
  if (ordersCount === 0) {
    return { label: "İlk Sipariş Bekliyor", bg: "bg-blue-50", text: "text-blue-700", icon: "🎯" };
  }
  return { label: "Standart Müşteri", bg: "bg-gray-50", text: "text-gray-700", icon: "👤" };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    segment?: string;
  }>;
}) {
  // 1. SUNUCU RBAC GÜVENLİK KONTROLÜ (MANAGE_USERS İzni)
  try {
    await requireAdmin("MANAGE_USERS");
  } catch {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams?.q?.trim() || "";
  const roleFilter = resolvedParams?.role || "";
  const statusFilter = resolvedParams?.status || "";
  const segmentFilter = resolvedParams?.segment || "";

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 2. VERİTABANI SEVİYESİNDE FİLTRELEME (PRISMA WHERE CONDITION)
  const whereCondition: Prisma.UserWhereInput = {};

  if (roleFilter) {
    whereCondition.role = roleFilter as Role;
  }

  if (statusFilter === "active") {
    whereCondition.isActive = true;
  } else if (statusFilter === "passive") {
    whereCondition.isActive = false;
  }

  if (searchQuery) {
    whereCondition.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { email: { contains: searchQuery, mode: "insensitive" } },
      { phone: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  if (segmentFilter === "zero") {
    whereCondition.orders = { none: {} };
  }

  // 3. PARALEL SUNUCU METRİK SORGULARI (Optimized Database Aggregations)
  const [
    totalUsers,
    newUsers30d,
    passiveUsersCount,
    orderersCount,
    revenueAggregation,
    dbUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.count({ where: { orders: { some: { status: { not: "CANCELLED" } } } } }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { totalPrice: true },
    }),
    prisma.user.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      include: {
        addresses: {
          select: { id: true, title: true, city: true, district: true, address: true },
        },
        orders: {
          select: { id: true, totalPrice: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
        returns: { select: { id: true } },
        exchanges: { select: { id: true } },
      },
      take: 300,
    }),
  ]);

  const totalRevenue = revenueAggregation._sum.totalPrice || 0;
  const avgSpent = totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0;

  // 4. DTO İŞLEME VE SEGMENTLERİ HESAPLAMA (GEÇERLİ REALIZED REVENUE İLE)
  let processedUsers: CustomerDTO[] = dbUsers.map((u) => {
    // Sadece iptal edilmemiş geçerli siparişler ciroya ve harcamaya dahil edilir
    const validOrders = u.orders.filter((ord) => ord.status !== "CANCELLED");
    const totalSpent = validOrders.reduce((sum, ord) => sum + (ord.totalPrice || 0), 0);
    const ordersCount = validOrders.length;
    const returnsCount = u.returns.length;
    const exchangesCount = u.exchanges.length;
    const segment = getCustomerSegment(totalSpent, ordersCount, u.createdAt, u.isActive);

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt.toISOString(),
      ordersCount,
      returnsCount,
      exchangesCount,
      totalSpent,
      segment,
      addresses: u.addresses,
      recentOrders: u.orders.slice(0, 5).map((o) => ({
        id: o.id,
        totalPrice: o.totalPrice,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
    };
  });

  // Bellek içi segment filtrelemeleri (VIP, Loyal, New)
  if (segmentFilter === "vip") {
    processedUsers = processedUsers.filter((u) => u.segment.label.includes("VIP"));
  } else if (segmentFilter === "loyal") {
    processedUsers = processedUsers.filter((u) => u.segment.label.includes("Sadık"));
  } else if (segmentFilter === "new") {
    processedUsers = processedUsers.filter((u) => u.segment.label.includes("Yeni"));
  }

  const vipUsersCount = processedUsers.filter((u) => u.segment.label.includes("VIP")).length;

  return (
    <div className="w-full">
      <AdminUsersClient
        users={processedUsers}
        totalUsers={totalUsers}
        newUsers30d={newUsers30d}
        avgSpent={avgSpent}
        vipUsersCount={vipUsersCount}
        passiveUsersCount={passiveUsersCount}
        orderersCount={orderersCount}
      />
    </div>
  );
}