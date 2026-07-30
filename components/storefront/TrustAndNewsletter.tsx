"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function TrustAndNewsletter() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Lütfen geçerli bir e-posta adresi giriniz.");
      return;
    }
    toast.success("E-bülten kaydınız alındı! %10 İndirim Kuponunuz E-posta adresinize gönderildi. 🎉");
    setEmail("");
  };

  return (
    <div className="space-y-12 sm:space-y-16 w-full my-12 sm:my-20">
      
      {/* 🚀 1. GÜVEN VE İSTATİSTİK BÖLÜMÜ (TRUST SECTION) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <span className="text-2xl sm:text-4xl font-black text-blue-400">100.000+</span>
            <p className="text-gray-300 text-xs sm:text-sm font-bold">Mutlu Müşteri</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-4xl font-black text-emerald-400">500+</span>
            <p className="text-gray-300 text-xs sm:text-sm font-bold">Orijinal Marka</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-4xl font-black text-amber-400">4.9 / 5</span>
            <p className="text-gray-300 text-xs sm:text-sm font-bold">Müşteri Memnuniyeti</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-4xl font-black text-purple-400">256-Bit</span>
            <p className="text-gray-300 text-xs sm:text-sm font-bold">SSL Güvenli Ödeme</p>
          </div>
        </div>
      </section>

      {/* 🚀 2. PREMIUM NEWSLETTER E-BÜLTEN KARTI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          
          <div className="space-y-2 text-center lg:text-left max-w-xl">
            <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/30">
              🎁 ÖZEL FIRSATLARDAN HABERDAR OLUN
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              E-Bültene Abone Olun, %10 İndirim Kazanın!
            </h3>
            <p className="text-blue-100 text-xs sm:text-sm font-medium">
              En yeni Apple ve teknoloji fırsatlarını kaçırmamak için hemen e-postanızla kaydolun.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresiniz..."
              className="px-5 py-3.5 rounded-2xl text-gray-900 text-xs sm:text-sm font-bold outline-none focus:ring-4 focus:ring-white/40 flex-1 min-h-[44px]"
            />
            <button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-md min-h-[44px]"
            >
              Abone Ol &rarr;
            </button>
          </form>

        </div>
      </section>

    </div>
  );
}
