"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { ReturnStatus, ReturnReason } from "@prisma/client";
import {
  approveReturnAction,
  rejectReturnAction,
  receiveReturnAction,
  completeReturnAction,
} from "@/actions/return";

interface ReturnItemDetail {
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

interface ReturnImageDetail {
  id: string;
  imageUrl: string;
}

export interface AdminReturnDetailData {
  id: string;
  status: ReturnStatus;
  refundAmount: number;
  refundMethod?: string | null;
  returnTrackingNumber?: string | null;
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
  items: ReturnItemDetail[];
  images?: ReturnImageDetail[];
}

const REASON_LABELS: Record<ReturnReason, string> = {
  DEFECTIVE: "Ayıplı / Hasarlı Ürün",
  WRONG_ITEM: "Yanlış Ürün Gönderildi",
  SIZE_FIT: "Beden / Ölçü Uymadı",
  NOT_AS_DESCRIBED: "Açıklamadaki Gibi Değil",
  CHANGE_OF_MIND: "Vazgeçtim / İhtiyaç Kalmadı",
  OTHER: "Diğer Nedenler",
};

const STATUS_BADGES: Record<ReturnStatus, { label: string; bg: string; text: string }> = {
  PENDING: { label: "Bekliyor (İncelemede)", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  APPROVED: { label: "Onaylandı (Kargo Kodu Verildi)", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  SHIPPED: { label: "Müşteri Kargoya Verdi", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
  RECEIVED: { label: "Depoya Ulaştı (Kontrolde)", bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
  COMPLETED: { label: "Tamamlandı (İade Edildi)", bg: "bg-green-50 border-green-200", text: "text-green-700" },
  REJECTED: { label: "Reddedildi", bg: "bg-red-50 border-red-200", text: "text-red-700" },
};

export default function AdminReturnDetailModal({
  returnRequest,
  onClose,
}: {
  returnRequest: AdminReturnDetailData;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminNote, setAdminNote] = useState(returnRequest.adminNote || "");
  const [trackingNumber, setTrackingNumber] = useState(
    returnRequest.returnTrackingNumber || `RETURN-${returnRequest.id.slice(-6).toUpperCase()}`
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const badge = STATUS_BADGES[returnRequest.status] || STATUS_BADGES.PENDING;

  const handleApprove = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("İade talebi onaylanıyor...");
    try {
      const res = await approveReturnAction(returnRequest.id, trackingNumber, adminNote);
      if (res.success) {
        toast.success("İade talebi onaylandı ve kargo kodu oluşturuldu!", { id: toastId });
        onClose();
      } else {
        toast.error(res.error || "Onaylama hatası.", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("İşlem gerçekleştirilemedi.", { id: toastId });
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
    const toastId = toast.loading("İade talebi reddediliyor...");
    try {
      const res = await rejectReturnAction(returnRequest.id, adminNote);
      if (res.success) {
        toast.success("İade talebi reddedildi.", { id: toastId });
        onClose();
      } else {
        toast.error(res.error || "Reddetme hatası.", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("İşlem gerçekleştirilemedi.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceive = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Depo teslimatı kaydediliyor...");
    try {
      const res = await receiveReturnAction(returnRequest.id, adminNote);
      if (res.success) {
        toast.success("İade ürünü depoda teslim alındı olarak işaretlendi!", { id: toastId });
        onClose();
      } else {
        toast.error(res.error || "Güncelleme hatası.", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("İşlem gerçekleştirilemedi.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("İadeyi tamamlamak istediğinize emin misiniz? Bu işlem stokları otomatik artıracak ve ödeme iadesini kaydedecektir.")) {
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("İade tamamlanıyor ve stoklar güncelleniyor...");
    try {
      const res = await completeReturnAction(returnRequest.id, "CREDIT_CARD_REFUND", adminNote);
      if (res.success) {
        toast.success("İade başarıyla tamamlandı! Stoklar otomatik olarak artırıldı 🎉", { id: toastId });
        onClose();
      } else {
        toast.error(res.error || "Tamamlama hatası.", { id: toastId });
      }
    } catch (error) {
      console.error(error);
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
              <h3 className="text-lg sm:text-2xl font-extrabold text-gray-900 tracking-tight">İade Talebi Detayı</h3>
              <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-md border ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-1">İade ID: #{returnRequest.id.slice(-8).toUpperCase()}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold transition min-h-[36px] min-w-[36px]"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6">
          <div className="bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Müşteri</span>
            <p className="font-bold text-gray-900 text-xs sm:text-sm truncate">{returnRequest.user?.name || "Anonim Kullanıcı"}</p>
            <p className="text-[11px] sm:text-xs text-gray-500 truncate">{returnRequest.user?.email}</p>
          </div>

          <div className="bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">İlişkili Sipariş</span>
            <p className="font-mono font-bold text-blue-600 text-xs sm:text-sm">#{returnRequest.order?.id.slice(-8).toUpperCase()}</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Sipariş Tutarı: {returnRequest.order?.totalPrice.toLocaleString("tr-TR")} ₺</p>
          </div>

          <div className="bg-amber-50/60 p-3.5 sm:p-4 rounded-2xl border border-amber-100">
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest block mb-0.5">Talep Edilen İade Tutarı</span>
            <p className="font-black text-amber-600 text-xl sm:text-2xl">{returnRequest.refundAmount.toLocaleString("tr-TR")} ₺</p>
          </div>
        </div>

        {/* İADE EDİLEN ÜRÜNLER TABLOSU */}
        <div className="mb-6">
          <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2.5">İade Edilmek İstenen Ürünler</h4>
          <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {returnRequest.items.map((item) => {
                const displayImage = item.orderItem?.product?.images?.[0]?.imageUrl;
                const productName = item.orderItem?.product?.name || "Silinmiş Ürün";
                const variantText = item.orderItem?.variant?.combination || [item.orderItem?.variant?.color, item.orderItem?.variant?.storage].filter(Boolean).join(" • ");

                return (
                  <div key={item.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                        {displayImage ? (
                          <Image src={displayImage} alt={productName} className="max-w-full max-h-full object-contain" width={500} height={500} />
                        ) : (
                          <span className="text-base">📦</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{productName}</p>
                        {variantText && <p className="text-[11px] text-gray-500 font-medium truncate">{variantText}</p>}
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          Neden: {REASON_LABELS[item.reason] || item.reason}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-extrabold text-gray-900">{item.quantity} Adet</p>
                      <p className="text-xs font-black text-amber-600 mt-0.5">{item.refundAmount.toLocaleString("tr-TR")} ₺</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MÜŞTERİ NOTU & FOTOĞRAFLAR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div className="bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-100">
            <span className="text-xs font-bold text-gray-700 block mb-1">💬 Müşteri Açıklaması</span>
            <p className="text-xs sm:text-sm text-gray-600 italic leading-relaxed">
              {returnRequest.customerNote || "Müşteri ekstra bir not belirtmedi."}
            </p>
          </div>

          <div className="bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-100">
            <span className="text-xs font-bold text-gray-700 block mb-2">📸 Müşterinin Yüklediği Fotoğraflar</span>
            {returnRequest.images && returnRequest.images.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {returnRequest.images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImage(img.imageUrl)}
                    className="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden bg-white cursor-pointer hover:opacity-80 transition"
                  >
                    <Image src={img.imageUrl} alt="Kanıt" className="w-full h-full object-cover" width={500} height={500} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Fotoğraf yüklenmedi.</p>
            )}
          </div>
        </div>

        {/* ADMİN GİRDİ ALANLARI */}
        <div className="space-y-4 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-200 mb-6">
          <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Yönetim Bilgileri</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">İade Kargo Takip Kodu</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Örn: RETURN-98421"
                className="w-full text-xs sm:text-sm font-mono px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Admin / Mağaza Notu</label>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Örn: Ürün kontrol edildi, sorunsuz stoğa eklendi."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white min-h-[44px]"
              />
            </div>
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

          <div className="flex flex-col sm:flex-row gap-2">
            {returnRequest.status !== "COMPLETED" && returnRequest.status !== "REJECTED" && (
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs sm:text-sm shadow-xs disabled:opacity-50 min-h-[44px]"
              >
                Reddet
              </button>
            )}

            {returnRequest.status === "PENDING" && (
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs sm:text-sm shadow-xs disabled:opacity-50 min-h-[44px]"
              >
                Talebi Onayla & Kargo Kodu Ver
              </button>
            )}

            {(returnRequest.status === "APPROVED" || returnRequest.status === "SHIPPED") && (
              <button
                onClick={handleReceive}
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs sm:text-sm shadow-xs disabled:opacity-50 min-h-[44px]"
              >
                Depoda Teslim Alındı İşaretle
              </button>
            )}

            {returnRequest.status !== "COMPLETED" && returnRequest.status !== "REJECTED" && (
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs sm:text-sm shadow-md disabled:opacity-50 min-h-[44px]"
              >
                İadeyi Tamamla (Stok++ & Ödeme İadesi)
              </button>
            )}
          </div>
        </div>

        {selectedImage && (
          <div
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="relative max-w-3xl max-h-[80vh] bg-white rounded-2xl overflow-hidden p-2">
              <Image src={selectedImage} alt="Büyük Kanıt" className="max-w-full max-h-[75vh] object-contain" width={500} height={500} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
