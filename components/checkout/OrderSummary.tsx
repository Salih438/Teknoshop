"use client";

import Link from "next/link";

interface OrderSummaryProps {
  items: any[];
  subTotal: number;
  shippingCost: number;
  discount: number;
  finalTotal: number;
  couponCode: string;
  setCouponCode: (code: string) => void;
  applyCoupon: () => void;
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
  isAgreed,
  setIsAgreed,
  isSubmitting,
  selectedAddressId,
}: OrderSummaryProps) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
      <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4 flex items-center gap-2">
        <span className="text-2xl">📦</span> Sipariş Özeti
      </h2>
      
      {/* Ürün Listesi */}
      <div className="space-y-4 mb-6 border-b border-gray-100 pb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-start text-sm">
            <span className="text-gray-700 font-medium max-w-[180px] leading-snug">
              {item.name} <span className="text-gray-400 block mt-1">Adet: {item.quantity}</span>
            </span>
            <span className="font-bold text-gray-900 whitespace-nowrap">
              {(item.price * item.quantity).toLocaleString('tr-TR')} TL
            </span>
          </div>
        ))}
      </div>

      {/* Kupon Kodu Alanı */}
      <div className="mb-6 flex gap-2">
        <input 
          type="text" 
          value={couponCode} 
          onChange={(e) => setCouponCode(e.target.value)} 
          placeholder="Kupon Kodu (Örn: YAZ2026)" 
          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase" 
        />
        <button 
          type="button" 
          onClick={applyCoupon} 
          className="bg-gray-900 text-white px-4 rounded-lg text-sm font-bold hover:bg-blue-600 transition"
        >
          Uygula
        </button>
      </div>
      
      {/* Fiyat Dağılımı */}
      <div className="space-y-3 mb-6 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Ara Toplam</span>
          <span className="font-bold text-gray-900">{subTotal.toLocaleString('tr-TR')} TL</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>İndirim (%10)</span>
            <span className="font-bold">-{discount.toLocaleString('tr-TR')} TL</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Kargo</span>
          {shippingCost === 0 ? (
            <span className="text-green-600 font-bold">Ücretsiz</span>
          ) : (
            <span className="font-bold text-gray-900">{shippingCost.toLocaleString('tr-TR')} TL</span>
          )}
        </div>
      </div>
      
      {/* Genel Toplam */}
      <div className="flex justify-between items-center font-extrabold text-2xl mt-4 pt-6 border-t border-gray-200 mb-8">
        <span className="text-black">Toplam</span>
        <span className="text-blue-600">{finalTotal.toLocaleString('tr-TR')} TL</span>
      </div>

      {/* Sözleşme Onayı */}
      <label className="flex items-start gap-3 cursor-pointer mb-6 group">
        <input 
          type="checkbox" 
          checked={isAgreed} 
          onChange={(e) => setIsAgreed(e.target.checked)} 
          className="mt-1 w-5 h-5 border-2 border-gray-300 rounded text-blue-600 cursor-pointer" 
        />
        <span className="text-sm text-gray-600 select-none">
          <Link href="#" className="text-blue-600 font-bold hover:underline">Mesafeli Satış Sözleşmesi</Link>'ni okudum ve onaylıyorum.
        </span>
      </label>

      {/* Siparişi Tamamla Butonu */}
      <button 
        type="submit" 
        form="checkout-form" 
        disabled={isSubmitting || !isAgreed || !selectedAddressId}
        className={`w-full font-bold text-lg py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
          isSubmitting || !isAgreed || !selectedAddressId 
            ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
            : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
        }`}
      >
        {isSubmitting ? "İşleniyor..." : "Siparişi Tamamla"}
      </button>
    </div>
  );
}