import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExchangeStatus, Prisma } from "@prisma/client";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
import AdminExchangesClientPage from "./AdminExchangesClientPage";

export const dynamic = "force-dynamic";

export default async function AdminExchangesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const params = await searchParams;
  const statusFilter = typeof params?.status === "string" ? params.status : "";
  const searchQuery = typeof params?.q === "string" ? params.q.trim() : "";

  // 1. DİNAMİK FİLTRELEME
  const whereCondition: Prisma.ExchangeRequestWhereInput = {};

  if (statusFilter) {
    whereCondition.status = statusFilter as ExchangeStatus;
  }

  if (searchQuery) {
    whereCondition.OR = [
      { id: { contains: searchQuery, mode: "insensitive" } },
      { orderId: { contains: searchQuery, mode: "insensitive" } },
      { user: { name: { contains: searchQuery, mode: "insensitive" } } },
      { user: { email: { contains: searchQuery, mode: "insensitive" } } },
    ];
  }

  // 2. İSTATİSTİKLER İÇİN OPTİMİZE VERİ ÇEKİMİ (Single GroupBy Query)
  const [totalExchanges, statusCounts] = await Promise.all([
    prisma.exchangeRequest.count(),
    prisma.exchangeRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map(statusCounts.map((s) => [s.status, s._count._all]));

  const pendingExchanges = countMap.get("PENDING") || 0;
  const waitingStockExchanges = countMap.get("WAITING_STOCK") || 0;
  const inProgressExchanges =
    (countMap.get("APPROVED") || 0) +
    (countMap.get("WAITING_FOR_CUSTOMER") || 0) +
    (countMap.get("SHIPPED") || 0) +
    (countMap.get("RECEIVED") || 0) +
    (countMap.get("PROCESSING") || 0);
  const completedExchanges = countMap.get("COMPLETED") || 0;
  const rejectedExchanges = countMap.get("REJECTED") || 0;

  // 3. DEĞİŞİM TALEPLERİ LİSTESİ VERİ ÇEKİMİ
  const exchangeRequests = await prisma.exchangeRequest.findMany({
    where: whereCondition,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      order: {
        select: {
          id: true,
          createdAt: true,
          totalPrice: true,
        },
      },
      items: {
        include: {
          orderItem: {
            include: {
              product: { include: { images: true } },
              variant: true,
            },
          },
          requestedProduct: { include: { images: true } },
          requestedVariant: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Toaster position="bottom-right" />

      {/* BAŞLIK */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🔁 Ürün Değişim Yönetimi</h1>
          <p className="text-gray-500 mt-2">Beden, renk ve ürün değişim taleplerini inceleyin, onaylayın ve stok senkronizasyonunu yönetin.</p>
        </div>
      </div>

      {/* ÖZET İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-gray-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Toplam Talep</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalExchanges}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Bekleyen (İnceleme)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pendingExchanges}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-orange-500">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Stok Bekleyen</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{waitingStockExchanges}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Süreçte (Kargo/Hazırlık)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{inProgressExchanges}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Tamamlanan</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{completedExchanges}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Reddedilen</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{rejectedExchanges}</p>
        </div>
      </div>

      {/* ARAMA VE FİLTRELEME ÇUBUĞU */}
      <form action="/admin/exchanges" method="GET" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Değişim ID, Sipariş No veya Müşteri Adı / E-Posta Ara..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
        </div>
        <select
          name="status"
          defaultValue={statusFilter}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
        >
          <option value="">Tüm Değişim Durumları</option>
          <option value="PENDING">Bekleyen (PENDING)</option>
          <option value="APPROVED">Onaylanan (APPROVED)</option>
          <option value="WAITING_STOCK">Stok Bekleyen (WAITING_STOCK)</option>
          <option value="SHIPPED">Kargoda (SHIPPED)</option>
          <option value="RECEIVED">Depoda (RECEIVED)</option>
          <option value="PROCESSING">Hazırlanıyor (PROCESSING)</option>
          <option value="COMPLETED">Tamamlanan (COMPLETED)</option>
          <option value="REJECTED">Reddedilen (REJECTED)</option>
        </select>

        <button type="submit" className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition text-sm">
          Filtrele
        </button>
        {(statusFilter || searchQuery) && (
          <Link href="/admin/exchanges" className="text-gray-500 hover:text-red-500 font-medium px-2 transition flex items-center text-sm">
            Temizle
          </Link>
        )}
      </form>

      {/* DEĞİŞİM LİSTESİ CLIENT WRAPPER */}
      <AdminExchangesClientPage exchangeRequests={exchangeRequests} />
    </div>
  );
}
