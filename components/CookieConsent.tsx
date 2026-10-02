"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "teknoshop_cookie_consent_choice";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already set cookie preference
    try {
      const savedChoice = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!savedChoice) {
        // Small delay for smooth entry animation
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage access issues (e.g. strict private mode)
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
        choice: "all",
        timestamp: new Date().toISOString(),
      }));
    } catch {}
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
        choice: "essential_only",
        timestamp: new Date().toISOString(),
      }));
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Çerez ve Gizlilik Bildirimi"
      className="fixed bottom-2 left-2 right-2 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      <div className="bg-white/95 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/90 shadow-2xl space-y-3 text-left">
        {/* Üst Başlık & İkon */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-base flex-shrink-0">
              🍪
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 leading-tight">
                Çerez ve Gizlilik Tercihleri
              </h3>
              <span className="text-[9px] uppercase font-bold text-blue-600 tracking-wider">
                KVKK & GDPR
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAcceptEssential}
            aria-label="Kapat ve yalnızca zorunlu çerezleri kabul et"
            title="Kapat"
            className="sm:hidden text-gray-400 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Açıklama Metni */}
        <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
          Alışveriş deneyiminizi iyileştirmek, sepetinizi korumak ve güvenliğinizi sağlamak amacıyla zorunlu ve analitik çerezler kullanmaktayız.{" "}
          <Link
            href="/privacy-policy"
            className="text-blue-600 font-bold hover:underline"
            target="_blank"
          >
            Gizlilik Politikası
          </Link>
        </p>

        {/* Detay Bilgilendirme Akordiyonu */}
        {isDetailsOpen && (
          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-[10px] sm:text-[11px] text-gray-600 space-y-1.5 animate-in fade-in duration-200">
            <div>
              <strong className="text-gray-900 block">🔒 Zorunlu Çerezler:</strong>
              Oturum açma ve sepet yönetimi için elzemdir.
            </div>
            <div>
              <strong className="text-gray-900 block">📊 Analitik Çerezler:</strong>
              Performans ve kullanıcı deneyimi geliştirmeleri için anonim veri toplar.
            </div>
          </div>
        )}

        {/* Detay Göster / Gizle Butonu */}
        <button
          type="button"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="text-[11px] font-bold text-gray-600 hover:text-gray-900 transition flex items-center gap-1 min-h-[32px]"
        >
          <span>{isDetailsOpen ? "Detayları Gizle" : "Çerez Detaylarını İncele"}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3 w-3 transition-transform ${isDetailsOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Aksiyon Butonları */}
        <div className="flex flex-row gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleAcceptEssential}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-3 rounded-xl text-xs transition border border-gray-200 min-h-[44px] flex items-center justify-center text-center cursor-pointer"
          >
            Gerekli Olanlar
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs transition shadow-md shadow-blue-600/20 min-h-[44px] flex items-center justify-center text-center cursor-pointer"
          >
            Tümünü Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
