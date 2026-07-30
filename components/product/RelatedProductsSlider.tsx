"use client";

import { useRef } from "react";
import ProductCard, { ProductCardProps } from "@/components/ProductCard";

export default function RelatedProductsSlider({ products }: { products: ProductCardProps[] }) {
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
    <section className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-200 shadow-2xs space-y-6 my-8 text-left relative group">
      {/* BAŞLIK VE OK BUTONLARI */}
      <div className="flex justify-between items-end border-b border-gray-100 pb-4">
        <div>
          <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
            ✨ İLGİNİZİ ÇEKEBİLİR
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1">Benzer Ürünler</h3>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            Bu ürünü inceleyen kullanıcıların ilgisini çekebilecek alternatif teknoloji ürünleri.
          </p>
        </div>

        {/* OK BUTONLARI */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={scrollLeft}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-600 transition flex items-center justify-center font-black shadow-2xs"
            aria-label="Önceki"
          >
            ←
          </button>
          <button
            onClick={scrollRight}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-600 transition flex items-center justify-center font-black shadow-2xs"
            aria-label="Sonraki"
          >
            →
          </button>
        </div>
      </div>

      {/* KAYAR LİSTE (RESPONSIVE SLIDER) */}
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
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
