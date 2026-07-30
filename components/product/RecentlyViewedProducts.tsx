"use client";

import { useState, useEffect, useRef } from "react";
import ProductCard, { ProductCardProps } from "@/components/ProductCard";

export default function RecentlyViewedProducts({ currentProduct }: { currentProduct?: ProductCardProps }) {
  const [recentlyViewed, setRecentlyViewed] = useState<ProductCardProps[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const existing = localStorage.getItem("vitrin_recently_viewed");
      let list: ProductCardProps[] = existing ? JSON.parse(existing) : [];

      if (currentProduct) {
        // Tekrarlayanları temizle ve en başa ekle
        list = [currentProduct, ...list.filter((item) => item.id !== currentProduct.id)].slice(0, 10);
        localStorage.setItem("vitrin_recently_viewed", JSON.stringify(list));
      }

      // Mevcut ürünü listede tekrar göstermemek için filtrele
      const filtered = list.filter((item) => item.id !== currentProduct?.id);
      setRecentlyViewed(filtered);
    } catch (e) {}
  }, [currentProduct]);

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

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="bg-gray-50/70 p-6 sm:p-10 rounded-3xl border border-gray-200/80 shadow-2xs space-y-6 my-8 text-left relative group">
      {/* BAŞLIK VE OK BUTONLARI */}
      <div className="flex justify-between items-end border-b border-gray-200/80 pb-4">
        <div>
          <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
            🕒 GEÇMİŞİNİZ
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1">Son İnceledikleriniz</h3>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            Daha önce göz attığınız ve karşılaştırmak isteyebileceğiniz ürünler.
          </p>
        </div>

        {/* OK BUTONLARI */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={scrollLeft}
            className="w-10 h-10 rounded-full bg-white hover:bg-purple-600 hover:text-white text-gray-600 transition flex items-center justify-center font-black shadow-2xs border border-gray-200"
            aria-label="Önceki"
          >
            ←
          </button>
          <button
            onClick={scrollRight}
            className="w-10 h-10 rounded-full bg-white hover:bg-purple-600 hover:text-white text-gray-600 transition flex items-center justify-center font-black shadow-2xs border border-gray-200"
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
        {recentlyViewed.map((product) => (
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
