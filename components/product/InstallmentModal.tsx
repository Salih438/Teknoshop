"use client";

import { useState } from "react";

export default function InstallmentModal({ price }: { price: number }) {
  const [isOpen, setIsOpen] = useState(false);

  const installmentOptions = [
    { count: 3, monthly: Math.round(price / 3), total: price },
    { count: 6, monthly: Math.round((price * 1.04) / 6), total: Math.round(price * 1.04) },
    { count: 9, monthly: Math.round((price * 1.07) / 9), total: Math.round(price * 1.07) },
    { count: 12, monthly: Math.round((price * 1.10) / 12), total: Math.round(price * 1.10) },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs font-extrabold text-blue-600 hover:underline flex items-center gap-1.5 min-h-[44px]"
      >
        <span>💳 Taksit Seçeneklerini İncele (3, 6, 9, 12 Taksit)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 text-left">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 space-y-4">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                <span>💳</span> Taksit Seçenekleri ve Oranları
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 font-medium">
              World, Bonus, Axess, Maximum ve Paraf kartlarına özel vade farksız ve avantajlı taksit imkanları.
            </p>

            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Taksit Sayısı</th>
                    <th className="p-3">Aylık Ödeme</th>
                    <th className="p-3 text-right">Toplam Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {installmentOptions.map((opt) => (
                    <tr key={opt.count} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-900">{opt.count} Taksit</td>
                      <td className="p-3 font-black text-blue-600">{opt.monthly.toLocaleString("tr-TR")} ₺ / ay</td>
                      <td className="p-3 text-right font-extrabold text-gray-800">{opt.total.toLocaleString("tr-TR")} ₺</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-2.5 rounded-xl text-xs transition"
              >
                Anlaşıldı
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
