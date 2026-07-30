"use client";

import Link from "next/link";
import { useRef } from "react";

interface Brand {
  id: string;
  name: string;
}

export default function BrandSlider({ brands }: { brands: Brand[] }) {
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

  if (!brands || brands.length === 0) return null;

  return (
    <div className="relative group">
      {/* Sol Ok */}
      <button 
        onClick={scrollLeft}
        className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md border border-gray-100 rounded-full w-12 h-12 flex items-center justify-center text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hidden md:flex"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>

      {/* Kayar Liste */}
      <div 
        ref={sliderRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory py-6 px-4 custom-scrollbar hide-scrollbar-on-mobile items-center -mx-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {brands.map((brand) => (
          <Link key={brand.id} href={`/products?brand=${brand.id}`} className="snap-start shrink-0 block outline-none">
            <div className="bg-white px-10 py-4 rounded-full border-2 border-gray-200 flex items-center justify-center text-center hover:bg-gray-900 hover:border-gray-900 transition-all duration-300 hover:-translate-y-1 group/brand min-w-[160px] h-16 shadow-sm hover:shadow-lg">
              <span className="font-black text-lg md:text-xl text-gray-900 group-hover/brand:text-white transition-colors duration-300 uppercase tracking-widest">
                {brand.name}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Sağ Ok */}
      <button 
        onClick={scrollRight}
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
