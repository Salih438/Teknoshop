// components/admin/orders/OrderStatusSelect.tsx
"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ALLOWED_STATUS_TRANSITIONS, OrderStatusKey } from "@/lib/constants/order-status";

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "⏳ Bekliyor",
  PROCESSING: "⚙️ Hazırlanıyor",
  SHIPPED: "🚚 Kargoya Verildi",
  DELIVERED: "✅ Teslim Edildi",
  CANCELLED: "❌ İptal Edildi",
};

export default function OrderStatusSelect({ orderId, currentStatus }: OrderStatusSelectProps) {
  const router = useRouter();

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;

    const toastId = toast.loading("Durum güncelleniyor...");

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Sipariş durumu başarıyla değiştirildi!", { id: toastId });
        router.refresh();
      } else {
        toast.error(data.error || "Güncelleme başarısız oldu.", { id: toastId });
      }
    } catch (_error) {
      toast.error("Sunucu hatası.", { id: toastId });
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-orange-50 text-orange-700 border-orange-200",
    PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",
    SHIPPED: "bg-blue-50 text-blue-700 border-blue-200",
    DELIVERED: "bg-green-50 text-green-700 border-green-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
  };

  const currentColorClass = statusColors[currentStatus] || "bg-gray-50 text-gray-700 border-gray-200";

  // Re-use state machine rules: filter to current status + allowed next states
  const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus as OrderStatusKey] || [];
  const validOptionKeys = Array.from(new Set([currentStatus, ...allowedNext]));

  return (
    <select
      value={currentStatus}
      onChange={handleStatusChange}
      className={`px-3 py-1.5 rounded-full text-xs font-bold border outline-none cursor-pointer transition ${currentColorClass}`}
    >
      {validOptionKeys.map((key) => (
        <option key={key} value={key}>
          {STATUS_LABELS[key] || key}
        </option>
      ))}
    </select>
  );
}
