"use client";

import { useState } from "react";
import AdminExchangeDetailModal, { AdminExchangeDetailData } from "@/components/admin/exchanges/AdminExchangeDetailModal";
import { ExchangeStatus } from "@prisma/client";

const STATUS_BADGES: Record<ExchangeStatus, { label: string; bg: string; text: string }> = {
  PENDING: { label: "Bekliyor", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  APPROVED: { label: "Onaylandı", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  WAITING_FOR_CUSTOMER: { label: "Kargo Bekleniyor", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
  WAITING_STOCK: { label: "Stok Bekleniyor", bg: "bg-orange-50 border-orange-200", text: "text-orange-700" },
  SHIPPED: { label: "Kargoda", bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
  RECEIVED: { label: "Depoda", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
  PROCESSING: { label: "Hazırlanıyor", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  COMPLETED: { label: "Tamamlandı", bg: "bg-green-50 border-green-200", text: "text-green-700" },
  REJECTED: { label: "Reddedildi", bg: "bg-red-50 border-red-200", text: "text-red-700" },
};

export default function AdminExchangesClientPage({
  exchangeRequests,
}: {
  exchangeRequests: AdminExchangeDetailData[];
}) {
  const [selectedExchange, setSelectedExchange] = useState<AdminExchangeDetailData | null>(null);

  return (
    <div className="w-full">
      {/* DEĞİŞİM TABLOSU */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider font-extrabold">
                <th className="p-3.5">Değişim ID</th>
                <th className="p-3.5">Sipariş No</th>
                <th className="p-3.5">Müşteri</th>
                <th className="p-3.5">Tarih</th>
                <th className="p-3.5">Değişim Özeti</th>
                <th className="p-3.5">Durum</th>
                <th className="p-3.5 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {exchangeRequests.map((exc) => {
                const badge = STATUS_BADGES[exc.status] || STATUS_BADGES.PENDING;
                const formattedDate = new Date(exc.createdAt).toLocaleDateString("tr-TR");

                const firstItem = exc.items[0];
                const oldVariant = firstItem?.orderItem?.variant?.combination || [firstItem?.orderItem?.variant?.color, firstItem?.orderItem?.variant?.storage].filter(Boolean).join(" • ");
                const newVariant = firstItem?.requestedVariant?.combination || [firstItem?.requestedVariant?.color, firstItem?.requestedVariant?.storage].filter(Boolean).join(" • ");

                return (
                  <tr key={exc.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-3.5 font-mono text-xs sm:text-sm font-extrabold text-gray-900">
                      #{exc.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="p-3.5 font-mono text-xs sm:text-sm text-blue-600 font-bold">
                      #{exc.order?.id.substring(0, 8).toUpperCase() || "---"}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-gray-900 truncate max-w-[140px]">{exc.user?.name || "Anonim"}</p>
                      <p className="text-[11px] text-gray-500 truncate max-w-[140px]">{exc.user?.email}</p>
                    </td>
                    <td className="p-3.5 text-gray-600 font-medium">{formattedDate}</td>
                    <td className="p-3.5 text-xs font-medium text-gray-700">
                      <span className="text-red-600 font-bold">{oldVariant || "Eski Ürün"}</span>
                      <span className="mx-1 text-gray-400">➔</span>
                      <span className="text-indigo-600 font-bold">{newVariant || "Yeni Beden"}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md border ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedExchange(exc)}
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-extrabold px-3.5 py-2 rounded-xl text-xs transition shadow-xs inline-flex items-center justify-center min-h-[44px]"
                      >
                        Detay & Yönet ➔
                      </button>
                    </td>
                  </tr>
                );
              })}

              {exchangeRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 font-medium">
                    <p className="text-3xl mb-2">🔁</p>
                    <p className="font-bold text-gray-900">Kayıtlı ürün değişim talebi bulunamadı.</p>
                    <p className="text-xs text-gray-400 mt-0.5">Seçtiğiniz filtrelere uygun değişim kaydı bulunmuyor.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEĞİŞİM DETAY VE YÖNETİM MODALI */}
      {selectedExchange && (
        <AdminExchangeDetailModal
          exchangeRequest={selectedExchange}
          onClose={() => setSelectedExchange(null)}
        />
      )}
    </div>
  );
}
