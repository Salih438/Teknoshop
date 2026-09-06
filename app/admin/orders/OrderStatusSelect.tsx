// app/admin/orders/OrderStatusSelect.tsx
"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: string;
}

export default function OrderStatusSelect({ orderId, currentStatus }: OrderStatusSelectProps) {
  const router = useRouter();

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    const toastId = toast.loading("Durum güncelleniyor...");

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH", // HATA BURADAYDI: PUT yerine PATCH yapıldı!
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success("Sipariş durumu başarıyla değiştirildi!", { id: toastId });
        router.refresh(); 
      } else {
        toast.error("Güncelleme başarısız oldu.", { id: toastId });
      }
    } catch {
      toast.error("Sunucu hatası.", { id: toastId });
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-900 border-amber-300",
    PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200", // Hazırlanıyor eklendi
    SHIPPED: "bg-blue-50 text-blue-700 border-blue-200",
    DELIVERED: "bg-emerald-100 text-emerald-900 border-emerald-300",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
  };

  const currentColorClass = statusColors[currentStatus] || "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <select 
      value={currentStatus} 
      onChange={handleStatusChange}
      className={`px-3 py-1.5 rounded-full text-xs font-bold border outline-none cursor-pointer transition ${currentColorClass}`}
    >
      <option value="PENDING">⏳ Bekliyor</option>
      <option value="PROCESSING">⚙️ Hazırlanıyor</option>
      <option value="SHIPPED">🚚 Kargoya Verildi</option>
      <option value="DELIVERED">✅ Teslim Edildi</option>
      <option value="CANCELLED">❌ İptal Edildi</option>
    </select>
  );
}