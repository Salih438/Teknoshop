"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import CustomerDetailDrawer, { CustomerDetailDrawerData } from "./CustomerDetailDrawer";
import ConfirmModal from "@/components/ui/ConfirmModal";

export interface CustomerDTO {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  ordersCount: number;
  returnsCount: number;
  exchangesCount: number;
  totalSpent: number;
  segment: { label: string; bg: string; text: string; icon: string };
  addresses: { id: string; title: string; city: string; district: string; address: string }[];
  recentOrders: { id: string; totalPrice: number; status: string; createdAt: string }[];
}

interface AdminUsersClientProps {
  users: CustomerDTO[];
  totalUsers: number;
  newUsers30d: number;
  avgSpent: number;
  vipUsersCount: number;
  passiveUsersCount: number;
  orderersCount: number;
}

export default function AdminUsersClient({
  users,
  totalUsers,
  newUsers30d,
  avgSpent,
  vipUsersCount,
  passiveUsersCount,
  orderersCount,
}: AdminUsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDrawerCustomer, setSelectedDrawerCustomer] = useState<CustomerDetailDrawerData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // URL Parametreleri
  const searchQuery = searchParams.get("q") || "";
  const roleFilter = searchParams.get("role") || "";
  const statusFilter = searchParams.get("status") || "";
  const segmentFilter = searchParams.get("segment") || "";
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
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput, page: 1 });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(users.map((u) => u.id));
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
    const toastId = toast.loading(`${selectedIds.length} kullanıcı işleniyor...`);
    try {
      const res = await fetch("/api/admin/users/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedIds, action }),
      });

      if (res.ok) {
        toast.success("Toplu işlem başarıyla uygulandı!", { id: toastId });
        setSelectedIds([]);
        router.refresh();
      } else {
        toast.error("Toplu işlem başarısız.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası.", { id: toastId });
    }
  };

  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    const toastId = toast.loading("Kullanıcı durumu güncelleniyor...");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (res.ok) {
        toast.success("Kullanıcı durumu başarıyla güncellendi!", { id: toastId });
        router.refresh();
      } else {
        toast.error("Güncelleme başarısız.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası.", { id: toastId });
    }
  };

  const openDrawer = (customer: CustomerDTO) => {
    setSelectedDrawerCustomer(customer);
    setIsDrawerOpen(true);
  };

  const totalPages = Math.ceil(users.length / pageSize) || 1;
  const paginatedUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      
      {/* 🚀 BAŞLIK VE AKSİYONLAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>👥</span> Müşteri Yönetim Merkezi (CRM)
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">
            Müşteri veritabanı, sipariş geçmişi, harcama segmentleri ve profil yönetimi.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 p-2 rounded-2xl shadow-xs animate-in zoom-in duration-200">
            <span className="text-xs font-black text-blue-900 px-2">{selectedIds.length} Seçildi:</span>
            <button
              onClick={() => handleBulkAction("activate")}
              className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-xs"
            >
              🟢 Aktifleştir
            </button>
            <button
              onClick={() => handleBulkAction("deactivate")}
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-xs"
            >
              🔴 Pasifleştir
            </button>
            <button
              onClick={() => handleBulkAction("delete")}
              className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-xs"
            >
              🗑 Sil
            </button>
          </div>
        )}
      </div>

      {/* 🚀 1. ÖZET İSTATİSTİK 6 METRİK KARTI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-blue-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Toplam Müşteri</span>
          <p className="text-xl sm:text-2xl font-black text-gray-900">{totalUsers}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-emerald-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Yeni Üye (30 Gün)</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600">{newUsers30d}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-indigo-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Ort. Harcama</span>
          <p className="text-xl sm:text-2xl font-black text-indigo-600">{avgSpent.toLocaleString("tr-TR")} ₺</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-amber-500">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">VIP Müşteriler</span>
          <p className="text-xl sm:text-2xl font-black text-amber-600">{vipUsersCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-purple-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Sipariş Veren</span>
          <p className="text-xl sm:text-2xl font-black text-purple-600">{orderersCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-red-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Pasif Hesaplar</span>
          <p className="text-xl sm:text-2xl font-black text-red-600">{passiveUsersCount}</p>
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
              placeholder="Ad Soyad, Email veya Telefon arayın..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm min-h-[44px]"
            />
          </div>

          {/* Rol Filtresi */}
          <select
            value={roleFilter}
            onChange={(e) => updateFilters({ role: e.target.value, page: 1 })}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px] font-medium"
          >
            <option value="">Tüm Roller</option>
            <option value="USER">👤 Müşteri (USER)</option>
            <option value="ADMIN">🛡️ Yönetici (ADMIN)</option>
          </select>

          {/* Durum Filtresi */}
          <select
            value={statusFilter}
            onChange={(e) => updateFilters({ status: e.target.value, page: 1 })}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px] font-medium"
          >
            <option value="">Tüm Durumlar</option>
            <option value="active">🟢 Aktif Hesaplar</option>
            <option value="passive">🔴 Pasif / Engelli</option>
          </select>

          {/* Segment Filtresi */}
          <select
            value={segmentFilter}
            onChange={(e) => updateFilters({ segment: e.target.value, page: 1 })}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px] font-medium"
          >
            <option value="">Tüm Segmentler</option>
            <option value="vip">🏆 VIP Müşteriler</option>
            <option value="loyal">💎 Sadık Müşteriler</option>
            <option value="new">🆕 Yeni Üyeler</option>
            <option value="zero">🎯 İlk Sipariş Bekleyen</option>
          </select>

          <button
            type="submit"
            className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs sm:text-sm min-h-[44px]"
          >
            Filtrele
          </button>

          {(searchQuery || roleFilter || statusFilter || segmentFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                startTransition(() => router.push("/admin/users"));
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
        
        {/* ÜST TOPLU SEÇİM VE GÖSTERİM BARI */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.length === users.length && users.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            Tümünü Seç ({users.length} Müşteri)
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
                <th className="p-3.5 w-14">Avatar</th>
                <th className="p-3.5">Müşteri Bilgisi</th>
                <th className="p-3.5">Segment</th>
                <th className="p-3.5">Sipariş</th>
                <th className="p-3.5">Harcama</th>
                <th className="p-3.5">Kayıt Tarihi</th>
                <th className="p-3.5">Durum</th>
                <th className="p-3.5 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {paginatedUsers.map((user) => {
                const isSelected = selectedIds.includes(user.id);
                const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";

                return (
                  <tr
                    key={user.id}
                    className={`transition ${isSelected ? "bg-blue-50/40" : "hover:bg-gray-50/70"}`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(user.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>

                    <td className="p-3.5">
                      <div className="w-10 h-10 bg-blue-600 text-white font-black text-base rounded-2xl flex items-center justify-center shadow-xs">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          initial
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <p className="font-extrabold text-gray-900 truncate max-w-xs">{user.name}</p>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">{user.email}</p>
                    </td>

                    <td className="p-3.5">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${user.segment.bg} ${user.segment.text}`}>
                        {user.segment.icon} {user.segment.label}
                      </span>
                    </td>

                    <td className="p-3.5 font-bold text-gray-700">
                      {user.ordersCount} Sipariş
                    </td>

                    <td className="p-3.5 font-black text-blue-600">
                      {user.totalSpent.toLocaleString("tr-TR")} ₺
                    </td>

                    <td className="p-3.5 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleUserActive(user.id, user.isActive)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                          user.isActive
                            ? "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
                            : "bg-red-100 text-red-800 border border-red-200 hover:bg-red-200"
                        }`}
                      >
                        <span>{user.isActive ? "🟢" : "🔴"}</span>
                        <span>{user.isActive ? "Aktif" : "Pasif"}</span>
                      </button>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openDrawer(user)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center font-bold text-xs"
                          title="Hızlı Yan Panel Detayı Aç"
                        >
                          👁️
                        </button>

                        <a
                          href={`mailto:${user.email}`}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 bg-gray-100 hover:bg-emerald-50 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center font-bold text-xs"
                          title="E-Posta Gönder"
                        >
                          📧
                        </a>

                        <Link
                          href={`/admin/users/${user.id}`}
                          className="p-1.5 text-gray-500 hover:text-purple-600 bg-gray-100 hover:bg-purple-50 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center font-bold text-xs"
                          title="Detaylı CRM Profili"
                        >
                          👤
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-gray-400 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-4xl">🔍</span>
                      <p className="text-base font-extrabold text-gray-700">Müşteri Bulunamadı</p>
                      <p className="text-xs text-gray-500">Seçtiğiniz filtreye uygun müşteri bulunmuyor.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📱 MOBİL KART GÖRÜNÜMÜ (md:hidden) */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginatedUsers.map((user) => {
            const isSelected = selectedIds.includes(user.id);

            return (
              <div key={user.id} className={`p-4 space-y-3 ${isSelected ? "bg-blue-50/40" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(user.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="w-10 h-10 bg-blue-600 text-white font-black rounded-xl flex items-center justify-center">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-900 text-xs sm:text-sm">{user.name}</p>
                      <p className="text-[11px] text-gray-500 font-mono">{user.email}</p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${user.segment.bg} ${user.segment.text}`}>
                    {user.segment.icon} {user.segment.label}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">TOPLAM HARCAMA</span>
                    <span className="font-black text-blue-600">{user.totalSpent.toLocaleString("tr-TR")} ₺</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">SİPARİŞ SAYISI</span>
                    <span className="font-extrabold text-gray-800">{user.ordersCount} Sipariş</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleUserActive(user.id, user.isActive)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.isActive ? "🟢 Aktif" : "🔴 Pasif"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openDrawer(user)}
                      className="p-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold"
                    >
                      👁 Hızlı Detay
                    </button>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="p-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold"
                    >
                      CRM Profil ➔
                    </Link>
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

      {/* 🚀 MÜŞTERİ HIZLI KAYAR PANELDEN İNCELEME (DRAWER) */}
      <CustomerDetailDrawer
        customer={selectedDrawerCustomer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Toplu Kullanıcı Silme Onay Modalı */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={() => executeBulkAction("delete")}
        title="Toplu Kullanıcı Silme"
        description={`Seçilen ${selectedIds.length} kullanıcı hesabını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Evet, Toplu Sil"
        cancelText="Vazgeç"
        variant="danger"
      />

    </div>
  );
}
