"use client";

import toast from "react-hot-toast";

interface ShipmentTrackingCardProps {
  company?: string | null;
  trackingNumber?: string | null;
}

export default function ShipmentTrackingCard({ company, trackingNumber }: ShipmentTrackingCardProps) {
  const shippingCompany = company || "Yurtiçi Kargo";

  const handleTrack = () => {
    if (!trackingNumber) {
      toast.error("Kargo takip numarası henüz tanımlanmamıştır.");
      return;
    }
    toast.success("Kargo firması sayfasına yönlendiriliyorsunuz...");
    window.open(`https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgulama?code=${trackingNumber}`, "_blank");
  };

  return (
    <div className="bg-gradient-to-r from-gray-900 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚚</span>
          <h4 className="font-extrabold text-sm sm:text-base text-white">{shippingCompany} Lojistik</h4>
        </div>
        <p className="text-xs text-gray-300 font-mono">
          Takip No: <strong className="text-white">{trackingNumber || "Hazırlanıyor..."}</strong>
        </p>
      </div>

      <button
        onClick={handleTrack}
        disabled={!trackingNumber}
        className={`px-5 py-3 rounded-2xl text-xs font-black transition-all shadow-md min-h-[44px] ${
          trackingNumber
            ? "bg-blue-600 hover:bg-blue-500 text-white"
            : "bg-gray-800 text-gray-500 cursor-not-allowed"
        }`}
      >
        <span>Kargomu Takip Et ➔</span>
      </button>
    </div>
  );
}
