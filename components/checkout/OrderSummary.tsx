"use client";

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
  return (
    <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 sticky top-28">
      <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
        📦 Sipariş Özeti
      </h2>
      
      {/* ÜRÜN LİSTESİ */}
      <div className="space-y-4 mb-6 border-b border-gray-100 pb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-start text-sm">
            <span className="text-gray-700 font-medium max-w-[180px] leading-snug">
              {item.name} 
              <span className="block text-xs text-gray-400 mt-0.5">Adet: {item.quantity}</span>
            </span>
            <span className="font-bold text-gray-900">
              {(item.price * item.quantity).toLocaleString('tr-TR')} TL
            </span>
          </div>
        ))}
      </div>

      {/* KUPON KODU ALANI */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">İndirim Kuponu</label>
        
        {discount > 0 ? (
          // 🚀 DÜZELTME BURADA: relative z-10 eklendi ve onClick event korumaya alındı
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-3 relative">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-extrabold text-emerald-800 uppercase tracking-wider">{couponCode}</span>
            </div>
            <button 
              type="button" 
              onClick={(e) => {
                e.preventDefault(); // Sayfa yenilemesini veya form tetiklemesini engeller
                e.stopPropagation(); // Tıklamanın kaybolmasını engeller
                removeCoupon(); // Asıl fonksiyonumuzu çalıştırır
              }}
              className="relative z-10 cursor-pointer text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all"
            >
              Kaldır
            </button>
          </div>
        ) : (
          // KUPON GİRİŞ DURUMU (Standart Input)
          <div className="flex gap-2">
            <input 
              type="text" 
              value={couponCode} 
              onChange={(e) => setCouponCode(e.target.value)} 
              placeholder="KOD GIR" 
              className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-bold" 
            />
            <button 
              type="button" 
              onClick={applyCoupon} 
              className="bg-gray-900 text-white px-5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all"
            >
              Uygula
            </button>
          </div>
        )}
      </div>
      
      {/* FİYAT DAĞILIMI */}
      <div className="space-y-3 mb-6 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Ara Toplam</span>
          <span className="font-bold text-gray-900">{subTotal.toLocaleString('tr-TR')} TL</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>İndirim Kazancı</span>
            <span className="font-bold">-{discount.toLocaleString('tr-TR')} TL</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Kargo</span>
          {shippingCost === 0 ? (
            <span className="text-emerald-600 font-bold">Ücretsiz</span>
          ) : (
            <span className="font-bold text-gray-900">{shippingCost.toLocaleString('tr-TR')} TL</span>
          )}
        </div>
      </div>
      
      {/* GENEL TOPLAM */}
      <div className="flex justify-between items-center font-extrabold text-2xl mt-4 pt-6 border-t border-gray-100 mb-8">
        <span className="text-black">Toplam</span>
        <span className="text-blue-600">{finalTotal.toLocaleString('tr-TR')} TL</span>
      </div>

      {/* SÖZLEŞME ONAYI */}
      <label className="flex items-start gap-3 cursor-pointer mb-6 group">
        <input 
          type="checkbox" 
          checked={isAgreed} 
          onChange={(e) => setIsAgreed(e.target.checked)} 
          className="mt-1 w-5 h-5 border-2 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" 
        />
        <span className="text-xs text-gray-500 leading-relaxed">
          <Link href="#" className="text-blue-600 font-bold hover:underline">Mesafeli Satış Sözleşmesi</Link>&apos;ni okudum, onaylıyorum ve ön bilgilendirme formunu kabul ediyorum.
        </span>
      </label>

      {/* SİPARİŞİ TAMAMLA BUTONU */}
      <button 
        type="submit" 
        form="checkout-form" 
        disabled={isSubmitting || !isAgreed || !selectedAddressId}
        className={`w-full font-extrabold text-lg py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
          isSubmitting || !isAgreed || !selectedAddressId 
            ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
            : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
        }`}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            İşleniyor...
          </>
        ) : (
          "Siparişi Tamamla"
        )}
      </button>
    </div>
  );
}