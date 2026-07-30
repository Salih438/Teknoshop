"use client";

import { useState } from "react";
import Link from "next/link";

interface OrderSummaryProps {
  items: { id: string; name: string; price: number; quantity: number }[];
  subTotal: number;
  shippingCost: number;
  discount: number;
  finalTotal: number;
  couponCode: string;
  setCouponCode: (code: string) => void;
  applyCoupon: () => void;
  removeCoupon: () => void;
  isAgreed: boolean;
  setIsAgreed: (agreed: boolean) => void;
  isSubmitting: boolean;
  selectedAddressId: string;
}

export default function OrderSummary({
  items,
  subTotal,
  shippingCost,
  discount,
  finalTotal,
  couponCode,
  setCouponCode,
  applyCoupon,
  removeCoupon,
  isAgreed,
  setIsAgreed,
  isSubmitting,
  selectedAddressId,
}: OrderSummaryProps) {
  const [isItemsExpanded, setIsItemsExpanded] = useState(true);

  return (
    <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-xs border border-gray-200 lg:sticky lg:top-24 w-full overflow-x-clip text-left space-y-4">
      
      {/* BAŞLIK VE ÜRÜN GÖSTER/GİZLE */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
          <span>📦</span> Sipariş Özeti
        </h2>

        <button
          type="button"
          onClick={() => setIsItemsExpanded((prev) => !prev)}
          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
        >
          <span>{items.length} Ürün</span>
          <span>{isItemsExpanded ? "▲" : "▼"}</span>
        </button>
      </div>

      {/* ÜRÜN LİSTESİ (COLLAPSIBLE) */}
      {isItemsExpanded && (
        <div className="space-y-3 border-b border-gray-100 pb-4 max-h-56 overflow-y-auto pr-1 custom-scrollbar animate-in fade-in duration-200">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-start text-xs sm:text-sm gap-2">
              <span className="text-gray-700 font-bold line-clamp-2 leading-snug">
                {item.name}
                <span className="block text-[10px] text-gray-400 font-bold mt-0.5">Adet: {item.quantity}</span>
              </span>
              <span className="font-black text-gray-900 flex-shrink-0">
                {(item.price * item.quantity).toLocaleString("tr-TR")} ₺
              </span>
            </div>
          ))}
        </div>
      )}

      {/* KUPON KODU ALANI */}
      <div>
        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">
          İndirim Kuponu
        </label>

        {discount > 0 ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 min-h-[44px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-emerald-600 font-black">✓</span>
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wider truncate">
                {couponCode}
              </span>
            </div>
            <button
              type="button"
              onClick={removeCoupon}
              className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-100 px-3 py-1.5 rounded-lg transition min-h-[36px]"
            >
              Kaldır
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="KUPON KODU"
              className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 outline-none uppercase font-bold min-h-[44px]"
            />
            <button
              type="button"
              onClick={applyCoupon}
              className="bg-gray-900 text-white px-4 rounded-xl text-xs font-extrabold hover:bg-blue-600 transition flex-shrink-0 min-h-[44px]"
            >
              Uygula
            </button>
          </div>
        )}
      </div>

      {/* FİYAT DAĞILIMI */}
      <div className="space-y-2.5 text-xs sm:text-sm text-gray-600 border-b border-gray-100 pb-4 font-medium">
        <div className="flex justify-between">
          <span>Ara Toplam</span>
          <span className="font-bold text-gray-900">{subTotal.toLocaleString("tr-TR")} ₺</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-emerald-600 font-bold">
            <span>İndirim Kazancı</span>
            <span>-{discount.toLocaleString("tr-TR")} ₺</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Kargo Ücreti</span>
          {shippingCost === 0 ? (
            <span className="text-emerald-600 font-black">ÜCRETSIZ</span>
          ) : (
            <span className="font-bold text-gray-900">{shippingCost.toLocaleString("tr-TR")} ₺</span>
          )}
        </div>

        <div className="flex justify-between text-[11px] text-gray-400">
          <span>Tahmini KDV (%20 Dahil)</span>
          <span>{Math.round(finalTotal * 0.2).toLocaleString("tr-TR")} ₺</span>
        </div>
      </div>

      {/* GENEL TOPLAM */}
      <div className="flex justify-between items-center font-black text-xl sm:text-2xl pt-1">
        <span className="text-gray-900">Genel Toplam</span>
        <span className="text-blue-600">{finalTotal.toLocaleString("tr-TR")} ₺</span>
      </div>

      {/* SÖZLEŞME ONAYI */}
      <label className="flex items-start gap-2.5 cursor-pointer group min-h-[44px]">
        <input
          type="checkbox"
          checked={isAgreed}
          onChange={(e) => setIsAgreed(e.target.checked)}
          className="mt-0.5 w-5 h-5 border-2 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
        />
        <span className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
          <Link href="/terms" target="_blank" className="text-blue-600 font-bold hover:underline">
            Mesafeli Satış Sözleşmesi
          </Link>
          &apos;ni ve ön bilgilendirme formunu okudum, onaylıyorum.
        </span>
      </label>

      {/* SİPARİŞİ TAMAMLA BUTONU (DESKTOP) */}
      <button
        type="submit"
        form="checkout-form"
        disabled={isSubmitting || !isAgreed || !selectedAddressId}
        className={`hidden sm:flex w-full font-black text-base py-4 rounded-2xl transition-all shadow-md items-center justify-center gap-2 min-h-[48px] ${
          isSubmitting || !isAgreed || !selectedAddressId
            ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
            : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
        }`}
      >
        {isSubmitting ? "İşleniyor..." : "Siparişi Tamamla ➔"}
      </button>

      {/* UYARI BİLGİSİ */}
      {!selectedAddressId && (
        <p className="text-[11px] text-red-500 font-bold text-center">⚠️ Lütfen devam etmek için teslimat adresi seçiniz.</p>
      )}
    </div>
  );
}