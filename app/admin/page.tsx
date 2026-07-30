import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AdminNotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

const NOTIF_ICONS: Record<AdminNotificationType, string> = {
  NEW_ORDER: "🛒",
  LOW_STOCK: "⚠️",
  ORDER_CANCELLED: "🛑",
  RETURN_REQUEST: "↩️",
  EXCHANGE_REQUEST: "🔁",
  SYSTEM: "⚙️",
  USER_REGISTERED: "👤",
};

export default async function AdminDashboardPage() {
  // 1. SUNUCU RBAC GÜVENLİK KONTROLÜ (VIEW_DASHBOARD Yetkisi)
  try {
    await requireAdmin("VIEW_DASHBOARD");
  } catch {
    redirect("/");
  }

  // 2. PARALEL SUNUCU SORGULARI (Promise.all ile Maksimum Veritabanı Performansı)
  const [
    revenueAggregation,
    totalOrders,
    pendingOrdersCount,
    criticalStockCount,
    totalUsers,
    recentNotifications,
    recentOrders,
  ] = await Promise.all([
    // Toplam Ciro (İptal edilmemiş siparişler)
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { status: { not: "CANCELLED" } },
    }),

    // Toplam Sipariş Sayısı
    prisma.order.count(),

    // Bekleyen Sipariş Sayısı (PENDING veya PROCESSING)
    prisma.order.count({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
    }),

    // Kritik Stok Ürün Sayısı (Stok <= 5 ve Aktif ürünler)
    prisma.product.count({
      where: { stock: { lte: 5 }, isActive: true },
    }),

    // Toplam Müşteri Sayısı
    prisma.user.count({
      where: { role: "USER" },
    }),

    // 🚀 DİNAMİK ADMİN BİLDİRİMLERİ TABLOSUNDAN SON UYARILAR
    prisma.adminNotification.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),

    // 🛡️ SON 5 SİPARİŞ (Veri sızıntısını önlemek adına hassas alanlar süzülmüştür)
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const totalRevenue = revenueAggregation._sum.totalPrice || 0;

  return (
    <div className="space-y-6 sm:space-y-8 w-full overflow-x-clip animate-in fade-in duration-300">
      
      {/* 🚀 ÜST BAŞLIK VE CANLI YÖNETİCİ ÖZETİ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md uppercase tracking-widest mb-1.5 inline-block">
            Yönetim Portalı
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">İşletme Komuta Merkezi</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">
            Gerçek zamanlı ciro, canlı bildirimler ve envanter durumu özeti.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-sm min-h-[44px] flex items-center gap-1.5"
          >
            <span>➕</span> Yeni Ürün Ekle
          </Link>
        </div>
      </div>

      {/* 🚀 1. 4'LÜ ŞIK İSTATİSTİK ÖZET KARTLARI (STAT CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Toplam Ciro */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 sm:p-6 rounded-2xl shadow-md text-white flex flex-col justify-between min-h-[125px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-[11px] font-extrabold uppercase tracking-widest mb-1">Toplam Ciro</p>
              <h2 className="text-2xl sm:text-3xl font-black">{totalRevenue.toLocaleString("tr-TR")} ₺</h2>
            </div>
            <div className="p-2.5 bg-white/20 rounded-xl text-xl">💰</div>
          </div>
          <span className="text-[11px] text-emerald-100 font-medium pt-2 border-t border-white/20 mt-2">
            İptal edilmemiş siparişler toplamı
          </span>
        </div>

        {/* Toplam Sipariş */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 sm:p-6 rounded-2xl shadow-md text-white flex flex-col justify-between min-h-[125px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-[11px] font-extrabold uppercase tracking-widest mb-1">Toplam Sipariş</p>
              <h2 className="text-2xl sm:text-3xl font-black">{totalOrders} <span className="text-sm font-bold opacity-80">Adet</span></h2>
            </div>
            <div className="p-2.5 bg-white/20 rounded-xl text-xl">📦</div>
          </div>
          <span className="text-[11px] text-blue-100 font-medium pt-2 border-t border-white/20 mt-2">
            Kayıtlı tüm müşteri siparişleri
          </span>
        </div>

        {/* Bekleyen Siparişler */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 sm:p-6 rounded-2xl shadow-md text-white flex flex-col justify-between min-h-[125px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-100 text-[11px] font-extrabold uppercase tracking-widest mb-1">Bekleyen İşlem</p>
              <h2 className="text-2xl sm:text-3xl font-black">{pendingOrdersCount} <span className="text-sm font-bold opacity-80">Sipariş</span></h2>
            </div>
            <div className="p-2.5 bg-white/20 rounded-xl text-xl animate-pulse">⏳</div>
          </div>
          <span className="text-[11px] text-amber-100 font-medium pt-2 border-t border-white/20 mt-2">
            Hazırlanmayı/Kargolanmayı bekliyor
          </span>
        </div>

        {/* Kritik Stok Uyarısı */}
        <div className="bg-gradient-to-br from-rose-600 to-red-700 p-5 sm:p-6 rounded-2xl shadow-md text-white flex flex-col justify-between min-h-[125px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-rose-100 text-[11px] font-extrabold uppercase tracking-widest mb-1">Kritik Stok Uyarısı</p>
              <h2 className="text-2xl sm:text-3xl font-black">{criticalStockCount} <span className="text-sm font-bold opacity-80">Ürün</span></h2>
            </div>
            <div className="p-2.5 bg-white/20 rounded-xl text-xl">⚠️</div>
          </div>
          <span className="text-[11px] text-rose-100 font-medium pt-2 border-t border-white/20 mt-2">
            Stoğu 5 ve altında kalan ürünler
          </span>
        </div>

      </div>

      {/* 🚀 2. DİNAMİK ADMİN BİLDİRİM VE AKSİYON MERKEZİ (ACTION CENTER) */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">Canlı Sistem Bildirimleri</h3>
          </div>
          <Link
            href="/admin/notifications"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
          >
            Tüm Bildirimleri Yönet &rarr;
          </Link>
        </div>

        <div className="p-4 sm:p-5">
          {recentNotifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold">
              ✅ Şu an için kayda değer yeni sistem bildirimi yok.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border transition flex items-start gap-3 justify-between ${
                    !notif.isRead ? "bg-blue-50/30 border-blue-200" : "bg-gray-50/40 border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-base flex-shrink-0 shadow-xs">
                      {NOTIF_ICONS[notif.type] || "🔔"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-gray-900 text-xs sm:text-sm leading-snug">{notif.title}</p>
                      <p className="text-gray-600 text-xs mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                        {new Date(notif.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {notif.link && (
                    <Link
                      href={notif.link}
                      className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition flex-shrink-0 self-center shadow-xs"
                    >
                      İncele ↗
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🚀 3. SON SİPARİŞLER TABLOSU (RECENT ORDERS TABLE) */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-black text-gray-900 text-sm sm:text-base flex items-center gap-2">
            <span>📋</span> Son Sipariş Hareketleri
          </h3>
          <Link href="/admin/orders" className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-extrabold transition">
            Tüm Siparişleri İncele &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-gray-100">
              <tr>
                <th className="p-3.5 sm:p-4">Sipariş Kodu</th>
                <th className="p-3.5 sm:p-4">Müşteri</th>
                <th className="p-3.5 sm:p-4">Tarih</th>
                <th className="p-3.5 sm:p-4">Tutar</th>
                <th className="p-3.5 sm:p-4">Durum</th>
                <th className="p-3.5 sm:p-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/80 transition">
                  <td className="p-3.5 sm:p-4 font-mono font-bold text-gray-900">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="p-3.5 sm:p-4 font-extrabold text-gray-900">
                    {order.user?.name || "Anonim Müşteri"}
                    <span className="block text-[11px] text-gray-400 font-normal">{order.user?.email}</span>
                  </td>
                  <td className="p-3.5 sm:p-4 text-gray-500 font-medium">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="p-3.5 sm:p-4 font-black text-blue-600">
                    {order.totalPrice.toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="p-3.5 sm:p-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-extrabold uppercase tracking-wider ${
                        order.status === "DELIVERED"
                          ? "bg-green-100 text-green-700"
                          : order.status === "SHIPPED"
                          ? "bg-blue-100 text-blue-700"
                          : order.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {order.status === "DELIVERED" ? "Teslim Edildi" : order.status === "SHIPPED" ? "Kargoda" : order.status === "CANCELLED" ? "İptal Edildi" : "Hazırlanıyor"}
                    </span>
                  </td>
                  <td className="p-3.5 sm:p-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-800 font-extrabold text-xs transition"
                    >
                      Detayına Git ↗
                    </Link>
                  </td>
                </tr>
              ))}

              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 font-medium">
                    Sistemde henüz kaydedilmiş bir sipariş bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}