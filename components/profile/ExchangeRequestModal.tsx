"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { ExchangeReason } from "@prisma/client";
import { createExchangeAction } from "@/actions/exchange";

interface OrderItemData {
  id: string;
  quantity: number;
  returnedQuantity: number;
  exchangedQuantity: number;
  price: number;
  productId: string;
  variantId?: string | null;
  product?: {
    id: string;
    name: string;
    images?: { imageUrl: string }[];
    variants?: {
      id: string;
      color?: string | null;
      storage?: string | null;
      combination?: string | null;
      stock: number;
    }[];
  } | null;
  variant?: {
    id: string;
    color?: string | null;
    storage?: string | null;
    combination?: string | null;
  } | null;
}

const REASON_OPTIONS: { value: ExchangeReason; label: string }[] = [
  { value: "SIZE_CHANGE", label: "Beden / Ölçü Değişimi" },
  { value: "COLOR_CHANGE", label: "Renk Değişimi" },
  { value: "DEFECTIVE_REPLACEMENT", label: "Ayıplı / Hasarlı Ürün Değişimi" },
  { value: "WRONG_ITEM_SENT", label: "Yanlış Ürün Gönderildi" },
  { value: "OTHER", label: "Diğer Nedenler" },
];

export default function ExchangeRequestModal({
  orderId,
  items,
}: {
  orderId: string;
  items: OrderItemData[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedOrderItemId, setSelectedOrderItemId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<ExchangeReason>("SIZE_CHANGE");
  const [selectedNewVariantId, setSelectedNewVariantId] = useState<string>("");
  const [customerNote, setCustomerNote] = useState<string>("");

  // Lock background body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const eligibleItems = items.filter(
    (item) => item.quantity - (item.returnedQuantity + item.exchangedQuantity) > 0
  );

  const activeItem = items.find((i) => i.id === selectedOrderItemId);
  const maxQuantity = activeItem
    ? activeItem.quantity - (activeItem.returnedQuantity + activeItem.exchangedQuantity)
    : 1;

  const availableVariants = activeItem?.product?.variants?.filter((v) => v.stock > 0) || [];
  const selectedNewVariant = availableVariants.find((v) => v.id === selectedNewVariantId);

  const handleOpenModal = () => {
    if (eligibleItems.length === 0) {
      toast.error("Bu siparişte değişime uygun ürün bulunmamaktadır.");
      return;
    }
    const firstItem = eligibleItems[0];
    setSelectedOrderItemId(firstItem.id);
    setQuantity(1);
    setReason("SIZE_CHANGE");
    setCustomerNote("");
    const otherVariant = firstItem.product?.variants?.find((v) => v.id !== firstItem.variantId && v.stock > 0);
    setSelectedNewVariantId(otherVariant ? otherVariant.id : firstItem.variantId || "");
    setIsOpen(true);
  };

  const handleItemChange = (itemId: string) => {
    setSelectedOrderItemId(itemId);
    const target = items.find((i) => i.id === itemId);
    setQuantity(1);
    const otherVariant = target?.product?.variants?.find((v) => v.id !== target.variantId && v.stock > 0);
    setSelectedNewVariantId(otherVariant ? otherVariant.id : target?.variantId || "");
  };

  const handleFocus = (e: React.FocusEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderItemId) {
      toast.error("Lütfen değiştirilecek bir ürün seçiniz.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Değişim talebiniz gönderiliyor...");

    try {
      const res = await createExchangeAction({
        orderId,
        customerNote,
        items: [
          {
            orderItemId: selectedOrderItemId,
            quantity,
            reason,
            requestedVariantId: selectedNewVariantId || undefined,
          },
        ],
      });

      if (res.success) {
        toast.success("Ürün değişim talebiniz başarıyla oluşturuldu!", { id: toastId });
        setIsOpen(false);
      } else {
        toast.error(res.error || "Değişim talebi oluşturulamadı.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Bir hata oluştu.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-extrabold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 border border-purple-200/60"
      >
        <span>🔄</span>
        <span>Değişim Talebi Oluştur</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92dvh] sm:max-h-[90dvh] flex flex-col shadow-2xl border border-gray-100 relative overflow-hidden">
            {/* STICKY HEADER */}
            <div className="flex justify-between items-start px-4 py-3.5 sm:px-8 sm:py-5 border-b border-gray-100 bg-white flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">🔁</span>
                  <h3 className="text-base sm:text-xl font-extrabold text-gray-900">
                    Ürün Değişim Talebi Oluştur
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                  Farklı beden, renk veya varyasyon ile değişim yapabilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold transition min-h-[36px] min-w-[36px]"
              >
                ✕
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-8 space-y-4 sm:space-y-6 custom-scrollbar pb-8">
                {/* 1. DEĞİŞTİRİLECEK ÜRÜN SEÇİMİ */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    1. Değiştirilecek Ürünü Seçin
                  </label>
                  <select
                    value={selectedOrderItemId}
                    onFocus={handleFocus}
                    onChange={(e) => handleItemChange(e.target.value)}
                    className="w-full text-xs sm:text-sm font-medium px-3.5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50/50 min-h-[44px]"
                  >
                    {eligibleItems.map((item) => {
                      const remaining =
                        item.quantity - (item.returnedQuantity + item.exchangedQuantity);
                      const variantText =
                        item.variant?.combination ||
                        [item.variant?.color, item.variant?.storage].filter(Boolean).join(" • ");
                      return (
                        <option key={item.id} value={item.id}>
                          {item.product?.name} {variantText ? `(${variantText})` : ""} - Kalan Hak: {remaining} Adet
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 2. ADET SEÇİMİ */}
                {activeItem && (
                  <div>
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                      2. Değiştirilecek Adet
                    </label>
                    <select
                      value={quantity}
                      onFocus={handleFocus}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full text-xs sm:text-sm font-medium px-3.5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50/50 min-h-[44px]"
                    >
                      {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((qty) => (
                        <option key={qty} value={qty}>
                          {qty} Adet
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3. İSTENEN YENİ VARYASYON SEÇİMİ */}
                {activeItem && availableVariants.length > 0 && (
                  <div>
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                      3. İstediğiniz Yeni Beden / Renk / Varyasyon
                    </label>
                    <select
                      value={selectedNewVariantId}
                      onFocus={handleFocus}
                      onChange={(e) => setSelectedNewVariantId(e.target.value)}
                      className="w-full text-xs sm:text-sm font-medium px-3.5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50/50 min-h-[44px]"
                    >
                      {availableVariants.map((varItem) => {
                        const vText =
                          varItem.combination ||
                          [varItem.color, varItem.storage].filter(Boolean).join(" • ");
                        const isCurrent = varItem.id === activeItem.variantId;
                        return (
                          <option key={varItem.id} value={varItem.id}>
                            {vText || "Standart Varyasyon"} {isCurrent ? "(Mevcut Aldığınız Beden)" : ""} - Stok: {varItem.stock} Adet
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* 4. GÖRSEL KARŞILAŞTIRMA KART */}
                {activeItem && (
                  <div className="bg-gradient-to-r from-indigo-50/70 via-purple-50/70 to-blue-50/70 p-3 sm:p-4 rounded-2xl border border-indigo-100">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-600 block mb-2.5 text-center">
                      GÖRSEL DEĞİŞİM KARŞILAŞTIRMASI
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div className="bg-white p-2.5 rounded-xl border border-gray-200 flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 flex items-center justify-center p-1">
                          {activeItem.product?.images?.[0]?.imageUrl ? (
                            <Image
                              src={activeItem.product.images[0].imageUrl}
                              alt="Eski"
                              className="max-w-full max-h-full object-contain"
                              width={500}
                              height={500}
                            />
                          ) : (
                            <span className="text-base">📦</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold text-red-600 uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded">
                            Mevcut Ürün
                          </span>
                          <p className="font-bold text-gray-900 text-xs truncate mt-0.5">
                            {activeItem.product?.name}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                            {activeItem.variant?.combination ||
                              [activeItem.variant?.color, activeItem.variant?.storage].filter(Boolean).join(" • ") ||
                              "Standart"}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-indigo-200 flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg overflow-hidden border border-indigo-100 flex-shrink-0 flex items-center justify-center p-1">
                          {activeItem.product?.images?.[0]?.imageUrl ? (
                            <Image
                              src={activeItem.product.images[0].imageUrl}
                              alt="Yeni"
                              className="max-w-full max-h-full object-contain"
                              width={500}
                              height={500}
                            />
                          ) : (
                            <span className="text-base">✨</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold text-green-600 uppercase tracking-wider bg-green-50 px-1.5 py-0.5 rounded">
                            İstenen Yeni Beden
                          </span>
                          <p className="font-bold text-gray-900 text-xs truncate mt-0.5">
                            {activeItem.product?.name}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-indigo-600 font-bold">
                            {selectedNewVariant?.combination ||
                              [selectedNewVariant?.color, selectedNewVariant?.storage].filter(Boolean).join(" • ") ||
                              "Seçilmedi"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. DEĞİŞİM NEDENİ */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    5. Değişim Nedeni
                  </label>
                  <select
                    value={reason}
                    onFocus={handleFocus}
                    onChange={(e) => setReason(e.target.value as ExchangeReason)}
                    className="w-full text-xs sm:text-sm font-medium px-3.5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50/50 min-h-[44px]"
                  >
                    {REASON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. MÜŞTERİ NOTU */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    6. Açıklama / Notunuz (İsteğe Bağlı)
                  </label>
                  <textarea
                    value={customerNote}
                    onFocus={handleFocus}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    rows={2}
                    placeholder="Örn: 42 yerine 43 numara gönderilmesini rica ederim."
                    className="w-full text-xs sm:text-sm px-3.5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50/50 resize-none transition-colors focus:bg-white"
                  />
                </div>
              </div>

              {/* STICKY FOOTER BUTTONS */}
              <div className="px-4 py-3 sm:px-8 sm:py-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-2.5 flex-shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition text-xs sm:text-sm min-h-[44px]"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-3 rounded-xl transition text-xs sm:text-sm shadow-md disabled:opacity-50 min-h-[44px]"
                >
                  {isSubmitting ? "Gönderiliyor..." : "Değişim Talebini Gönder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
