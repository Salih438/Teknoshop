import { requireAdmin } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerProfileClient, {
  CustomerProfileDTO,
  TimelineEvent,
} from "@/components/admin/users/CustomerProfileClient";

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

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin("MANAGE_USERS");
  } catch {
    redirect("/");
  }

  const resolvedParams = await params;
  const userId = resolvedParams.id;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { select: { id: true } } },
      },
      returns: { orderBy: { createdAt: "desc" } },
      exchanges: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!dbUser) {
    return notFound();
  }

  // Sadece iptal edilmemiş geçerli siparişler ciroya ve harcamaya dahil edilir
  const validOrders = dbUser.orders.filter((ord) => ord.status !== "CANCELLED");
  const totalSpent = validOrders.reduce((sum, ord) => sum + (ord.totalPrice || 0), 0);
  const segment = getCustomerSegment(totalSpent, validOrders.length, dbUser.createdAt, dbUser.isActive);

  // 🚀 ZAMAN TÜNELİ (TIMELINE) OLUŞTURMA
  const timeline: TimelineEvent[] = [
    {
      id: `reg-${dbUser.id}`,
      type: "REGISTER",
      title: "Kayıt",
      description: `Müşteri platforma kaydoldu. (${dbUser.email})`,
      date: dbUser.createdAt.toISOString(),
      icon: "👤",
      badgeBg: "bg-blue-100 text-blue-800",
    },
  ];

  dbUser.orders.forEach((ord) => {
    timeline.push({
      id: `ord-${ord.id}`,
      type: "ORDER",
      title: "Sipariş",
      description: `#ORD-${ord.id.slice(-8).toUpperCase()} numaralı siparişi verdi. Tutar: ${ord.totalPrice.toLocaleString("tr-TR")} ₺ (${ord.status})`,
      date: ord.createdAt.toISOString(),
      link: `/admin/orders/${ord.id}`,
      icon: "🛒",
      badgeBg: ord.status === "CANCELLED" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800",
    });
  });

  dbUser.returns.forEach((ret) => {
    timeline.push({
      id: `ret-${ret.id}`,
      type: "RETURN",
      title: "İade",
      description: `İade talebi oluşturdu. (Durum: ${ret.status})`,
      date: ret.createdAt.toISOString(),
      link: `/admin/returns`,
      icon: "↩️",
      badgeBg: "bg-amber-100 text-amber-800",
    });
  });

  dbUser.exchanges.forEach((exc) => {
    timeline.push({
      id: `exc-${exc.id}`,
      type: "EXCHANGE",
      title: "Değişim",
      description: `Ürün değişim talebi oluşturdu. (Durum: ${exc.status})`,
      date: exc.createdAt.toISOString(),
      link: `/admin/exchanges`,
      icon: "🔁",
      badgeBg: "bg-purple-100 text-purple-800",
    });
  });

  dbUser.addresses.forEach((addr) => {
    timeline.push({
      id: `addr-${addr.id}`,
      type: "ADDRESS",
      title: "Adres",
      description: `Yeni teslimat adresi ekledi: ${addr.title} (${addr.city})`,
      date: addr.createdAt.toISOString(),
      icon: "🏠",
      badgeBg: "bg-gray-100 text-gray-800",
    });
  });

  // Tarihe göre sırala (en yeniden en eskiye)
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const customerDTO: CustomerProfileDTO = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    phone: dbUser.phone,
    role: dbUser.role,
    isActive: dbUser.isActive,
    avatarUrl: dbUser.avatarUrl,
    createdAt: dbUser.createdAt.toISOString(),
    totalSpent,
    segment,
    addresses: dbUser.addresses,
    orders: dbUser.orders.map((o) => ({
      id: o.id,
      totalPrice: o.totalPrice,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      itemsCount: o.items.length,
    })),
    returns: dbUser.returns.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      orderId: r.orderId,
    })),
    exchanges: dbUser.exchanges.map((e) => ({
      id: e.id,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      orderId: e.orderId,
    })),
    timeline,
  };

  return (
    <div className="w-full">
      <CustomerProfileClient customer={customerDTO} />
    </div>
  );
}