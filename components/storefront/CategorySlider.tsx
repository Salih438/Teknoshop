"use client";

import Link from "next/link";
import { useRef } from "react";

interface Category {
  id: string;
  name: string;
  _count: {
    products: number;
  };
}

export default function CategorySlider({ categories }: { categories: Category[] }) {
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

  return (
    <div className="relative group">
      {/* Sol Ok */}
      <button 
        type="button"
        onClick={scrollLeft}
        aria-label="Önceki Kategoriler"
        className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md border border-gray-100 rounded-full w-12 h-12 flex items-center justify-center text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hidden md:flex"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>

      {/* Kayar Liste */}
      <div 
        ref={sliderRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory py-6 px-4 custom-scrollbar hide-scrollbar-on-mobile -mx-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((category) => (
          <Link key={category.id} href={`/products?category=${category.id}`} className="snap-start shrink-0 block outline-none">
            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-3xl shadow-sm border border-gray-100 min-w-[200px] sm:w-56 h-48 flex flex-col items-center justify-center text-center hover:shadow-xl hover:border-blue-200 hover:from-white hover:to-blue-50 hover:-translate-y-2 transition-all duration-300 group/card">
              <div className="w-16 h-16 bg-white shadow-sm border border-gray-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover/card:bg-blue-600 group-hover/card:text-white group-hover/card:shadow-md transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover/card:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </div>
              <h3 className="font-extrabold text-gray-800 text-sm sm:text-base mb-2 w-full px-2 line-clamp-2 break-words whitespace-normal leading-tight group-hover/card:text-blue-900 transition-colors">
                {category.name}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider group-hover/card:text-blue-600 transition-colors">
                {category._count.products} Ürün
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Sağ Ok */}
      <button 
        type="button"
        onClick={scrollRight}
        aria-label="Sonraki Kategoriler"
        className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md border border-gray-100 rounded-full w-12 h-12 flex items-center justify-center text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hidden md:flex"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>

      <style jsx>{`
        .hide-scrollbar-on-mobile::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
