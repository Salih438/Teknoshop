"use client";

import { OrderStatus } from "@prisma/client";

interface OrderTimelineProps {
  status: OrderStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const TIMELINE_STEPS = [
  {
    key: "PENDING",
    label: "Sipariş Alındı",
    description: "Siparişiniz sisteme ulaştı",
    icon: "📝",
  },
  {
    key: "PROCESSING",
    label: "Hazırlanıyor",
    description: "Ürünleriniz paketleniyor",
    icon: "📦",
  },
  {
    key: "SHIPPED",
    label: "Kargoya Verildi",
    description: "Kargo firmasına teslim edildi",
    icon: "🚚",
  },
  {
    key: "DELIVERED",
    label: "Teslim Edildi",
    description: "Teslimat tamamlandı",
    icon: "✅",
  },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  PENDING: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
};

export default function OrderTimeline({ status, createdAt, updatedAt }: OrderTimelineProps) {
  // İPTAL EDİLMİŞ SİPARİŞ KARTI
  if (status === "CANCELLED") {
    return (
      <div className="bg-red-50/80 border-2 border-red-200 p-5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-2">
        <div className="flex items-center gap-3 text-red-700">
          <span className="text-2xl sm:text-3xl">🚫</span>
          <div>
            <h4 className="font-extrabold text-base sm:text-lg">Sipariş İptal Edildi</h4>
            <p className="text-xs sm:text-sm text-red-600 font-medium">
              Bu sipariş iptal edilmiştir. Ürün stokları otomatik olarak mağazamıza iade edilmiştir.
            </p>
          </div>
        </div>
        <p className="text-[11px] text-red-400 font-mono pt-2 border-t border-red-100">
          İptal Tarihi: {new Date(updatedAt).toLocaleDateString("tr-TR")} • {new Date(updatedAt).toLocaleTimeString("tr-TR")}
        </p>
      </div>
    );
  }

  const currentStep = STATUS_ORDER[status] || 1;

  return (
    <div className="space-y-6">
      
      {/* 🚀 MASAÜSTÜ YATAY STEPPER (lg:flex) */}
      <div className="hidden lg:block">
        <div className="relative flex items-center justify-between">
          
          {/* Arka Plan İlerleme Çizgisi */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 z-0 transition-all duration-500"
            style={{
              width: `${Math.min(((currentStep - 1) / (TIMELINE_STEPS.length - 1)) * 100, 100)}%`,
            }}
          />

          {/* Adım İkonları ve Metinleri */}
          {TIMELINE_STEPS.map((step, idx) => {
            const stepNumber = idx + 1;
            const isPassed = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center group">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg transition-all duration-300 shadow-sm border-2 ${
                    isPassed
                      ? "bg-blue-600 border-blue-600 text-white"
                      : isCurrent
                      ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-500/20 animate-pulse"
                      : "bg-white border-gray-200 text-gray-400"
                  }`}
                >
                  {isPassed ? "✓" : step.icon}
                </div>

                <div className="text-center mt-3 max-w-[140px]">
                  <p
                    className={`font-extrabold text-xs sm:text-sm ${
                      isCurrent || isPassed ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5 leading-tight">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* 🚀 MOBİL DİKEY STEPPER (lg:hidden) */}
      <div className="lg:hidden space-y-4">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
          {TIMELINE_STEPS.map((step, idx) => {
            const stepNumber = idx + 1;
            const isPassed = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div key={step.key} className="relative flex items-start gap-3.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs border-2 absolute -left-6 top-0.5 bg-white ${
                    isPassed
                      ? "bg-blue-600 border-blue-600 text-white"
                      : isCurrent
                      ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-500/20 animate-pulse"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {isPassed ? "✓" : stepNumber}
                </div>

                <div className="pl-3">
                  <p
                    className={`font-extrabold text-xs sm:text-sm flex items-center gap-1.5 ${
                      isCurrent || isPassed ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    <span>{step.icon}</span>
                    <span>{step.label}</span>
                    {isCurrent && (
                      <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.5 rounded uppercase">
                        Mevcut Aşama
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
