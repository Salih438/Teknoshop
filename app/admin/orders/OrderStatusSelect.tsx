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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success("Sipariş durumu başarıyla değiştirildi!", { id: toastId });
        router.refresh(); // Tabloyu güncelle
      } else {
        toast.error("Güncelleme başarısız oldu.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası.", { id: toastId });
    }
  }

  // Duruma göre renkleri ayarlayan küçük bir stil hilesi
  const statusColors: Record<string, string> = {
    PENDING: "bg-orange-50 text-orange-700 border-orange-200",
    SHIPPED: "bg-blue-50 text-blue-700 border-blue-200",
    DELIVERED: "bg-green-50 text-green-700 border-green-200",
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
      <option value="SHIPPED">🚚 Kargoya Verildi</option>
      <option value="DELIVERED">✅ Teslim Edildi</option>
      <option value="CANCELLED">❌ İptal Edildi</option>
    </select>
  );
}