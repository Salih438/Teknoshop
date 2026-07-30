"use client";

import { OrderStatus } from "@prisma/client";

interface OrderTimelineProps {
  status: OrderStatus;
  createdAt: string | Date;
}

export default function OrderTimeline({ status, createdAt }: OrderTimelineProps) {
  const steps = [
    { key: "PENDING", label: "Sipariş Alındı", icon: "🛒" },
    { key: "PROCESSING", label: "Hazırlanıyor", icon: "⚙️" },
    { key: "SHIPPED", label: "Kargoya Verildi", icon: "🚚" },
    { key: "DELIVERED", label: "Teslim Edildi", icon: "✅" },
  ];

  const statusWeights: Record<OrderStatus, number> = {
    PENDING: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    DELIVERED: 4,
    CANCELLED: 0,
  };

  const currentWeight = statusWeights[status] || 1;
  const isCancelled = status === "CANCELLED";

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 sm:p-5 rounded-3xl text-left space-y-2">
        <div className="flex items-center gap-2 text-red-700 font-black text-sm">
          <span>❌</span>
          <span>Sipariş İptal Edildi</span>
        </div>
        <p className="text-xs text-red-600 font-medium">
          Bu sipariş iptal edilmiştir. İade tutarı ödeme yönteminize bağlı olarak 1-3 iş günü içinde yansıyacaktır.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 text-left">
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <h3 className="font-black text-gray-900 text-sm sm:text-base flex items-center gap-2">
          <span>📦</span> Sipariş & Kargo Zaman Çizelgesi
        </h3>
        <span className="text-xs font-bold text-gray-500">
          Sipariş Tarihi: {new Date(createdAt).toLocaleDateString("tr-TR")}
        </span>
      </div>

      {/* 🚀 RESPONSIVE TIMELINE STEPPER */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-0 max-w-2xl mx-auto py-2">
        
        {/* ARKA PLAN ÇİZGİSİ (DESKTOP) */}
        <div className="hidden sm:block absolute top-1/2 left-8 right-8 h-1 bg-gray-200 -translate-y-1/2 z-0" />
        <div
          className="hidden sm:block absolute top-1/2 left-8 h-1 bg-green-500 -translate-y-1/2 transition-all duration-500 z-0"
          style={{ width: `${Math.max(0, ((currentWeight - 1) / 3) * 82)}%` }}
        />

        {steps.map((step, idx) => {
          const stepWeight = idx + 1;
          const isCompleted = currentWeight >= stepWeight;
          const isCurrent = currentWeight === stepWeight;

          return (
            <div key={step.key} className="relative z-10 flex sm:flex-col items-center gap-3 sm:gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${
                  isCompleted
                    ? "bg-green-600 text-white shadow-md ring-4 ring-green-100"
                    : "bg-gray-100 text-gray-400 border border-gray-200"
                } ${isCurrent ? "scale-110 animate-pulse" : ""}`}
              >
                {step.icon}
              </div>

              <div className="text-left sm:text-center">
                <span className={`text-xs block font-bold ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="text-[10px] text-blue-600 font-extrabold block">Aktif Aşama</span>
                )}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
