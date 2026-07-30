"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuditDetailDrawer, { AuditDetailDrawerData } from "./AuditDetailDrawer";

export interface AuditLogDTO {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

interface AdminAuditClientProps {
  logs: AuditLogDTO[];
  totalLogs: number;
  todayLogsCount: number;
  criticalLogsCount: number;
  productLogsCount: number;
  orderLogsCount: number;
  userLogsCount: number;
}

const RISK_BADGES = {
  LOW: { label: "Low", bg: "bg-green-100 text-green-800 border-green-200" },
  MEDIUM: { label: "Medium", bg: "bg-amber-100 text-amber-800 border-amber-200" },
  HIGH: { label: "High", bg: "bg-orange-100 text-orange-800 border-orange-200" },
  CRITICAL: { label: "Critical", bg: "bg-red-100 text-red-800 border-red-200 font-black animate-pulse" },
};

export default function AdminAuditClient({
  logs,
  totalLogs,
  todayLogsCount,
  criticalLogsCount,
  productLogsCount,
  orderLogsCount,
  userLogsCount,
}: AdminAuditClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedDrawerLog, setSelectedDrawerLog] = useState<AuditDetailDrawerData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const searchQuery = searchParams.get("q") || "";
  const riskFilter = searchParams.get("risk") || "";
  const entityFilter = searchParams.get("entity") || "";
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
      router.push(`/admin/audit?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput, page: 1 });
  };

  const exportCSV = () => {
    const headers = ["ID", "Tarih", "Admin", "Islem", "Modul", "Risk", "IP"];
    const rows = logs.map((l) => [
      `"${l.id}"`,
      `"${new Date(l.createdAt).toLocaleDateString("tr-TR")}"`,
      `"${l.adminName.replace(/"/g, '""')}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.entityType.replace(/"/g, '""')}"`,
      `"${l.riskLevel}"`,
      `"${l.ipAddress || ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-log-raporu-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openDrawer = (log: AuditLogDTO) => {
    setSelectedDrawerLog(log);
    setIsDrawerOpen(true);
  };

  const totalPages = Math.ceil(logs.length / pageSize) || 1;
  const paginatedLogs = logs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 w-full overflow-x-clip animate-in fade-in duration-300">
      
      {/* 🚀 BAŞLIK VE AKSİYONLAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>🛡️</span> Denetim İzleri ve Aktivite Merkezi (Audit Logs)
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">
            Stripe Dashboard & GitHub Enterprise standartlarında admin işlem geçmişi ve güvenlik denetimleri.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={exportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-xs flex items-center gap-1.5 min-h-[44px] cursor-pointer"
          >
            <span>📥</span> Rapor İndir (CSV)
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-xs flex items-center gap-1.5 min-h-[44px] cursor-pointer"
          >
            <span>🖨️</span> Yazdır (PDF)
          </button>
        </div>
      </div>

      {/* 🚀 1. ÖZET İSTATİSTİK 6 METRİK KARTI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-gray-900">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Toplam Log</span>
          <p className="text-xl sm:text-2xl font-black text-gray-900">{totalLogs}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-blue-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Bugünkü İşlemler</span>
          <p className="text-xl sm:text-2xl font-black text-blue-600">{todayLogsCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-red-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Kritik İşlemler</span>
          <p className="text-xl sm:text-2xl font-black text-red-600">{criticalLogsCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-purple-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Ürün İşlemleri</span>
          <p className="text-xl sm:text-2xl font-black text-purple-600">{productLogsCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-emerald-600">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Sipariş İşlemleri</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600">{orderLogsCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 border-l-4 border-l-amber-500">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Kullanıcı İşlemleri</span>
          <p className="text-xl sm:text-2xl font-black text-amber-600">{userLogsCount}</p>
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
              placeholder="Admin Adı, İşlem Tipi veya IP arayın..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm min-h-[44px]"
            />
          </div>

          {/* Risk Filtresi */}
          <select
            value={riskFilter}
            onChange={(e) => updateFilters({ risk: e.target.value, page: 1 })}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px] font-medium"
          >
            <option value="">Tüm Risk Seviyeleri</option>
            <option value="CRITICAL">🔴 Critical Risk</option>
            <option value="HIGH">🟠 High Risk</option>
            <option value="MEDIUM">🟡 Medium Risk</option>
            <option value="LOW">🟢 Low Risk</option>
          </select>

          {/* Modül (Entity) Filtresi */}
          <select
            value={entityFilter}
            onChange={(e) => updateFilters({ entity: e.target.value, page: 1 })}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs sm:text-sm min-h-[44px] font-medium"
          >
            <option value="">Tüm Modüller</option>
            <option value="Product">📦 Ürün (Product)</option>
            <option value="Order">📋 Sipariş (Order)</option>
            <option value="User">👥 Müşteri/User</option>
            <option value="Coupon">🎟️ Kupon/Coupon</option>
          </select>

          <button
            type="submit"
            className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs sm:text-sm min-h-[44px]"
          >
            Filtrele
          </button>

          {(searchQuery || riskFilter || entityFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                startTransition(() => router.push("/admin/audit"));
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
        
        {/* ÜST GÖSTERİM BARI */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700">Görüntülenen Loglar ({logs.length} Kayıt)</span>

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
                <th className="p-3.5">Tarih</th>
                <th className="p-3.5">Yönetici (Admin)</th>
                <th className="p-3.5">İşlem Kodu</th>
                <th className="p-3.5">Modül</th>
                <th className="p-3.5">IP Adresi</th>
                <th className="p-3.5">Risk Seviyesi</th>
                <th className="p-3.5 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {paginatedLogs.map((log) => {
                const risk = RISK_BADGES[log.riskLevel] || RISK_BADGES.LOW;

                return (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-3.5 font-mono text-gray-600 text-xs">
                      {new Date(log.createdAt).toLocaleString("tr-TR")}
                    </td>

                    <td className="p-3.5">
                      <p className="font-extrabold text-gray-900">{log.adminName}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{log.adminEmail}</p>
                    </td>

                    <td className="p-3.5 font-mono font-bold text-blue-600">
                      {log.action}
                    </td>

                    <td className="p-3.5 font-bold text-gray-700">
                      {log.entityType}
                    </td>

                    <td className="p-3.5 font-mono text-gray-500 text-xs">
                      {log.ipAddress || "127.0.0.1"}
                    </td>

                    <td className="p-3.5">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${risk.bg}`}>
                        {risk.label}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => openDrawer(log)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-xl transition min-h-[36px] font-bold text-xs flex items-center justify-center gap-1 mx-auto"
                        title="Hızlı Yan Panel Detayı & JSON Diff Aç"
                      >
                        <span>👁️ Diff İncele</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-4xl">🛡️</span>
                      <p className="text-base font-extrabold text-gray-700">Denetim Kaydı Bulunamadı</p>
                      <p className="text-xs text-gray-500">Seçtiğiniz filtreye uygun denetim logu kaydedilmemiş.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📱 MOBİL KART GÖRÜNÜMÜ (320px - 430px ZORUNLU KONTROL) */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginatedLogs.map((log) => {
            const risk = RISK_BADGES[log.riskLevel] || RISK_BADGES.LOW;

            return (
              <div key={log.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono font-black text-blue-600 text-xs tracking-wider uppercase block">
                      {log.action}
                    </span>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      {new Date(log.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>

                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${risk.bg}`}>
                    {risk.label}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">ADMIN</span>
                    <span className="font-extrabold text-gray-800">{log.adminName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">MODÜL</span>
                    <span className="font-bold text-gray-700">{log.entityType}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="font-mono text-[10px] text-gray-400">IP: {log.ipAddress || "127.0.0.1"}</span>
                  <button
                    onClick={() => openDrawer(log)}
                    className="p-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold min-h-[36px]"
                  >
                    👁 Diff & Detay İncele
                  </button>
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

      {/* 🚀 DETAY KAYAR PANELİ VE CHANGE DIFF VIEWER (DRAWER) */}
      <AuditDetailDrawer
        log={selectedDrawerLog}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

    </div>
  );
}
