"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { ReturnStatus, ReturnReason } from "@prisma/client";

interface ReturnItemData {
  id: string;
  quantity: number;
  reason: ReturnReason;
  refundAmount: number;
  orderItem?: {
    product?: {
      name: string;
      images?: { imageUrl: string }[];
    } | null;
    variant?: {
      combination?: string | null;
      color?: string | null;
      storage?: string | null;
    } | null;
  } | null;
}

interface ReturnImageData {
  id: string;
  imageUrl: string;
}

interface ReturnRequestData {
  id: string;
  status: ReturnStatus;
  refundAmount: number;
  refundMethod?: string | null;
  returnTrackingNumber?: string | null;
  customerNote?: string | null;
  adminNote?: string | null;
  createdAt: Date | string;
  approvedAt?: Date | string | null;
  receivedAt?: Date | string | null;
  completedAt?: Date | string | null;
  items: ReturnItemData[];
  images?: ReturnImageData[];
}

const STATUS_CONFIG: Record<
  ReturnStatus,
  { label: string; bg: string; text: string; border: string; stepIndex: number }
> = {
  PENDING: { label: "İade Talebi Alındı", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", stepIndex: 1 },
  APPROVED: { label: "Talebiniz Onaylandı", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", stepIndex: 2 },
  SHIPPED: { label: "Kargoya Verildi", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", stepIndex: 3 },
  RECEIVED: { label: "Depoya Ulaştı / Kontrol Ediliyor", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", stepIndex: 3 },
  COMPLETED: { label: "İade Tamamlandı", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", stepIndex: 4 },
  REJECTED: { label: "İade Reddedildi", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", stepIndex: -1 },
};

const REASON_LABELS: Record<ReturnReason, string> = {
  DEFECTIVE: "Ayıplı / Hasarlı Ürün",
  WRONG_ITEM: "Yanlış Ürün Gönderildi",
  SIZE_FIT: "Beden / Ölçü Uymadı",
  NOT_AS_DESCRIBED: "Açıklamadaki Gibi Değil",
  CHANGE_OF_MIND: "Vazgeçtim / İhtiyaç Kalmadı",
  OTHER: "Diğer",
};

export default function ReturnStatusCard({ returnRequest }: { returnRequest: ReturnRequestData }) {
  const [copied, setCopied] = useState(false);
  const config = STATUS_CONFIG[returnRequest.status] || STATUS_CONFIG.PENDING;

  const handleCopyCode = () => {
    if (!returnRequest.returnTrackingNumber) return;
    navigator.clipboard.writeText(returnRequest.returnTrackingNumber);
    setCopied(true);
    toast.success("İade kargo kodu kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(returnRequest.createdAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-100 shadow-xs space-y-5 sm:space-y-6 animate-in fade-in duration-300 w-full overflow-x-clip">
      
      {/* ÜST BAŞLIK KISMI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 sm:pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl">🔄</span>
            <h4 className="text-base sm:text-lg font-extrabold text-gray-900">İade Talebi #{returnRequest.id.slice(-8).toUpperCase()}</h4>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-0.5">Talep Tarihi: {formattedDate}</p>
        </div>

        <div className={`px-3 py-1.5 rounded-xl border ${config.bg} ${config.text} ${config.border} font-extrabold text-[11px] sm:text-xs uppercase tracking-wider self-start sm:self-auto shadow-xs`}>
          {config.label}
        </div>
      </div>

      {/* TIMELINE (ZAMAN ÇİZGİSİ ADIMLARI - MOBİLDE TAŞMAYAN DUYARLI IZGARA) */}
      {returnRequest.status !== "REJECTED" && (
        <div className="py-2 overflow-x-auto custom-scrollbar">
          <div className="grid grid-cols-4 gap-2 text-center relative min-w-[280px]">
            
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${config.stepIndex >= 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                1
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 mt-1.5">Talep Alındı</span>
            </div>

            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${config.stepIndex >= 2 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                2
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 mt-1.5">Onaylandı</span>
            </div>

            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${config.stepIndex >= 3 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                3
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 mt-1.5">Depo Kontrol</span>
            </div>

            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${config.stepIndex >= 4 ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                4
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 mt-1.5">Ücret İadesi</span>
            </div>

            <div className="absolute top-3.5 sm:top-4 left-[12%] right-[12%] h-0.5 bg-gray-200 -z-0">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${((config.stepIndex - 1) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* İADE KARGO KODU KUTUSU (Min 44px Touch Target) */}
      {returnRequest.returnTrackingNumber && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Anlaşmalı İade Kargo Kodu</span>
            <p className="text-lg sm:text-xl font-mono font-black text-gray-900 mt-0.5">{returnRequest.returnTrackingNumber}</p>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Kargo şubesine bu kod ile **ücretsiz** teslim edebilirsiniz.</p>
          </div>
          <button
            onClick={handleCopyCode}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 w-full sm:w-auto min-h-[44px]"
          >
            <span>{copied ? "✓ Kopyalandı" : "📋 Kodu Kopyala"}</span>
          </button>
        </div>
      )}

      {/* MAĞAZA NOTU */}
      {returnRequest.adminNote && (
        <div className={`p-3.5 sm:p-4 rounded-2xl border ${returnRequest.status === 'REJECTED' ? 'bg-red-50/70 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
            {returnRequest.status === 'REJECTED' ? '❌ İade Reddedilme Gerekçesi' : '💬 Mağaza Notu'}
          </p>
          <p className="text-xs sm:text-sm font-medium leading-relaxed">{returnRequest.adminNote}</p>
        </div>
      )}

      {/* İADE EDİLEN KALEMLER */}
      <div>
        <h5 className="text-[10px] sm:text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2.5">İade Edilen Ürünler</h5>
        <div className="space-y-2.5">
          {returnRequest.items.map((item) => {
            const displayImage = item.orderItem?.product?.images?.[0]?.imageUrl;
            const productName = item.orderItem?.product?.name || "Silinmiş Ürün";
            const variantText = item.orderItem?.variant?.combination || [item.orderItem?.variant?.color, item.orderItem?.variant?.storage].filter(Boolean).join(" • ");

            return (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-xs sm:text-sm gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                    {displayImage ? (
                      <Image src={displayImage} alt={productName} className="max-w-full max-h-full object-contain" width={500} height={500} />
                    ) : (
                      <span className="text-base">📦</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{productName}</p>
                    {variantText && <p className="text-[11px] text-gray-500 font-medium truncate">{variantText}</p>}
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                      Neden: {REASON_LABELS[item.reason] || item.reason}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-extrabold text-gray-900">{item.quantity} Adet</p>
                  <p className="text-xs font-extrabold text-amber-600 mt-0.5">{item.refundAmount.toLocaleString("tr-TR")} ₺</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOPLAM İADE TUTARI */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-xs sm:text-sm">
        <span className="font-bold text-gray-700">Toplam İade Tutarı</span>
        <span className="text-xl sm:text-2xl font-black text-amber-600">{returnRequest.refundAmount.toLocaleString("tr-TR")} ₺</span>
      </div>

    </div>
  );
}
