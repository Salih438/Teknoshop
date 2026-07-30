"use client";

import { useState } from "react";
import AdminReturnDetailModal, { AdminReturnDetailData } from "@/components/admin/returns/AdminReturnDetailModal";
import { ReturnStatus } from "@prisma/client";

const STATUS_BADGES: Record<ReturnStatus, { label: string; bg: string; text: string }> = {
  PENDING: { label: "Bekliyor", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  APPROVED: { label: "Onaylandı", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  SHIPPED: { label: "Kargoda", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
  RECEIVED: { label: "Depoda", bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
  COMPLETED: { label: "Tamamlandı", bg: "bg-green-50 border-green-200", text: "text-green-700" },
  REJECTED: { label: "Reddedildi", bg: "bg-red-50 border-red-200", text: "text-red-700" },
};

export default function AdminReturnsClientPage({
  returnRequests,
}: {
  returnRequests: AdminReturnDetailData[];
}) {
  const [selectedReturn, setSelectedReturn] = useState<AdminReturnDetailData | null>(null);

  return (
    <div className="w-full">
      {/* İADE TABLOSU */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider font-extrabold">
                <th className="p-3.5">İade Kodu</th>
                <th className="p-3.5">Sipariş No</th>
                <th className="p-3.5">Müşteri</th>
                <th className="p-3.5">Tarih</th>
                <th className="p-3.5">İade Tutarı</th>
                <th className="p-3.5">Durum</th>
                <th className="p-3.5 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {returnRequests.map((ret) => {
                const badge = STATUS_BADGES[ret.status] || STATUS_BADGES.PENDING;
                const formattedDate = new Date(ret.createdAt).toLocaleDateString("tr-TR");

                return (
                  <tr key={ret.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-3.5 font-mono text-xs sm:text-sm font-extrabold text-gray-900">
                      #{ret.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="p-3.5 font-mono text-xs sm:text-sm text-blue-600 font-bold">
                      #{ret.order?.id.substring(0, 8).toUpperCase() || "---"}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-gray-900 truncate max-w-[140px]">{ret.user?.name || "Anonim"}</p>
                      <p className="text-[11px] text-gray-500 truncate max-w-[140px]">{ret.user?.email}</p>
                    </td>
                    <td className="p-3.5 text-gray-600 font-medium">{formattedDate}</td>
                    <td className="p-3.5 font-black text-amber-600">
                      {ret.refundAmount.toLocaleString("tr-TR")} ₺
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md border ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedReturn(ret)}
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold px-3.5 py-2 rounded-xl text-xs transition shadow-xs inline-flex items-center justify-center min-h-[44px]"
                      >
                        Detay & Yönet ➔
                      </button>
                    </td>
                  </tr>
                );
              })}

              {returnRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 font-medium">
                    <p className="text-3xl mb-2">🔄</p>
                    <p className="font-bold text-gray-900">Kayıtlı iade talebi bulunamadı.</p>
                    <p className="text-xs text-gray-400 mt-0.5">Seçtiğiniz filtrelere uygun iade kaydı bulunmuyor.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* İADE DETAY VE YÖNETİM MODALI */}
      {selectedReturn && (
        <AdminReturnDetailModal
          returnRequest={selectedReturn}
          onClose={() => setSelectedReturn(null)}
        />
      )}
    </div>
  );
}
