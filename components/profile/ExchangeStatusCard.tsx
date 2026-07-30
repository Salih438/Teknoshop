"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { ExchangeStatus, ExchangeReason } from "@prisma/client";

interface ExchangeItemData {
  id: string;
  quantity: number;
  reason: ExchangeReason;
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
  requestedProduct?: {
    name: string;
    images?: { imageUrl: string }[];
  } | null;
  requestedVariant?: {
    combination?: string | null;
    color?: string | null;
    storage?: string | null;
  } | null;
}

interface ExchangeRequestData {
  id: string;
  status: ExchangeStatus;
  returnTrackingNumber?: string | null;
  newShipmentTrackingNumber?: string | null;
  customerNote?: string | null;
  adminNote?: string | null;
  createdAt: Date | string;
  approvedAt?: Date | string | null;
  receivedAt?: Date | string | null;
  completedAt?: Date | string | null;
  items: ExchangeItemData[];
}

const STATUS_CONFIG: Record<
  ExchangeStatus,
  { label: string; bg: string; text: string; border: string; stepIndex: number }
> = {
  PENDING: { label: "Değişim Talebi Alındı", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", stepIndex: 1 },
  APPROVED: { label: "Talebiniz Onaylandı", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", stepIndex: 2 },
  WAITING_FOR_CUSTOMER: { label: "Kargo Bekleniyor", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", stepIndex: 2 },
  WAITING_STOCK: { label: "Stok Bekleniyor", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", stepIndex: 2 },
  SHIPPED: { label: "Ürün Kargoda", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", stepIndex: 3 },
  RECEIVED: { label: "Depoya Ulaştı & İnceleniyor", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", stepIndex: 3 },
  PROCESSING: { label: "Yeni Ürün Hazırlanıyor", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", stepIndex: 4 },
  COMPLETED: { label: "Değişim Tamamlandı", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", stepIndex: 5 },
  REJECTED: { label: "Değişim Reddedildi", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", stepIndex: -1 },
};

const REASON_LABELS: Record<ExchangeReason, string> = {
  SIZE_CHANGE: "Beden / Ölçü Değişimi",
  COLOR_CHANGE: "Renk Değişimi",
  DEFECTIVE_REPLACEMENT: "Ayıplı / Hasarlı Ürün Değişimi",
  WRONG_ITEM_SENT: "Yanlış Ürün Gönderildi",
  OTHER: "Diğer Nedenler",
};

export default function ExchangeStatusCard({ exchangeRequest }: { exchangeRequest: ExchangeRequestData }) {
  const [copiedReturnCode, setCopiedReturnCode] = useState(false);
  const [copiedNewCode, setCopiedNewCode] = useState(false);

  const config = STATUS_CONFIG[exchangeRequest.status] || STATUS_CONFIG.PENDING;

  const handleCopyReturnCode = () => {
    if (!exchangeRequest.returnTrackingNumber) return;
    navigator.clipboard.writeText(exchangeRequest.returnTrackingNumber);
    setCopiedReturnCode(true);
    toast.success("İade kargo kodu kopyalandı!");
    setTimeout(() => setCopiedReturnCode(false), 2000);
  };

  const handleCopyNewCode = () => {
    if (!exchangeRequest.newShipmentTrackingNumber) return;
    navigator.clipboard.writeText(exchangeRequest.newShipmentTrackingNumber);
    setCopiedNewCode(true);
    toast.success("Yeni ürün kargo takip kodu kopyalandı!");
    setTimeout(() => setCopiedNewCode(false), 2000);
  };

  const formattedDate = new Date(exchangeRequest.createdAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-100 shadow-xs space-y-5 sm:space-y-6 animate-in fade-in duration-300 w-full overflow-x-clip">
      
      {/* ÜST BAŞLIK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 sm:pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl">🔁</span>
            <h4 className="text-base sm:text-lg font-extrabold text-gray-900">Değişim Talebi #{exchangeRequest.id.slice(-8).toUpperCase()}</h4>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-0.5">Talep Tarihi: {formattedDate}</p>
        </div>

        <div className={`px-3 py-1.5 rounded-xl border ${config.bg} ${config.text} ${config.border} font-extrabold text-[11px] sm:text-xs uppercase tracking-wider self-start sm:self-auto shadow-xs`}>
          {config.label}
        </div>
      </div>

      {/* STOK BEKLENİYOR BİLGİLENDİRMESİ */}
      {exchangeRequest.status === "WAITING_STOCK" && (
        <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 text-orange-900 text-xs sm:text-sm">
          <span className="text-xl sm:text-2xl flex-shrink-0">⏳</span>
          <div>
            <h5 className="font-extrabold text-orange-900 mb-0.5">Stok Bekleniyor</h5>
            <p className="font-medium text-orange-800 leading-relaxed">
              İstediğiniz beden/ürün şu anda depomuzda stokta bulunmamaktadır. **Talebiniz reddedilmemiştir.** Yeni stok giriş yaptığında talebiniz otomatik olarak hazırlanıp kargolanacaktır.
            </p>
          </div>
        </div>
      )}

      {/* TIMELINE (MOBİLDE KAYDIRILABİLİR DUYARLI IZGARA) */}
      {exchangeRequest.status !== "REJECTED" && (
        <div className="py-2 overflow-x-auto custom-scrollbar">
          <div className="grid grid-cols-5 gap-2 text-center relative min-w-[320px]">
            
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${config.stepIndex >= 1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                1
              </div>
              <span className="text-[10px] font-bold text-gray-700 mt-1.5">Talep Alındı</span>
            </div>

            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${config.stepIndex >= 2 ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                2
              </div>
              <span className="text-[10px] font-bold text-gray-700 mt-1.5">Kargo Kodu</span>
            </div>

            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${config.stepIndex >= 3 ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                3
              </div>
              <span className="text-[10px] font-bold text-gray-700 mt-1.5">Depo Kontrol</span>
            </div>

            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${config.stepIndex >= 4 ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                4
              </div>
              <span className="text-[10px] font-bold text-gray-700 mt-1.5">Yeni Ürün</span>
            </div>

            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${config.stepIndex >= 5 ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                5
              </div>
              <span className="text-[10px] font-bold text-gray-700 mt-1.5">Tamamlandı</span>
            </div>

            <div className="absolute top-3.5 sm:top-4 left-[10%] right-[10%] h-0.5 bg-gray-200 -z-0">
              <div
                className="h-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${Math.max(0, ((config.stepIndex - 1) / 4) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* KARGO KODLARI (Min 44px Touch Target) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {exchangeRequest.returnTrackingNumber && (
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3.5 sm:p-4 flex justify-between items-center gap-2">
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-indigo-600">Ücretsiz İade Gönderim Kodu</span>
              <p className="text-base sm:text-lg font-mono font-black text-gray-900 mt-0.5">{exchangeRequest.returnTrackingNumber}</p>
            </div>
            <button
              onClick={handleCopyReturnCode}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-3 py-2 rounded-xl transition shadow-xs flex-shrink-0 min-h-[44px]"
            >
              {copiedReturnCode ? "✓ Kopyalandı" : "📋 Kopyala"}
            </button>
          </div>
        )}

        {exchangeRequest.newShipmentTrackingNumber && (
          <div className="bg-green-50/60 border border-green-100 rounded-2xl p-3.5 sm:p-4 flex justify-between items-center gap-2">
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-green-600">Yeni Ürün Kargo Takip Kodu</span>
              <p className="text-base sm:text-lg font-mono font-black text-gray-900 mt-0.5">{exchangeRequest.newShipmentTrackingNumber}</p>
            </div>
            <button
              onClick={handleCopyNewCode}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold px-3 py-2 rounded-xl transition shadow-xs flex-shrink-0 min-h-[44px]"
            >
              {copiedNewCode ? "✓ Kopyalandı" : "📋 Kopyala"}
            </button>
          </div>
        )}
      </div>

      {/* MAĞAZA NOTU */}
      {exchangeRequest.adminNote && (
        <div className={`p-3.5 sm:p-4 rounded-2xl border ${exchangeRequest.status === 'REJECTED' ? 'bg-red-50/70 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
            {exchangeRequest.status === 'REJECTED' ? '❌ Değişim Reddedilme Gerekçesi' : '💬 Mağaza Notu'}
          </p>
          <p className="text-xs sm:text-sm font-medium leading-relaxed">{exchangeRequest.adminNote}</p>
        </div>
      )}

      {/* DEĞİŞTİRİLEN KALEMLER ÖZETİ */}
      <div>
        <h5 className="text-[10px] sm:text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2.5">Değişim Detayları</h5>
        <div className="space-y-3">
          {exchangeRequest.items.map((item) => {
            const oldImage = item.orderItem?.product?.images?.[0]?.imageUrl;
            const oldName = item.orderItem?.product?.name || "Silinmiş Ürün";
            const oldVariant = item.orderItem?.variant?.combination || [item.orderItem?.variant?.color, item.orderItem?.variant?.storage].filter(Boolean).join(" • ");

            const newName = item.requestedProduct?.name || oldName;
            const newVariant = item.requestedVariant?.combination || [item.requestedVariant?.color, item.requestedVariant?.storage].filter(Boolean).join(" • ");

            return (
              <div key={item.id} className="p-3.5 sm:p-4 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs sm:text-sm space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                      {oldImage ? (
                        <Image src={oldImage} alt={oldName} className="max-w-full max-h-full object-contain" width={500} height={500} />
                      ) : (
                        <span className="text-base">📦</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold text-red-600 uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded">Geri Gönderilen</span>
                      <p className="font-bold text-gray-900 truncate text-xs mt-0.5">{oldName}</p>
                      <p className="text-[11px] text-gray-500">{oldVariant || "Standart"}</p>
                    </div>
                  </div>

                  <span className="text-sm hidden sm:block">➔</span>

                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-lg border border-indigo-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                      {oldImage ? (
                        <Image src={oldImage} alt={newName} className="max-w-full max-h-full object-contain" width={500} height={500} />
                      ) : (
                        <span className="text-base">✨</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold text-green-600 uppercase tracking-wider bg-green-50 px-1.5 py-0.5 rounded">İstenen Yeni Beden</span>
                      <p className="font-bold text-gray-900 truncate text-xs mt-0.5">{newName}</p>
                      <p className="text-[11px] text-indigo-600 font-bold">{newVariant || "Standart"}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center text-[11px] sm:text-xs">
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Neden: {REASON_LABELS[item.reason] || item.reason}
                  </span>
                  <span className="font-extrabold text-gray-900">{item.quantity} Adet</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
