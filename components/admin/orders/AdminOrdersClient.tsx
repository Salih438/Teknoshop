"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import OrderStatusSelect from "@/app/admin/orders/OrderStatusSelect";
import OrderInvoiceModal from "./OrderInvoiceModal";

export interface OrderItemDTO {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  user?: { name?: string | null; email?: string | null } | null;
  itemsCount: number;
  paymentStatus?: string;
}

interface AdminOrdersClientProps {
  orders: OrderItemDTO[];
  totalOrders: number;
  pendingCount: number;
  shippedCount: number;
  deliveredCount: number;
  cancelledCount: number;
}

export default function AdminOrdersClient({
  orders,
  totalOrders,
  pendingCount,
  shippedCount,
  deliveredCount,
  cancelledCount,
}: AdminOrdersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // URL Arama & Filtre Parametreleri
  const searchQuery = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "";
  const paymentFilter = searchParams.get("payment") || "";
  const pageSize = Number(searchParams.get("limit")) || 10;
  const currentPage = Number(searchParams.get("page")) || 1;

  const [searchInput, setSearchInput] = useState(searchQuery);

  const updateFilters = (newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    startTransition(() => {
      router.push(`/admin/orders?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput, page: 1 });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(orders.map((o) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (targetStatus: string) => {
    if (selectedIds.length === 0) return;

    const toastId = toast.loading(`${selectedIds.length} sipariş güncelleniyor...`);
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedIds, status: targetStatus }),
      });

      if (res.ok) {
        toast.success(`${selectedIds.length} sipariş durumu güncellendi!`, { id: toastId });
        setSelectedIds([]);
        router.refresh();
      } else {
        toast.error("Toplu güncelleme başarısız.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası oluştu.", { id: toastId });
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error("İndirilecek sipariş bulunamadı.");
      return;
    }

    const headers = ["Siparis ID", "Tarih", "Musteri", "E-Posta", "Urun Sayisi", "Tutar (TL)", "Durum"];
    const rows = orders.map((o) => [
      `"#ORD-${o.id.slice(-8).toUpperCase()}"`,
      `"${new Date(o.createdAt).toLocaleDateString("tr-TR")}"`,
      `"${(o.user?.name || "Müşteri").replace(/"/g, '""')}"`,
      `"${(o.user?.email || "-").replace(/"/g, '""')}"`,
      o.itemsCount,
      o.totalPrice,
      `"${o.status}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `siparisler_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sipariş listesi CSV olarak indirildi!");
  };

  const totalPages = Math.ceil(orders.length / pageSize) || 1;
  const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      
      {/* 🚀 BAŞLIK VE KISA AÇIKLAMA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>📋</span> Sipariş Yönetim Merkezi
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">
            Müşteri siparişlerini anlık filtreleyin, durumlarını güncelleyin ve toplu aksiyonlar alın.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>📥</span> CSV Olarak İndir
          </button>

          {/* TOPLU İŞLEM BAR (Seçim yapıldığında belirir) */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 p-2 rounded-2xl shadow-xs animate-in zoom-in duration-200">
              <span className="text-xs font-black text-blue-900 px-2">
                {selectedIds.length} Seçildi:
              </span>
              <button
                onClick={() => handleBulkStatusUpdate("PROCESSING")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
              >
                ⚙️ Toplu Hazırlanıyor
              </button>
              <button
                onClick={() => handleBulkStatusUpdate("SHIPPED")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
              >
                🚚 Toplu Kargoya Ver
              </button>
              <button
                onClick={() => handleBulkStatusUpdate("DELIVERED")}
                className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
              >
                ✅ Toplu Teslim Edildi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🚀 1. ÖZET İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-blue-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Toplam Sipariş</span>
          <p className="text-xl sm:text-2xl font-black text-gray-900">{totalOrders}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-amber-500">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Bekleyen</span>
          <p className="text-xl sm:text-2xl font-black text-amber-600">{pendingCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-indigo-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Kargoda</span>
          <p className="text-xl sm:text-2xl font-black text-indigo-600">{shippedCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-green-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Teslim Edildi</span>
          <p className="text-xl sm:text-2xl font-black text-green-600">{deliveredCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-red-600 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">İptal Edilen</span>
          <p className="text-xl sm:text-2xl font-black text-red-600">{cancelledCount}</p>
        </div>
      </div>

      {/* 🚀 2. GELİŞMİŞ FİLTRELEME VE GLOBAL ARAMA BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          
          {/* Global Arama Kutu */}
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-3 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Sipariş kopyala (#ORD-...), Müşteri Adı veya Email arayın..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm min-h-[44px]"
            />
          </div>

          {/* Durum Filtresi */}
          <select
            value={statusFilter}
            onChange={(e) => updateFilters({ status: e.target.value, page: 1 })}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px] font-medium"
          >
            <option value="">Tüm Sipariş Durumları</option>
            <option value="PENDING">⏳ Bekleyen</option>
            <option value="PROCESSING">⚙️ Hazırlanıyor</option>
            <option value="SHIPPED">🚚 Kargoya Verildi</option>
            <option value="DELIVERED">✅ Teslim Edildi</option>
            <option value="CANCELLED">🛑 İptal Edilen</option>
          </select>

          {/* Ödeme Durumu Filtresi */}
          <select
            value={paymentFilter}
            onChange={(e) => updateFilters({ payment: e.target.value, page: 1 })}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px] font-medium"
          >
            <option value="">Tüm Ödeme Durumları</option>
            <option value="COMPLETED">💳 Ödendi / Tamamlandı</option>
            <option value="PENDING">⏳ Ödeme Bekliyor</option>
            <option value="REFUNDED">🔄 İade Edildi</option>
          </select>

          <button
            type="submit"
            className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs sm:text-sm min-h-[44px]"
          >
            Filtrele
          </button>

          {(searchQuery || statusFilter || paymentFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                startTransition(() => router.push("/admin/orders"));
              }}
              className="text-red-600 hover:bg-red-50 border border-red-200 font-extrabold px-3.5 py-2.5 rounded-xl transition text-xs sm:text-sm min-h-[44px]"
            >
              Filtreleri Sıfırla
            </button>
          )}
        </form>
      </div>

      {/* 🚀 3. MODERN DATA TABLE (DESKTOP) VE KART DÜZENİ (MOBİL) */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        
        {/* ÜST TOPLU SEÇİM BİLGİ BAR */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.length === orders.length && orders.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            Tümünü Seç ({orders.length} Sipariş)
          </label>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Sayfa Başı Gösterim:</span>
            <select
              value={pageSize}
              onChange={(e) => updateFilters({ limit: Number(e.target.value), page: 1 })}
              className="bg-white border border-gray-200 px-2 py-1 rounded-lg text-xs font-bold outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* 💻 MASAÜSTÜ VERİ TABLOSU (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-gray-200">
              <tr>
                <th className="p-3.5 w-10 text-center">#</th>
                <th className="p-3.5">Sipariş No</th>
                <th className="p-3.5">Müşteri</th>
                <th className="p-3.5">Tarih</th>
                <th className="p-3.5">Parça</th>
                <th className="p-3.5">Tutar</th>
                <th className="p-3.5">Sipariş Durumu</th>
                <th className="p-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {paginatedOrders.map((order) => {
                const customerName = order.user?.name || "Anonim Müşteri";
                const customerEmail = order.user?.email || "N/A";
                const isSelected = selectedIds.includes(order.id);

                return (
                  <tr
                    key={order.id}
                    className={`transition ${isSelected ? "bg-blue-50/40" : "hover:bg-gray-50/70"}`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(order.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-3.5 font-mono font-bold text-gray-900">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="p-3.5">
                      <p className="font-extrabold text-gray-900 truncate max-w-[160px]">{customerName}</p>
                      <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{customerEmail}</p>
                    </td>
                    <td className="p-3.5 text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="p-3.5 text-gray-700 font-bold">
                      {order.itemsCount} Ürün
                    </td>
                    <td className="p-3.5 font-black text-blue-600">
                      {order.totalPrice.toLocaleString("tr-TR")} ₺
                    </td>
                    <td className="p-3.5">
                      <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                    </td>
                    <td className="p-3.5 text-right flex items-center justify-end gap-1.5">
                      <OrderInvoiceModal
                        orderId={order.id}
                        customerName={customerName}
                        customerEmail={customerEmail}
                        totalPrice={order.totalPrice}
                        createdAt={order.createdAt}
                        status={order.status}
                      />
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold px-3 py-1.5 rounded-lg text-xs transition min-h-[36px] flex items-center justify-center"
                      >
                        Detaylar ➔
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-4xl">📦</span>
                      <p className="text-base font-extrabold text-gray-700">Sipariş Bulunamadı</p>
                      <p className="text-xs text-gray-500">Seçtiğiniz filtreye veya arama kelimesine uygun sipariş yok.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📱 MOBİL KART GÖRÜNÜMÜ (md:hidden) */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginatedOrders.map((order) => {
            const customerName = order.user?.name || "Anonim Müşteri";
            const customerEmail = order.user?.email || "N/A";
            const isSelected = selectedIds.includes(order.id);

            return (
              <div
                key={order.id}
                className={`p-4 space-y-3 ${isSelected ? "bg-blue-50/40" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(order.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-mono font-bold text-gray-900 text-xs">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <p className="font-extrabold text-gray-900 text-sm mt-0.5">{customerName}</p>
                    </div>
                  </div>

                  <span className="font-black text-blue-600 text-base">
                    {order.totalPrice.toLocaleString("tr-TR")} ₺
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                  <span>Tarih: {new Date(order.createdAt).toLocaleDateString("tr-TR")}</span>
                  <span className="font-bold text-gray-700">{order.itemsCount} Parça Ürün</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
                  <OrderStatusSelect orderId={order.id} currentStatus={order.status} />

                  <div className="flex items-center gap-1.5">
                    <OrderInvoiceModal
                      orderId={order.id}
                      customerName={customerName}
                      customerEmail={customerEmail}
                      totalPrice={order.totalPrice}
                      createdAt={order.createdAt}
                      status={order.status}
                    />
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold px-3 py-1.5 rounded-lg text-xs transition min-h-[36px] flex items-center justify-center"
                    >
                      İncele ↗
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {paginatedOrders.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-xs">
              Sipariş bulunamadı.
            </div>
          )}
        </div>

        {/* 🚀 PAGINATION SAYFALAMA BARI */}
        {totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-gray-500 font-medium">
              Sayfa <span className="font-bold text-gray-900">{currentPage}</span> / {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => updateFilters({ page: currentPage - 1 })}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
              >
                &larr; Önceki
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => updateFilters({ page: pageNum })}
                    className={`w-8 h-8 rounded-lg font-bold transition ${
                      currentPage === pageNum
                        ? "bg-gray-900 text-white"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => updateFilters({ page: currentPage + 1 })}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
              >
                Sonraki &rarr;
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
