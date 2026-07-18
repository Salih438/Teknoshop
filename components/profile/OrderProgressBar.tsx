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
  
  // Eğer sipariş iptal edilmişse özel tasarım
  if (status === "CANCELLED") {
    return (
      <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start sm:items-center gap-3 text-red-700 animate-in fade-in duration-300">
        <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <p className="font-bold">Sipariş İptal Edildi</p>
          <p className="text-sm text-red-600/80 mt-0.5">Bu sipariş iptal edilmiştir ve gönderimi yapılmayacaktır.</p>
        </div>
      </div>
    );
  }

  // Fallback (Bilinmeyen bir durum gelirse Alındı varsay)
  if (currentIndex === -1) currentIndex = 0;

  return (
    <div className="mt-8 px-2 sm:px-6 mb-2">
      <div className="relative flex justify-between items-center w-full">
        
        {/* Arka plan gri çizgi */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-100 rounded-full z-0"></div>
        
        {/* Doldurulan mavi çizgi */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-blue-600 rounded-full z-0 transition-all duration-700 ease-out"
          style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
        ></div>

        {/* Adım Noktaları ve İsimleri */}
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center group">
              
              {/* Yuvarlak Nokta */}
              <div 
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
                  isCompleted 
                    ? "bg-blue-600 border-white shadow-md" 
                    : isCurrent 
                      ? "bg-white border-blue-600 shadow-md ring-4 ring-blue-50" 
                      : "bg-white border-gray-200"
                }`}
              >
                {isCompleted && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-in zoom-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isCurrent && (
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-600 rounded-full animate-pulse"></div>
                )}
              </div>
              
              {/* Metin Etiketi */}
              <span className={`mt-3 text-[10px] sm:text-xs font-bold absolute top-10 whitespace-nowrap transition-colors duration-300 ${
                isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"
              }`}>
                {stage.label}
              </span>
              
            </div>
          );
        })}
      </div>
      <div className="h-10"></div> {/* Yazıların taşmaması için esnek boşluk */}
    </div>
  );
}