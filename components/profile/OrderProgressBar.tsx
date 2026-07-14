"use client";

export default function OrderProgressBar({ status }: { status: string }) {
  // Durumlara göre hangi adımda olduğumuzu belirliyoruz
  const stages = [
    { id: "PENDING", label: "Alındı" },
    { id: "PROCESSING", label: "Hazırlanıyor" },
    { id: "SHIPPED", label: "Kargoda" },
    { id: "DELIVERED", label: "Teslim Edildi" }
  ];

  let currentIndex = stages.findIndex(s => s.id === status);
  
  // Eğer sipariş iptal edilmişse farklı bir tasarım göster
  if (status === "CANCELLED") {
    return (
      <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-center gap-2 text-red-600 font-bold">
        <span>❌</span> Bu sipariş iptal edilmiştir.
      </div>
    );
  }

  // Fallback (Bilinmeyen bir durum gelirse Alındı varsay)
  if (currentIndex === -1) currentIndex = 0;

  return (
    <div className="mt-6">
      <div className="relative flex justify-between items-center w-full">
        {/* Arka plan gri çizgi */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
        
        {/* Doldurulan mavi çizgi */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-500 ease-in-out"
          style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
        ></div>

        {/* Adım Noktaları ve İsimleri */}
        {stages.map((stage, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isCompleted ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
                } ${isCurrent ? "ring-4 ring-blue-100" : ""}`}
              >
                {isCompleted && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`mt-2 text-xs font-bold absolute top-8 whitespace-nowrap ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-8"></div> {/* Yazıların taşmaması için boşluk */}
    </div>
  );
}