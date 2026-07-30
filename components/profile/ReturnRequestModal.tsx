"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { createReturnAction } from "@/actions/return";
import { ReturnReason } from "@prisma/client";

interface OrderItemForReturn {
  id: string;
  quantity: number;
  returnedQuantity: number;
  price: number;
  product?: {
    name: string;
    images?: { imageUrl: string }[];
  } | null;
}

interface ReturnRequestModalProps {
  orderId: string;
  items: OrderItemForReturn[];
}

const REASON_LABELS: Record<ReturnReason, string> = {
  DEFECTIVE: "Ayıplı / Hasarlı / Bozuk Ürün",
  WRONG_ITEM: "Yanlış Ürün Gönderildi",
  SIZE_FIT: "Beden / Ölçü Uymadı",
  NOT_AS_DESCRIBED: "Açıklamadaki / Görseldeki Gibi Değil",
  CHANGE_OF_MIND: "Vazgeçtim / İhtiyaç Kalmadı",
  OTHER: "Diğer Nedenler",
};

export default function ReturnRequestModal({ orderId, items }: ReturnRequestModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerNote, setCustomerNote] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const [selectedItems, setSelectedItems] = useState<
    Record<string, { selected: boolean; quantity: number; reason: ReturnReason }>
  >(() => {
    const initialState: Record<string, { selected: boolean; quantity: number; reason: ReturnReason }> = {};
    items.forEach((item) => {
      const remaining = item.quantity - item.returnedQuantity;
      if (remaining > 0) {
        initialState[item.id] = {
          selected: false,
          quantity: 1,
          reason: ReturnReason.CHANGE_OF_MIND,
        };
      }
    });
    return initialState;
  });

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

  const returnableItems = items.filter((item) => item.quantity - item.returnedQuantity > 0);
  if (returnableItems.length === 0) return null;

  const handleToggleItem = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        selected: !prev[id]?.selected,
      },
    }));
  };

  const handleQuantityChange = (id: string, qty: number, max: number) => {
    const validQty = Math.max(1, Math.min(qty, max));
    setSelectedItems((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        quantity: validQty,
      },
    }));
  };

  const handleReasonChange = (id: string, reason: ReturnReason) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        reason,
      },
    }));
  };

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    if (imageUrls.length >= 3) {
      toast.error("En fazla 3 adet kanıt fotoğrafı ekleyebilirsiniz.");
      return;
    }
    setImageUrls((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput("");
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // Scroll focused element smoothly into view on mobile keyboard popups
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 300);
  };

  const estimatedRefund = items.reduce((sum, item) => {
    const state = selectedItems[item.id];
    if (state?.selected) {
      return sum + item.price * state.quantity;
    }
    return sum;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemsToSubmit = Object.entries(selectedItems)
      .filter(([_, value]) => value.selected)
      .map(([orderItemId, value]) => ({
        orderItemId,
        quantity: value.quantity,
        reason: value.reason,
      }));

    if (itemsToSubmit.length === 0) {
      toast.error("Lütfen iade etmek istediğiniz en az bir ürünü seçin.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("İade talebiniz gönderiliyor...");

    try {
      const res = await createReturnAction({
        orderId,
        customerNote,
        items: itemsToSubmit,
        imageUrls,
      });

      if (res.success) {
        toast.success("İade talebiniz başarıyla oluşturuldu!", { id: toastId });
        setIsOpen(false);
      } else {
        toast.error(res.error || "İade talebi oluşturulamadı.", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Bir sistem hatası oluştu.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-extrabold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 border border-amber-200/60"
      >
        <span>↩</span>
        <span>İade Talebi Oluştur</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92dvh] sm:max-h-[90dvh] flex flex-col shadow-2xl border border-gray-100 relative overflow-hidden">
            {/* STICKY HEADER */}
            <div className="flex justify-between items-center px-4 py-3.5 sm:px-8 sm:py-5 border-b border-gray-100 bg-white flex-shrink-0">
              <div>
                <h3 className="text-base sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <span>🔄</span> İade Talebi Oluştur
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                  Sipariş No: #{orderId.slice(-8).toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold transition min-h-[36px] min-w-[36px]"
              >
                ✕
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-8 space-y-4 sm:space-y-6 custom-scrollbar pb-8">
                {/* Ürün Seçim Alanı */}
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 mb-2.5 uppercase tracking-wider">
                    İade Edilecek Ürünleri Seçin
                  </h4>
                  <div className="space-y-3">
                    {returnableItems.map((item) => {
                      const remaining = item.quantity - item.returnedQuantity;
                      const state = selectedItems[item.id] || {
                        selected: false,
                        quantity: 1,
                        reason: ReturnReason.CHANGE_OF_MIND,
                      };
                      const displayImage = item.product?.images?.[0]?.imageUrl;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                            state.selected
                              ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20"
                              : "bg-gray-50/50 border-gray-200 opacity-80"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={state.selected}
                              onChange={() => handleToggleItem(item.id)}
                              className="mt-1.5 w-5 h-5 accent-amber-500 rounded cursor-pointer min-h-[20px] min-w-[20px]"
                            />
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                              {displayImage ? (
                                <Image
                                  src={displayImage}
                                  alt={item.product?.name || ""}
                                  className="max-w-full max-h-full object-contain"
                                  width={500}
                                  height={500}
                                />
                              ) : (
                                <span className="text-lg">📦</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                                {item.product?.name || "Silinmiş Ürün"}
                              </h5>
                              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                                Birim Fiyat: <strong>{item.price.toLocaleString("tr-TR")} ₺</strong> • Kalan İade: <strong>{remaining} adet</strong>
                              </p>

                              {state.selected && (
                                <div className="mt-3 pt-3 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                      İade Adedi
                                    </label>
                                    <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden w-fit min-h-[36px]">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuantityChange(item.id, state.quantity - 1, remaining)
                                        }
                                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-base min-h-[36px] min-w-[36px]"
                                      >
                                        -
                                      </button>
                                      <span className="px-3 font-bold text-xs">{state.quantity}</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuantityChange(item.id, state.quantity + 1, remaining)
                                        }
                                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-base min-h-[36px] min-w-[36px]"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                      İade Nedeni
                                    </label>
                                    <select
                                      value={state.reason}
                                      onFocus={handleFocus}
                                      onChange={(e) =>
                                        handleReasonChange(item.id, e.target.value as ReturnReason)
                                      }
                                      className="w-full text-xs font-semibold px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none min-h-[44px]"
                                    >
                                      {Object.entries(REASON_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>
                                          {label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Müşteri Notu */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    İade Nedeni Açıklaması (Opsiyonel)
                  </label>
                  <textarea
                    rows={2}
                    value={customerNote}
                    onFocus={handleFocus}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Ürünü neden iade etmek istediğinizi kısaca belirtebilirsiniz..."
                    className="w-full text-xs sm:text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>

                {/* Görsel Yükleme */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    Kanıt Fotoğrafı URL (Hasarlı Ürünler İçin - Maks 3)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onFocus={handleFocus}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://gorsel-linki.com/foto.jpg"
                      className="flex-1 text-xs sm:text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="bg-gray-900 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm hover:bg-black transition min-h-[44px]"
                    >
                      Ekle
                    </button>
                  </div>
                  {imageUrls.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {imageUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative group w-14 h-14 rounded-xl border border-gray-200 overflow-hidden bg-gray-50"
                        >
                          <Image
                            src={url}
                            alt={`Kanıt ${idx + 1}`}
                            className="w-full h-full object-cover"
                            width={500}
                            height={500}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute inset-0 bg-black/60 text-white font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs"
                          >
                            Sil
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* STICKY FOOTER BUTTONS */}
              <div className="px-4 py-3 sm:px-8 sm:py-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 flex-shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="text-left w-full sm:w-auto">
                  <span className="text-[11px] text-gray-500 font-medium block">
                    Tahmini İade Tutarı
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-amber-600 leading-none mt-0.5">
                    {estimatedRefund.toLocaleString("tr-TR")} ₺
                  </p>
                </div>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 sm:flex-initial px-5 py-3 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition text-xs sm:text-sm min-h-[44px]"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || estimatedRefund <= 0}
                    className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold px-6 py-3 rounded-xl transition shadow-xs text-xs sm:text-sm min-h-[44px]"
                  >
                    {isSubmitting ? "Gönderiliyor..." : "Talebi Gönder"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
