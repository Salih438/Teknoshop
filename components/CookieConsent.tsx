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
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      <div className="bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/90 shadow-2xl space-y-4 text-left">
        {/* Üst Başlık & İkon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg flex-shrink-0">
              🍪
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 leading-tight">
                Çerez ve Gizlilik Tercihleriniz
              </h3>
              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                KVKK & GDPR UYUMLU
              </span>
            </div>
          </div>
        </div>

        {/* Açıklama Metni */}
        <p className="text-xs text-gray-600 leading-relaxed">
          Teknoshop olarak, alışveriş deneyiminizi optimize etmek, sepetinizi hatırlamak ve güvenliğinizi sağlamak amacıyla zorunlu ve analitik çerezler kullanmaktayız. Detaylı bilgi için{" "}
          <Link
            href="/privacy-policy"
            className="text-blue-600 font-bold hover:underline"
            target="_blank"
          >
            Gizlilik Politikamızı
          </Link>{" "}
          inceleyebilirsiniz.
        </p>

        {/* Detay Bilgilendirme Akordiyonu */}
        {isDetailsOpen && (
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-600 space-y-2 animate-in fade-in duration-200">
            <div>
              <strong className="text-gray-900 block">🔒 Zorunlu Çerezler:</strong>
              Oturum açma, sepet yönetimi ve güvenlik doğrulamaları için elzemdir. Devre dışı bırakılamaz.
            </div>
            <div>
              <strong className="text-gray-900 block">📊 Analitik Çerezler:</strong>
              Site performansını ve kullanıcı deneyimini geliştirmek için anonim veriler toplar.
            </div>
          </div>
        )}

        {/* Detay Göster / Gizle Butonu */}
        <button
          type="button"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="text-[11px] font-bold text-gray-500 hover:text-gray-800 transition flex items-center gap-1"
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
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={handleAcceptEssential}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-3 rounded-xl text-xs transition border border-gray-200 min-h-[40px] order-2 sm:order-1"
          >
            Yalnızca Gerekli Olanlar
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs transition shadow-md shadow-blue-600/20 min-h-[40px] order-1 sm:order-2"
          >
            Tümünü Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
