"use client";

import { useRef } from "react";
import ProductCard, { ProductCardProps } from "@/components/ProductCard";

interface PersonalizedSectionProps {
  products: ProductCardProps[];
  title?: string;
  subtitle?: string;
}

export default function PersonalizedSection({
  products,
  title = "Sizin İçin Seçtiklerimiz ✨",
  subtitle = "Alışveriş tercihlerinize ve ilgi alanlarınıza özel hazırlanan fırsat ürünleri.",
}: PersonalizedSectionProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 rounded-3xl mb-10 sm:mb-16 border border-indigo-100/80 shadow-2xs relative group text-left">
      
      {/* BAŞLIK VE OK BUTONLARI */}
      <div className="flex justify-between items-end border-b border-indigo-100/80 pb-4 mb-6">
        <div>
          <span className="bg-indigo-100 text-indigo-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-indigo-200">
            🤖 AI KİŞİSELLEŞTİRİLMİŞ ÖNERİLER
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">{title}</h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">{subtitle}</p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={scrollLeft}
            className="w-10 h-10 rounded-full bg-white hover:bg-indigo-600 hover:text-white text-gray-600 transition flex items-center justify-center font-black shadow-2xs border border-gray-200"
            aria-label="Önceki"
          >
            ←
          </button>
          <button
            onClick={scrollRight}
            className="w-10 h-10 rounded-full bg-white hover:bg-indigo-600 hover:text-white text-gray-600 transition flex items-center justify-center font-black shadow-2xs border border-gray-200"
            aria-label="Sonraki"
          >
            →
          </button>
        </div>
      </div>

      {/* KAYAR ÜRÜN LİSTESİ */}
      <div
        ref={sliderRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory py-2 custom-scrollbar hide-scrollbar-on-mobile -mx-2 px-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="snap-start shrink-0 w-[82vw] sm:w-[260px] md:w-[280px] lg:w-[270px] text-gray-900"
          >
            <ProductCard product={{ ...product, badgeText: "🤖 Sana Özel" }} />
          </div>
        ))}
      </div>
    </section>
  );
}
