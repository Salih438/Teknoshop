"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { ExchangeStatus, ExchangeReason } from "@prisma/client";
import {
  approveExchangeAction,
  rejectExchangeAction,
  receiveExchangeAction,
  updateExchangeStatusAction,
  completeExchangeAction,
} from "@/actions/exchange";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface ExchangeItemDetail {
  id: string;
  quantity: number;
  reason: ExchangeReason;
  orderItem?: {
    product?: {
      name: string;
      stock: number;
      images?: { imageUrl: string }[];
    } | null;
    variant?: {
      combination?: string | null;
      color?: string | null;
      storage?: string | null;
      stock: number;
    } | null;
  } | null;
  requestedProduct?: {
    name: string;
    stock: number;
    images?: { imageUrl: string }[];
  } | null;
  requestedVariant?: {
    combination?: string | null;
    color?: string | null;
    storage?: string | null;
    stock: number;
  } | null;
}

export interface AdminExchangeDetailData {
  id: string;
  status: ExchangeStatus;
  returnTrackingNumber?: string | null;
  newShipmentTrackingNumber?: string | null;
  customerNote?: string | null;
  adminNote?: string | null;
  createdAt: Date | string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  order?: {
    id: string;
    createdAt: Date | string;
    totalPrice: number;
  } | null;
  items: ExchangeItemDetail[];
}

const REASON_LABELS: Record<ExchangeReason, string> = {
  SIZE_CHANGE: "Beden / Ölçü Değişimi",
  COLOR_CHANGE: "Renk Değişimi",
  DEFECTIVE_REPLACEMENT: "Ayıplı / Hasarlı Ürün Değişimi",
  WRONG_ITEM_SENT: "Yanlış Ürün Gönderildi",
  OTHER: "Diğer Nedenler",
};

const STATUS_BADGES: Record<ExchangeStatus, { label: string; bg: string; text: string }> = {
  PENDING: { label: "Bekliyor (İnceleme)", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  APPROVED: { label: "Onaylandı (Müşteriden Kargo Bekleniyor)", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  WAITING_FOR_CUSTOMER: { label: "Kargo Bekleniyor", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
  WAITING_STOCK: { label: "Stok Bekleniyor", bg: "bg-orange-50 border-orange-200", text: "text-orange-700" },
  SHIPPED: { label: "Müşteri Kargoya Verdi", bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
  RECEIVED: { label: "Depoya Ulaştı (Kontrolde)", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
  PROCESSING: { label: "Yeni Ürün Hazırlanıyor", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  COMPLETED: { label: "Değişim Tamamlandı", bg: "bg-green-50 border-green-200", text: "text-green-700" },
  REJECTED: { label: "Değişim Reddedildi", bg: "bg-red-50 border-red-200", text: "text-red-700" },
};

export default function AdminExchangeDetailModal({
  exchangeRequest,
  onClose,
}: {
  exchangeRequest: AdminExchangeDetailData;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminNote, setAdminNote] = useState(exchangeRequest.adminNote || "");
  const [returnTrackingNumber, setReturnTrackingNumber] = useState(
    exchangeRequest.returnTrackingNumber || `EXCHANGE-${exchangeRequest.id.slice(-6).toUpperCase()}`
  );
  const [newShipmentTrackingNumber, setNewShipmentTrackingNumber] = useState(
    exchangeRequest.newShipmentTrackingNumber || ""
  );
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false);

  const badge = STATUS_BADGES[exchangeRequest.status] || STATUS_BADGES.PENDING;

  const handleApprove = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Değişim talebi onaylanıyor...");
    try {
      const res = await approveExchangeAction(exchangeRequest.id, returnTrackingNumber, adminNote);
      if (res.success) {
        toast.success("Değişim talebi onaylandı ve iade kargo kodu üretildi!", { id: toastId });
        onClose();
      } else {
        toast.error(res.error || "Onaylama hatası.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("İşlem başarısız.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWaitingStock = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Stok bekleniyor durumuna alınıyor...");
    try {
      const res = await updateExchangeStatusAction(
        exchangeRequest.id,
        "WAITING_STOCK",
        newShipmentTrackingNumber,
        adminNote || "İstenen yeni ürün stoğu şu an tükendiği için talep stok bekleniyor durumuna alınmıştır."
      );
      if (res.success) {
        toast.success("Talep 'Stok Bekleniyor' durumuna alındı. Müşteri bilgilendirildi.", { id: toastId });
        onClose();
      } else {
        toast.error(res.error || "Güncelleme hatası.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("İşlem başarısız.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!adminNote.trim()) {
      toast.error("Lütfen bir red gerekçesi (Admin Notu) giriniz.");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Değişim talebi reddediliyor...");
    try {
      const res = await rejectExchangeAction(exchangeRequest.id, adminNote);
      if (res.success) {
        toast.success("Değişim talebi reddedildi.", { id: toastId });
        onClose();
      } else {
        toast.error(res.error || "Reddetme hatası.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("İşlem başarısız.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceive = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Depo teslimatı kaydediliyor...");
    try {
      const res = await receiveExchangeAction(exchangeRequest.id, adminNote);
      if (res.success) {
        toast.success("Değişim ürünü depoda teslim alındı!", { id: toastId });
        onClose();
      } else {
        toast.error(res.error || "Güncelleme hatası.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("İşlem başarısız.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShipNewItem = async () => {
    if (!newShipmentTrackingNumber.trim()) {
      toast.error("Lütfen müşteriye gönderilen yeni ürünün kargo takip numarasını giriniz.");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Yeni ürün kargoya veriliyor...");
    try {
      const res = await updateExchangeStatusAction(
        exchangeRequest.id,
        "PROCESSING",
        newShipmentTrackingNumber,
        adminNote
      );
      if (res.success) {
        toast.success("Yeni ürün kargo bilgisi kaydedildi!", { id: toastId });
        onClose();
      } else {
        toast.error(res.error || "Güncelleme hatası.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("İşlem başarısız.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Değişim tamamlanıyor ve stoklar senkronize ediliyor...");
    try {
      const res = await completeExchangeAction(exchangeRequest.id, adminNote);
      if (res.success) {
        toast.success("Değişim başarıyla tamamlandı! Eski ve yeni stoklar otomatik senkronize edildi 🎉", {
          id: toastId,
        });
        onClose();
      } else {
        toast.error(res.error || "Tamamlama hatası.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("İşlem gerçekleştirilemedi.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 p-4 sm:p-8 relative">
        
        {/* MODAL BAŞLIĞI */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4 sm:mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg sm:text-2xl font-extrabold text-gray-900 tracking-tight">Ürün Değişim Talebi Detayı</h3>
              <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-md border ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-1">Değişim ID: #{exchangeRequest.id.slice(-8).toUpperCase()}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold transition min-h-[36px] min-w-[36px]"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 mb-6">
          <div className="bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Müşteri Bilgisi</span>
            <p className="font-bold text-gray-900 text-xs sm:text-sm truncate">{exchangeRequest.user?.name || "Anonim Kullanıcı"}</p>
            <p className="text-[11px] sm:text-xs text-gray-500 truncate">{exchangeRequest.user?.email}</p>
          </div>

          <div className="bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">İlişkili Sipariş</span>
            <p className="font-mono font-bold text-blue-600 text-xs sm:text-sm">#{exchangeRequest.order?.id.slice(-8).toUpperCase()}</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Sipariş Tutarı: {exchangeRequest.order?.totalPrice.toLocaleString("tr-TR")} ₺</p>
          </div>
        </div>

        {/* DEĞİŞİM ÜRÜN & STOK KARŞILAŞTIRMASI */}
        <div className="mb-6">
          <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2.5">Değişim Ürün & Stok Karşılaştırması</h4>
          <div className="space-y-3 sm:space-y-4">
            {exchangeRequest.items.map((item) => {
              const oldImage = item.orderItem?.product?.images?.[0]?.imageUrl;
              const oldName = item.orderItem?.product?.name || "Silinmiş Ürün";
              const oldVariant = item.orderItem?.variant?.combination || [item.orderItem?.variant?.color, item.orderItem?.variant?.storage].filter(Boolean).join(" • ");
              const oldStock = item.orderItem?.variant ? item.orderItem.variant.stock : item.orderItem?.product?.stock ?? 0;

              const newName = item.requestedProduct?.name || oldName;
              const newVariant = item.requestedVariant?.combination || [item.requestedVariant?.color, item.requestedVariant?.storage].filter(Boolean).join(" • ");
              const newStock = item.requestedVariant ? item.requestedVariant.stock : item.requestedProduct?.stock ?? 0;

              return (
                <div key={item.id} className="bg-gradient-to-r from-gray-50 via-indigo-50/50 to-gray-50 p-3.5 sm:p-5 rounded-2xl border border-indigo-100 space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-center">
                    
                    <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 flex items-center justify-center p-1">
                          {oldImage ? (
                            <Image src={oldImage} alt={oldName} className="max-w-full max-h-full object-contain" width={500} height={500} />
                          ) : (
                            <span className="text-base">📦</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold text-red-600 uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded">ESKİ GÖNDERİLEN</span>
                          <p className="font-bold text-gray-900 text-xs truncate mt-0.5">{oldName}</p>
                          <p className="text-[11px] text-gray-500 font-medium">{oldVariant || "Standart"}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Stok</span>
                        <span className="font-extrabold text-gray-900 text-xs sm:text-sm">{oldStock} Adet</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-indigo-200 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg overflow-hidden border border-indigo-100 flex-shrink-0 flex items-center justify-center p-1">
                          {oldImage ? (
                            <Image src={oldImage} alt={newName} className="max-w-full max-h-full object-contain" width={500} height={500} />
                          ) : (
                            <span className="text-base">✨</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded">İSTENEN YENİ BEDEN</span>
                          <p className="font-bold text-gray-900 text-xs truncate mt-0.5">{newName}</p>
                          <p className="text-[11px] text-indigo-600 font-bold">{newVariant || "Standart"}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Yeni Beden Stoğu</span>
                        <span className={`font-extrabold text-xs sm:text-sm ${newStock < item.quantity ? 'text-red-600' : 'text-green-600'}`}>
                          {newStock} Adet
                        </span>
                      </div>
                    </div>

                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-gray-200/60 pt-2.5">
                    <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Neden: {REASON_LABELS[item.reason] || item.reason}
                    </span>
                    <span className="font-extrabold text-gray-900">Adet: {item.quantity}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MÜŞTERİ AÇIKLAMASI */}
        {exchangeRequest.customerNote && (
          <div className="bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-100 mb-6">
            <span className="text-xs font-bold text-gray-700 block mb-1">💬 Müşterinin Açıklama Notu</span>
            <p className="text-xs sm:text-sm text-gray-600 italic leading-relaxed">{exchangeRequest.customerNote}</p>
          </div>
        )}

        {/* ADMİN GİRDİ ALANLARI */}
        <div className="space-y-4 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-200 mb-6">
          <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Yönetim ve Kargo Bilgileri</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Müşteri İade Kargo Kodu</label>
              <input
                type="text"
                value={returnTrackingNumber}
                onChange={(e) => setReturnTrackingNumber(e.target.value)}
                placeholder="Örn: EXCHANGE-98421"
                className="w-full text-xs sm:text-sm font-mono px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Yeni Ürün Kargo Takip Kodu</label>
              <input
                type="text"
                value={newShipmentTrackingNumber}
                onChange={(e) => setNewShipmentTrackingNumber(e.target.value)}
                placeholder="Örn: YURTICI-8421094"
                className="w-full text-xs sm:text-sm font-mono px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Admin / Mağaza Notu</label>
            <input
              type="text"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Örn: Müşterinin istediği 43 beden ayrıldı, kargolanacak."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white min-h-[44px]"
            />
          </div>
        </div>

        {/* AKSİYON BUTONLARI (Min 44px Touch Target) */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition text-xs sm:text-sm min-h-[44px]"
          >
            Kapat
          </button>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            {exchangeRequest.status !== "COMPLETED" && exchangeRequest.status !== "REJECTED" && (
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 py-2.5 rounded-xl transition text-xs sm:text-sm shadow-xs disabled:opacity-50 min-h-[44px]"
              >
                Reddet
              </button>
            )}

            {exchangeRequest.status !== "COMPLETED" && exchangeRequest.status !== "REJECTED" && (
              <button
                onClick={handleWaitingStock}
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-4 py-2.5 rounded-xl transition text-xs sm:text-sm shadow-xs disabled:opacity-50 min-h-[44px]"
              >
                ⏳ Stok Bekleniyor Durumuna Al
              </button>
            )}

            {exchangeRequest.status === "PENDING" && (
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs sm:text-sm shadow-xs disabled:opacity-50 min-h-[44px]"
              >
                Onayla & İade Kodu Ver
              </button>
            )}

            {(exchangeRequest.status === "APPROVED" || exchangeRequest.status === "SHIPPED" || exchangeRequest.status === "WAITING_FOR_CUSTOMER") && (
              <button
                onClick={handleReceive}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs sm:text-sm shadow-xs disabled:opacity-50 min-h-[44px]"
              >
                Depoda Teslim Alındı İşaretle
              </button>
            )}

            {exchangeRequest.status === "RECEIVED" && (
              <button
                onClick={handleShipNewItem}
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs sm:text-sm shadow-xs disabled:opacity-50 min-h-[44px]"
              >
                Yeni Ürünü Kargola
              </button>
            )}

            {exchangeRequest.status !== "COMPLETED" && exchangeRequest.status !== "REJECTED" && (
              <button
                onClick={() => setIsCompleteConfirmOpen(true)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-6 py-2.5 rounded-xl transition text-xs sm:text-sm shadow-md disabled:opacity-50 min-h-[44px]"
              >
                Değişimi Tamamla (Stok Senkronize Et)
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Değişim Tamamlama Onay Modalı */}
      <ConfirmModal
        isOpen={isCompleteConfirmOpen}
        onClose={() => setIsCompleteConfirmOpen(false)}
        onConfirm={handleComplete}
        title="Değişimi Tamamla"
        description="Değişimi tamamlamak istediğinize emin misiniz? Eski iade edilen ürün stoğu artırılacak ve müşteriye gönderilen yeni beden ürün stoğu otomatik düşürülecektir."
        confirmText="Evet, Tamamla"
        cancelText="Vazgeç"
        variant="primary"
        isLoading={isSubmitting}
      />
    </div>
  );
}
