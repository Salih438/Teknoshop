import { checkIsAdmin } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";
import AdminOrdersClient, { OrderItemDTO } from "@/components/admin/orders/AdminOrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. SUNUCU RBAC GÜVENLİK KONTROLÜ
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  const params = await searchParams;
  const statusFilter = typeof params?.status === "string" ? params.status : "";
  const paymentFilter = typeof params?.payment === "string" ? params.payment : "";
  const searchQuery = typeof params?.q === "string" ? params.q.trim() : "";

  // 2. PARALEL SUNUCU METRİK SORGULARI (Promise.all ile Maximum Performans)
  const [
    totalOrders,
    pendingCount,
    shippedCount,
    deliveredCount,
    cancelledCount,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
  ]);

  // 3. DİNAMİK VERİTABANI WHERECONDITION KUTUSU
  const whereCondition: Prisma.OrderWhereInput = {};

  if (statusFilter) {
    whereCondition.status = statusFilter as OrderStatus;
  }

  if (paymentFilter) {
    whereCondition.payment = {
      status: paymentFilter as any,
    };
  }

  if (searchQuery) {
    whereCondition.OR = [
      { id: { contains: searchQuery, mode: "insensitive" } },
      { user: { name: { contains: searchQuery, mode: "insensitive" } } },
      { user: { email: { contains: searchQuery, mode: "insensitive" } } },
    ];
  }

  // 4. SİPARİŞ LİSTESİ SORGUSU (N+1 ENGELİ İÇİN INCLUDES)
  const ordersFromDb = await prisma.order.findMany({
    where: whereCondition,
    include: {
      user: {
        select: { name: true, email: true },
      },
      items: {
        select: { id: true },
      },
      payment: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200, // Performans sınırı
  });

  // DTO Dönüşümü
  const orders: OrderItemDTO[] = ordersFromDb.map((o) => ({
    id: o.id,
    totalPrice: o.totalPrice,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    user: o.user,
    itemsCount: o.items.length,
    paymentStatus: o.payment?.status,
  }));

  return (
    <div className="w-full">
      <AdminOrdersClient
        orders={orders}
        totalOrders={totalOrders}
        pendingCount={pendingCount}
        shippedCount={shippedCount}
        deliveredCount={deliveredCount}
        cancelledCount={cancelledCount}
      />
    </div>
  );
}