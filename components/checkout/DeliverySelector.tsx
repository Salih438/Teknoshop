"use client";

import { useState } from "react";

export interface DeliveryOption {
  id: string;
  name: string;
  description: string;
  estimatedDate: string;
  fee: number;
  icon: string;
}

interface DeliverySelectorProps {
  onSelectDelivery?: (option: DeliveryOption) => void;
  isFreeShipping?: boolean;
}

export default function DeliverySelector({ onSelectDelivery, isFreeShipping }: DeliverySelectorProps) {
  const options: DeliveryOption[] = [
    {
      id: "standard",
      name: "Standart Kargo (Yurtiçi / Aras)",
      description: "Siparişiniz hazırlanıp kargo firmasına teslim edilir.",
      estimatedDate: "Yarın Kargoda (1-2 İş Günü)",
      fee: isFreeShipping ? 0 : 149.99,
      icon: "🚚",
    },
    {
      id: "express",
      name: "Hızlı Kurye (Aynı Gün Teslimat)",
      description: "Saat 14:00'e kadar verilen siparişlerde aynı gün adrese teslim.",
      estimatedDate: "Bugün 18:00 - 22:00 Arası",
      fee: 99.0,
      icon: "⚡",
    },
    {
      id: "store_pickup",
      name: "Mağazadan Teslim Al (Tıkla & Gel)",
      description: "En yakın Vitrin Mağazasından randevusuz teslim alabilirsiniz.",
      estimatedDate: "2 Saat İçinde Hazır",
      fee: 0,
      icon: "🏪",
    },
  ];

  const [selectedId, setSelectedId] = useState("standard");

  const handleSelect = (opt: DeliveryOption) => {
    setSelectedId(opt.id);
    if (onSelectDelivery) onSelectDelivery(opt);
  };

  return (
    <div className="bg-white p-5 sm:p-8 rounded-3xl border border-gray-200 shadow-xs mb-6 sm:mb-8 text-left space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
          <span>📦</span> Teslimat Yöntemi ve Süresi
        </h2>
        <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
          ⚡ Hızlı Kargo Garantisi
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => handleSelect(opt)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 ${
                isSelected
                  ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20 shadow-xs"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xl">{opt.icon}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${opt.fee === 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-800"}`}>
                    {opt.fee === 0 ? "ÜCRETSIZ" : `+${opt.fee.toLocaleString("tr-TR")} ₺`}
                  </span>
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-gray-900">{opt.name}</h4>
                <p className="text-[11px] text-gray-500 font-medium line-clamp-2">{opt.description}</p>
              </div>

              <div className="pt-2 border-t border-gray-100/80">
                <span className="text-[10px] text-blue-600 font-extrabold block">
                  📅 {opt.estimatedDate}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
