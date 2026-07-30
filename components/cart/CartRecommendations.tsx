"use client";

import { useRef } from "react";
import ProductCard, { ProductCardProps } from "@/components/ProductCard";

export default function CartRecommendations({ products }: { products: ProductCardProps[] }) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-4 text-left my-8">
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <div>
          <span className="bg-blue-100 text-blue-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
            💡 SEPETİNİZE ÖZEL TAMAMLAYICILAR
          </span>
          <h3 className="text-lg sm:text-xl font-black text-gray-900 mt-1">
            Bunları da Eklemek İster Misiniz?
          </h3>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={scrollLeft}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-600 transition flex items-center justify-center font-black text-xs"
            aria-label="Önceki"
          >
            ←
          </button>
          <button
            onClick={scrollRight}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-600 transition flex items-center justify-center font-black text-xs"
            aria-label="Sonraki"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={sliderRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-2 custom-scrollbar hide-scrollbar-on-mobile -mx-2 px-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="snap-start shrink-0 w-[78vw] sm:w-[240px] md:w-[250px] text-gray-900"
          >
            <ProductCard product={{ ...product, badgeText: "💡 Önerilen" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
