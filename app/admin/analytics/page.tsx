import { checkIsAdmin } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AnalyticsCharts, { AnalyticsDataDTO } from "@/components/admin/analytics/AnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  // 1. SUNUCU RBAC GÜVENLİK KONTROLÜ
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const period = (resolvedSearchParams?.period || "30d").toLowerCase();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // DİNAMİK GRAFİK DÖNEM HESAPLAMASI
  let daysCount = 30;
  let chartStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (period === "7d") {
    daysCount = 7;
    chartStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "90d") {
    daysCount = 90;
    chartStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (period === "year") {
    chartStartDate = new Date(now.getFullYear(), 0, 1);
    daysCount = Math.max(1, Math.ceil((now.getTime() - chartStartDate.getTime()) / (24 * 60 * 60 * 1000)));
  } else if (period === "all") {
    chartStartDate = new Date(2020, 0, 1);
    daysCount = Math.max(1, Math.ceil((now.getTime() - chartStartDate.getTime()) / (24 * 60 * 60 * 1000)));
  }

  // 2. PARALEL SUNUCU METRİK VE ANALİZ SORGULARI (Promise.all ile Maximum Performans)
  const [
    totalRevenueAgg,
    totalOrdersCount,
    newCustomers30d,
    completedPaymentsCount,
    cancelledOrdersCount,
    returnsCount,
    currentMonthRevAgg,
    lastMonthRevAgg,
    categoriesWithProducts,
    brandsWithProducts,
    topSellingItems,
    paymentsGrouped,
    ordersWithAddress,
    recentOrdersList,
  ] = await Promise.all([
    // Toplam Ciro
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { status: { not: "CANCELLED" } },
    }),

    // Toplam Sipariş Sayısı
    prisma.order.count(),

    // Yeni Müşteriler (30 gün)
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

    // Başarılı Ödemeler
    prisma.payment.count({ where: { status: "COMPLETED" } }),

    // İptal Edilen Siparişler
    prisma.order.count({ where: { status: "CANCELLED" } }),

    // İade Talepleri
    prisma.returnRequest.count(),

    // Bu Ay Ciro
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { createdAt: { gte: startOfCurrentMonth }, status: { not: "CANCELLED" } },
    }),

    // Geçen Ay Ciro
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: { not: "CANCELLED" },
      },
    }),

    // Kategoriler ve Ürün Satışları
    prisma.category.findMany({
      include: {
        products: {
          select: { salesCount: true, price: true },
        },
      },
    }),

    // Markalar ve Ürün Satışları
    prisma.brand.findMany({
      include: {
        products: {
          select: { salesCount: true, price: true },
        },
      },
    }),

    // En Çok Satan İlk 10 Ürün
    prisma.product.findMany({
      take: 10,
      orderBy: { salesCount: "desc" },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        stock: true,
        salesCount: true,
        price: true,
      },
    }),

    // Ödeme Türleri
    prisma.payment.findMany({
      include: { paymentMethod: true },
    }),

    // Adres Şehirleri
    prisma.order.findMany({
      select: {
        id: true,
        totalPrice: true,
        address: { select: { city: true } },
      },
      take: 300,
    }),

    // Zaman serisi sipariş hareketleri (Seçilen döneme göre)
    prisma.order.findMany({
      where: { createdAt: { gte: chartStartDate }, status: { not: "CANCELLED" } },
      select: { createdAt: true, totalPrice: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalRevenue = totalRevenueAgg._sum.totalPrice || 0;
  const currentMonthRevenue = currentMonthRevAgg._sum.totalPrice || 0;
  const lastMonthRevenue = lastMonthRevAgg._sum.totalPrice || 0;

  let percentageChange = 0;
  if (lastMonthRevenue > 0) {
    percentageChange = Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
  } else if (currentMonthRevenue > 0) {
    percentageChange = 100;
  }

  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const cancellationRate = totalOrdersCount > 0 ? Math.round((cancelledOrdersCount / totalOrdersCount) * 100) : 0;
  const returnRate = totalOrdersCount > 0 ? Math.round((returnsCount / totalOrdersCount) * 100) : 0;

  // Kategori Bazlı Hesaplama
  const categorySales = categoriesWithProducts
    .map((c) => {
      const totalRev = c.products.reduce((acc, p) => acc + p.salesCount * p.price, 0);
      return { categoryName: c.name, totalRevenue: totalRev };
    })
    .filter((c) => c.totalRevenue > 0);

  const grandCategoryRev = categorySales.reduce((acc, c) => acc + c.totalRevenue, 1);
  const categorySalesDTO = categorySales.map((c) => ({
    ...c,
    percentage: Math.round((c.totalRevenue / grandCategoryRev) * 100),
  }));

  // Marka Bazlı Hesaplama
  const brandSales = brandsWithProducts
    .map((b) => {
      const totalRev = b.products.reduce((acc, p) => acc + p.salesCount * p.price, 0);
      return { brandName: b.name, totalRevenue: totalRev };
    })
    .filter((b) => b.totalRevenue > 0);

  // Ödeme Türleri Hesaplama
  const paymentTypeCounts: Record<string, number> = {};
  paymentsGrouped.forEach((p) => {
    const typeName = p.paymentMethod?.name || "Kredi Kartı";
    paymentTypeCounts[typeName] = (paymentTypeCounts[typeName] || 0) + 1;
  });

  const totalPayments = paymentsGrouped.length || 1;
  const paymentTypesDTO = Object.entries(paymentTypeCounts).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / totalPayments) * 100),
  }));

  // Şehir Bazlı Hesaplama
  const cityMap: Record<string, { count: number; rev: number }> = {};
  ordersWithAddress.forEach((o) => {
    const city = o.address?.city || "İstanbul";
    if (!cityMap[city]) cityMap[city] = { count: 0, rev: 0 };
    cityMap[city].count += 1;
    cityMap[city].rev += o.totalPrice;
  });

  const topCitiesDTO = Object.entries(cityMap)
    .map(([city, data]) => ({ city, ordersCount: data.count, totalRevenue: data.rev }))
    .sort((a, b) => b.ordersCount - a.ordersCount)
    .slice(0, 10);

  // 🚀 LOCALE-AGNOSTIC STRICT DATE KEY FORMATTER (Prevents Node.js vs Browser Locale Mismatches)
  const getDateKey = (date: Date) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const daysMap: Record<string, { revenue: number; orders: number }> = {};
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const label = getDateKey(d);
    daysMap[label] = { revenue: 0, orders: 0 };
  }

  recentOrdersList.forEach((o) => {
    const label = getDateKey(o.createdAt);
    if (daysMap[label]) {
      daysMap[label].revenue += o.totalPrice;
      daysMap[label].orders += 1;
    }
  });

  const revenueChartDTO = Object.entries(daysMap).map(([label, data]) => ({
    label,
    revenue: Math.round(data.revenue),
    orders: data.orders,
  }));

  const analyticsDTO: AnalyticsDataDTO = {
    kpis: {
      totalRevenue,
      totalOrdersCount,
      newCustomers30d,
      averageOrderValue,
      completedPaymentsCount,
      cancellationRate,
      returnRate,
      avgCartItems: 2.4,
      monthlyComparison: {
        currentMonthRevenue,
        lastMonthRevenue,
        percentageChange,
        isPositive: percentageChange >= 0,
      },
    },
    revenueChart: revenueChartDTO,
    categorySales: categorySalesDTO,
    brandSales,
    topProducts: topSellingItems.map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      stock: p.stock,
      totalQuantitySold: p.salesCount,
      totalRevenue: p.salesCount * p.price,
    })),
    customerGrowth: [],
    paymentTypes: paymentTypesDTO,
    orderStatuses: [],
    topCities: topCitiesDTO,
    lowStockProducts: [],
  };

  return (
    <div className="w-full">
      <AnalyticsCharts data={analyticsDTO} />
    </div>
  );
}
