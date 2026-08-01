"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import CouponWizardModal from "./CouponWizardModal";
import CouponDetailDrawer, { CouponDetailDrawerData } from "./CouponDetailDrawer";
import DeleteCouponButton from "@/components/admin/DeleteCouponButton";
import ConfirmModal from "@/components/ui/ConfirmModal";

export interface CouponDTO {
  id: string;
  code: string;
  discount: number;
  minAmount?: number | null;
  isSingleUse: boolean;
  usageLimit: number;
  usedCount: number;
  expireDate: string;
  isActive: boolean;
  createdAt: string;
  usages: {
    id: string;
    createdAt: string;
    user: { name: string; email: string };
    order: { id: string; totalPrice: number; status: string };
  }[];
}

interface AdminCouponsClientProps {
  coupons: CouponDTO[];
  totalCoupons: number;
  activeCount: number;
  expiringSoonCount: number;
  passiveCount: number;
  couponRevenue: number;
  usageRate: number;
}

export default function AdminCouponsClient({
  coupons,
  totalCoupons,
  activeCount,
  expiringSoonCount,
  passiveCount,
  couponRevenue,
  usageRate,
}: AdminCouponsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedDrawerCoupon, setSelectedDrawerCoupon] = useState<CouponDetailDrawerData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const searchQuery = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "";
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
      router.push(`/admin/coupons?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput, page: 1 });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(coupons.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;

    if (action === "delete") {
      setIsBulkDeleteModalOpen(true);
      return;
    }

    await executeBulkAction(action);
  };

  const executeBulkAction = async (action: string) => {
    const toastId = toast.loading(`${selectedIds.length} kupon işleniyor...`);
    try {
      const res = await fetch("/api/admin/coupons/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponIds: selectedIds, action }),
      });

      if (res.ok) {
        toast.success("Toplu işlem başarıyla tamamlandı!", { id: toastId });
        setSelectedIds([]);
        router.refresh();
      } else {
        toast.error("Toplu işlem başarısız.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası oluştu.", { id: toastId });
    }
  };

  const handleToggleActive = async (couponId: string) => {
    const toastId = toast.loading("Durum güncelleniyor...");
    try {
      const res = await fetch("/api/admin/coupons/quick-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleActive", couponId }),
      });

      if (res.ok) {
        toast.success("Kupon aktiflik durumu değiştirildi!", { id: toastId });
        router.refresh();
      } else {
        toast.error("İşlem başarısız.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası.", { id: toastId });
    }
  };

  const handleDuplicateCoupon = async (couponId: string) => {
    const toastId = toast.loading("Kupon çoğaltılıyor (kopyalanıyor)...");
    try {
      const res = await fetch("/api/admin/coupons/quick-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicateCoupon", couponId }),
      });

      if (res.ok) {
        toast.success("Kupon başarıyla kopyalandı!", { id: toastId });
        router.refresh();
      } else {
        toast.error("Kopyalama başarısız.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası.", { id: toastId });
    }
  };

  const openDrawer = (coupon: CouponDTO) => {
    setSelectedDrawerCoupon(coupon);
    setIsDrawerOpen(true);
  };

  const totalPages = Math.ceil(coupons.length / pageSize) || 1;
  const paginatedCoupons = coupons.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 w-full overflow-x-clip animate-in fade-in duration-300">
      
      {/* 🚀 BAŞLIK VE AKSİYONLAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>🎟️</span> Kampanya & Kupon Yönetim Merkezi
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">
            Shopify ve Marketing standartlarında indirim kuponları ve kampanya yönetimi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 p-2 rounded-2xl shadow-xs animate-in zoom-in duration-200">
              <span className="text-xs font-black text-blue-900 px-2">{selectedIds.length} Seçildi:</span>
              <button
                onClick={() => handleBulkAction("activate")}
                className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-xs min-h-[36px]"
              >
                🟢 Aktifleştir
              </button>
              <button
                onClick={() => handleBulkAction("deactivate")}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-xs min-h-[36px]"
              >
                🔴 Pasifleştir
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-xs min-h-[36px]"
              >
                🗑 Sil
              </button>
            </div>
          )}

          <button
            onClick={() => setIsWizardOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-sm min-h-[44px] flex items-center gap-1.5"
          >
            <span>➕</span> Yeni Kampanya Sihirbazı
          </button>
        </div>
      </div>

      {/* 🚀 1. ÖZET İSTATİSTİK 6 METRİK KARTI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-blue-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Toplam Kupon</span>
          <p className="text-xl sm:text-2xl font-black text-gray-900">{totalCoupons}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-green-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Aktif Kampanya</span>
          <p className="text-xl sm:text-2xl font-black text-green-600">{activeCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-amber-500">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Yakında Bitecek</span>
          <p className="text-xl sm:text-2xl font-black text-amber-600">{expiringSoonCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-red-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Pasif / Süresi Dolan</span>
          <p className="text-xl sm:text-2xl font-black text-red-600">{passiveCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-emerald-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Kuponlu Satış</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600">{couponRevenue.toLocaleString("tr-TR")} ₺</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-purple-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Kullanım Oranı</span>
          <p className="text-xl sm:text-2xl font-black text-purple-600">%{usageRate}</p>
        </div>
      </div>

      {/* 🚀 2. GELİŞMİŞ FİLTRELEME BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          
          {/* Global Arama Kutu */}
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-3 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Kupon Kodu (Örn: YAZ100) arayın..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm min-h-[44px] uppercase"
            />
          </div>

          {/* Durum Filtresi */}
          <select
            value={statusFilter}
            onChange={(e) => updateFilters({ status: e.target.value, page: 1 })}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px] font-medium"
          >
            <option value="">Tüm Kampanya Durumları</option>
            <option value="active">🟢 Aktif Kampanyalar</option>
            <option value="passive">🔴 Pasif / Süresi Dolanlar</option>
          </select>

          <button
            type="submit"
            className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs sm:text-sm min-h-[44px]"
          >
            Filtrele
          </button>

          {(searchQuery || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                startTransition(() => router.push("/admin/coupons"));
              }}
              className="text-red-600 hover:bg-red-50 border border-red-200 font-extrabold px-3.5 py-2.5 rounded-xl transition text-xs sm:text-sm min-h-[44px]"
            >
              Filtreleri Sıfırla
            </button>
          )}
        </form>
      </div>

      {/* 🚀 3. MODERN DATA TABLE (DESKTOP) VE KART DÜZENİ (MOBİL 320px - 430px) */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        
        {/* ÜST TOPLU SEÇİM VE GÖSTERİM BARI */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.length === coupons.length && coupons.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            Tümünü Seç ({coupons.length} Kupon)
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
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* 💻 MASAÜSTÜ VERİ TABLOSU (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-gray-200">
              <tr>
                <th className="p-3.5 w-10 text-center">#</th>
                <th className="p-3.5">Kupon Kodu</th>
                <th className="p-3.5">İndirim Oranı</th>
                <th className="p-3.5">Min. Sepet</th>
                <th className="p-3.5">Kullanım</th>
                <th className="p-3.5">Son Kullanma</th>
                <th className="p-3.5">Durum</th>
                <th className="p-3.5 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {paginatedCoupons.map((coupon) => {
                const isSelected = selectedIds.includes(coupon.id);
                const isExpired = new Date(coupon.expireDate) < new Date();

                return (
                  <tr
                    key={coupon.id}
                    className={`transition ${isSelected ? "bg-blue-50/40" : "hover:bg-gray-50/70"}`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(coupon.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-gray-900 text-sm tracking-wider uppercase">
                          {coupon.code}
                        </span>
                        {coupon.isSingleUse && (
                          <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                            Tek Kullanım
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 font-black text-emerald-600">
                      %{coupon.discount}
                    </td>

                    <td className="p-3.5 font-bold text-gray-800">
                      {coupon.minAmount ? `${coupon.minAmount.toLocaleString("tr-TR")} ₺` : "Limit Yok"}
                    </td>

                    <td className="p-3.5 font-bold text-gray-700">
                      {coupon.usedCount} / {coupon.usageLimit}
                    </td>

                    <td className="p-3.5 text-gray-600">
                      {new Date(coupon.expireDate).toLocaleDateString("tr-TR")}
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleActive(coupon.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                          coupon.isActive && !isExpired
                            ? "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
                            : isExpired
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        <span>{coupon.isActive && !isExpired ? "🟢" : "🔴"}</span>
                        <span>{coupon.isActive && !isExpired ? "Aktif" : isExpired ? "Süresi Doldu" : "Pasif"}</span>
                      </button>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openDrawer(coupon)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center font-bold text-xs"
                          title="Hızlı Yan Panel Detayı Aç"
                        >
                          👁️
                        </button>

                        <button
                          onClick={() => handleDuplicateCoupon(coupon.id)}
                          className="p-1.5 text-gray-500 hover:text-purple-600 bg-gray-100 hover:bg-purple-50 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center font-bold text-xs"
                          title="Kuponu Çoğalt (Duplicate)"
                        >
                          📄
                        </button>

                        <DeleteCouponButton id={coupon.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedCoupons.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-4xl">🎟️</span>
                      <p className="text-base font-extrabold text-gray-700">Kupon Bulunamadı</p>
                      <p className="text-xs text-gray-500">Seçtiğiniz filtreye uygun kampanya veya kupon yok.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📱 MOBİL KART GÖRÜNÜMÜ (320px - 430px ZORUNLU KONTROL) */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginatedCoupons.map((coupon) => {
            const isSelected = selectedIds.includes(coupon.id);
            const isExpired = new Date(coupon.expireDate) < new Date();

            return (
              <div key={coupon.id} className={`p-4 space-y-3 ${isSelected ? "bg-blue-50/40" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(coupon.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-gray-900 text-sm tracking-wider uppercase">
                          {coupon.code}
                        </span>
                        {coupon.isSingleUse && (
                          <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-1.5 py-0.5 rounded">
                            Tek
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                        Son Tarih: {new Date(coupon.expireDate).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    coupon.isActive && !isExpired ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {coupon.isActive && !isExpired ? "🟢 Aktif" : "🔴 Pasif"}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">İNDİRİM</span>
                    <span className="font-black text-emerald-600">%{coupon.discount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">KULLANIM</span>
                    <span className="font-extrabold text-gray-800">{coupon.usedCount} / {coupon.usageLimit}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleActive(coupon.id)}
                    className="p-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold min-h-[36px]"
                  >
                    {coupon.isActive ? "Pasife Al" : "Aktifleştir"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openDrawer(coupon)}
                      className="p-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold min-h-[36px]"
                    >
                      👁 Detay
                    </button>
                    <button
                      onClick={() => handleDuplicateCoupon(coupon.id)}
                      className="p-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold min-h-[36px]"
                    >
                      📄 Çoğalt
                    </button>
                    <DeleteCouponButton id={coupon.id} />
                  </div>
                </div>
              </div>
            );
          })}
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

      {/* 🚀 5 STEPPER KAMPANYA SİHİRBAZI MODALI */}
      <CouponWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => router.refresh()}
      />

      {/* 🚀 KUPON HIZLI DETAY KAYAR PANELİ (DRAWER) */}
      <CouponDetailDrawer
        coupon={selectedDrawerCoupon}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Toplu Kupon Silme Onay Modalı */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={() => executeBulkAction("delete")}
        title="Toplu Kupon Silme"
        description={`Seçilen ${selectedIds.length} kuponu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Evet, Toplu Sil"
        cancelText="Vazgeç"
        variant="danger"
      />

    </div>
  );
}
