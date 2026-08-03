"use client";

import { useState, useEffect } from "react";

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        try {
          const isDismissed = sessionStorage.getItem("vitrin_hide_announcement");
          if (isDismissed) {
            setIsVisible(false);
          }
        } catch {
          // sessionStorage read error
        }
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem("vitrin_hide_announcement", "true");
    } catch {}
  };

  if (!isVisible) return null;

  return (
    <div className="bg-slate-900 text-white text-xs font-medium py-2 px-4 relative flex items-center justify-between z-50 border-b border-slate-800 animate-in fade-in duration-200">
      <div className="flex-1 text-center truncate pr-6">
        <span>🚚 <strong className="font-extrabold text-blue-400">5.000 ₺</strong> Üzeri Siparişlerde Kargo Bedava!</span>
        <span className="mx-2 text-slate-600 hidden sm:inline">|</span>
        <span className="hidden sm:inline">İlk Alışverişe Özel %10 İndirim Kodu: <strong className="bg-blue-600/60 text-blue-200 px-1.5 py-0.5 rounded font-black tracking-wider border border-blue-400/30">TEKNO10</strong></span>
      </div>

      <button
        onClick={handleDismiss}
        aria-label="Kapat"
        title="Duyuruyu Kapat"
        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer flex-shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
