"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface CouponSuggestionBarProps {
  onApplyCoupon: (code: string, discountAmount: number) => void;
  cartTotal: number;
}

export default function CouponSuggestionBar({ onApplyCoupon, cartTotal }: CouponSuggestionBarProps) {
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const availableCoupons = [
    { code: "FIRSAT100", title: "100 ₺ Hoş Geldin İndirimi", minTotal: 1000, discount: 100 },
    { code: "TEKNO15", title: "%15 Teknoloji Sepet İndirimi", minTotal: 3000, discount: Math.round(cartTotal * 0.15) },
  ];

  const handleApply = (code: string, discount: number, minTotal: number) => {
    if (cartTotal < minTotal) {
      toast.error(`Bu kupon minimum ${minTotal.toLocaleString("tr-TR")} ₺ üzeri sepetlerde geçerlidir.`);
      return;
    }
    setAppliedCoupon(code);
    onApplyCoupon(code, discount);
    toast.success(`"${code}" kuponu başarıyla uygulandı! 🎉 (-${discount.toLocaleString("tr-TR")} ₺)`);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-5 rounded-2xl border border-blue-200 shadow-2xs space-y-3 text-left">
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-blue-900 text-xs sm:text-sm flex items-center gap-1.5">
          <span>🎟️</span> Size Özel Kullanılabilir Kuponlar
        </span>
        {appliedCoupon && (
          <span className="bg-green-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full animate-bounce">
            Uygulandı: {appliedCoupon}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {availableCoupons.map((c) => (
          <div
            key={c.code}
            className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-100 shadow-2xs"
          >
            <div>
              <span className="font-black text-blue-600 text-xs block">{c.code}</span>
              <span className="text-[11px] text-gray-600 font-bold block">{c.title}</span>
            </div>

            <button
              onClick={() => handleApply(c.code, c.discount, c.minTotal)}
              disabled={appliedCoupon === c.code}
              className={`text-xs font-black px-3 py-1.5 rounded-xl transition ${
                appliedCoupon === c.code
                  ? "bg-green-100 text-green-700 cursor-default"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              }`}
            >
              {appliedCoupon === c.code ? "✓ Uygulandı" : "Tek Tıkla Uygula"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
