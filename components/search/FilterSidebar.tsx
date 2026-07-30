"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface FilterOption {
  id: string;
  name: string;
}

interface FilterSidebarProps {
  categories: FilterOption[];
  brands: FilterOption[];
}

export default function FilterSidebar({ categories, brands }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const currentQ = searchParams.get("q") || "";
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "");
    setSelectedBrand(searchParams.get("brand") || "");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setSort(searchParams.get("sort") || "newest");
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (currentQ) params.set("q", currentQ);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sort) params.set("sort", sort);

    setIsMobileDrawerOpen(false);
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    
    setIsMobileDrawerOpen(false);
    if (currentQ) {
      router.push(`/search?q=${currentQ}`);
    } else {
      router.push(`/search`);
    }
  };

  const hasActiveFilters = Boolean(selectedCategory || selectedBrand || minPrice || maxPrice || (sort && sort !== "newest"));

  const filterContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Filtreler
        </h2>
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-lg transition-colors min-h-[36px]"
          >
            Temizle
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* SIRALAMA */}
        <div>
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">Sıralama</label>
          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3 outline-none min-h-[44px]"
          >
            <option value="newest">En Yeniler</option>
            <option value="price_asc">Fiyat (Düşükten Yükseğe)</option>
            <option value="price_desc">Fiyat (Yüksekten Düşüğe)</option>
            <option value="sales">En Çok Satanlar</option>
          </select>
        </div>

        {/* KATEGORİ */}
        <div>
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">Kategori</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3 outline-none min-h-[44px]"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* MARKA */}
        <div>
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">Marka</label>
          <select 
            value={selectedBrand} 
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3 outline-none min-h-[44px]"
          >
            <option value="">Tüm Markalar</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* FİYAT ARALIK */}
        <div>
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">Fiyat Aralığı (₺)</label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="Min ₺" 
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3 outline-none min-h-[44px]"
            />
            <span className="text-gray-400 font-bold">-</span>
            <input 
              type="number" 
              placeholder="Max ₺" 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3 outline-none min-h-[44px]"
            />
          </div>
        </div>
      </div>

      <button 
        onClick={applyFilters}
        className="w-full bg-gray-900 hover:bg-black text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-4 text-sm min-h-[44px]"
      >
        Sonuçları Göster
      </button>
    </div>
  );

  return (
    <>
      {/* MOBİL FİLTRE DÜĞMESİ */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="w-full bg-white border border-gray-200 shadow-sm rounded-xl py-3 px-4 font-bold text-gray-800 flex items-center justify-between hover:bg-gray-50 transition min-h-[44px]"
        >
          <span className="flex items-center gap-2 text-sm">
            <span>🔍</span> Filtrele ve Sırala
          </span>
          {hasActiveFilters && (
            <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              Aktif
            </span>
          )}
        </button>
      </div>

      {/* MOBİL DRAWER OVERLAY */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div 
            onClick={() => setIsMobileDrawerOpen(false)} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          />
          <div className="relative w-full max-w-xs bg-white h-full p-6 overflow-y-auto z-10 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h4 className="font-extrabold text-gray-900 text-lg">Arama Filtreleri</h4>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-8 h-8 bg-gray-100 rounded-full font-bold text-gray-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}

      {/* MASAÜSTÜ FİLTRE SIDEBAR */}
      <div className="hidden lg:block bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-24">
        {filterContent}
      </div>
    </>
  );
}
