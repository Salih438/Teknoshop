"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery !== "") {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <form onSubmit={handleSearch} className="relative flex items-center w-full group">
      <div className="relative w-full">
        
        {/* Sol Taraftaki Sabit Büyüteç İkonu */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Arama Girdisi */}
        <input
          type="text"
          placeholder="Ürün, kategori veya marka ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          aria-label="Arama Kutusu"
        />
        
        {/* Yazı Yazıldığında Çıkan Temizleme (X) Butonu */}
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute inset-y-0 right-[85px] pr-2 flex items-center text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Aramayı Temizle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* İçine Gömülü Arama Butonu */}
        <button
          type="submit"
          disabled={!searchQuery.trim()}
          className="absolute inset-y-1.5 right-1.5 bg-blue-600 text-white px-5 rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center text-sm font-bold shadow-sm"
          aria-label="Ara"
        >
          Ara
        </button>
        
      </div>
    </form>
  );
}