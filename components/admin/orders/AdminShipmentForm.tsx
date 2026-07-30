"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface AdminShipmentFormProps {
  orderId: string;
  initialCompany?: string | null;
  initialTrackingNumber?: string | null;
}

export default function AdminShipmentForm({
  orderId,
  initialCompany,
  initialTrackingNumber,
}: AdminShipmentFormProps) {
  const router = useRouter();
  const [company, setCompany] = useState(initialCompany || "Yurtiçi Kargo");
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Kargo bilgileri güncelleniyor...");

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          trackingNumber,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Kargo bilgileri başarıyla güncellendi!", { id: toastId });
        router.refresh();
      } else {
        toast.error(data.error || "Kargo bilgisi güncellenemedi.", { id: toastId });
      }
    } catch {
      toast.error("Sunucu bağlantı hatası.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          Kargo Firması
        </label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Örn: Yurtiçi Kargo, Aras Kargo"
          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          Takip Numarası
        </label>
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Örn: 123456789012"
          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white transition flex items-center justify-center min-h-[40px] ${
          isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-xs"
        }`}
      >
        {isSubmitting ? "Kaydediliyor..." : "Kargo Bilgilerini Kaydet 💾"}
      </button>
    </form>
  );
}
