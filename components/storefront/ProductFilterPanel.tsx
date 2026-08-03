"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FilterPanelProps {
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  currentSort?: string;
  currentCategory?: string;
  currentBrand?: string;
  currentMin?: string;
  currentMax?: string;
}

export default function ProductFilterPanel({
  categories,
  brands,
  currentSort,
  currentCategory,
  currentBrand,
  currentMin,
  currentMax,
}: FilterPanelProps) {
  const router = useRouter();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [sort, setSort] = useState(currentSort || "");
  const [category, setCategory] = useState(currentCategory || "");
  const [brand, setBrand] = useState(currentBrand || "");
  const [min, setMin] = useState(currentMin || "");
  const [max, setMax] = useState(currentMax || "");

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    
    if (sort) params.set("sort", sort);
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (min) params.set("min", min);
    if (max) params.set("max", max);

    setIsMobileDrawerOpen(false);
    router.push(`/products?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSort("");
    setCategory("");
    setBrand("");
    setMin("");
    setMax("");
    setIsMobileDrawerOpen(false);
    router.push("/products");
  };

  const hasActiveFilters = Boolean(currentSort || currentCategory || currentBrand || currentMin || currentMax);

  const filterContent = (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-extrabold text-base sm:text-lg text-gray-900 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtreler
        </h3>
        {hasActiveFilters && (
          <button 
            onClick={handleClearFilters}
            className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-lg transition-colors min-h-[36px]"
          >
            Temizle
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Sıralama */}
        <div>
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">Sıralama</label>
          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3 outline-none transition-colors min-h-[44px]"
          >
            <option value="">En Yeniler</option>
            <option value="popular">Çok Satanlar</option>
            <option value="price_asc">En Düşük Fiyat</option>
            <option value="price_desc">En Yüksek Fiyat</option>
          </select>
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">Kategori</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3 outline-none transition-colors min-h-[44px]"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Marka */}
        <div>
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">Marka</label>
          <select 
            value={brand} 
            onChange={(e) => setBrand(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3 outline-none transition-colors min-h-[44px]"
          >
            <option value="">Tüm Markalar</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Fiyat Aralığı */}
        <div>
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">Fiyat Aralığı (₺)</label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="Min" 
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3 outline-none transition-colors min-h-[44px]"
            />
            <span className="text-gray-400 font-bold">-</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3 outline-none transition-colors min-h-[44px]"
            />
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
        <button 
          onClick={handleApplyFilters}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-sm text-sm min-h-[44px]"
        >
          Sonuçları Göster
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBİL FİLTRE DÜĞMESİ (Sadece Mobilde Görünür) */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="w-full bg-white border border-gray-200 shadow-sm rounded-xl py-3 px-4 font-bold text-gray-800 flex items-center justify-between hover:bg-gray-50 transition min-h-[44px]"
        >
          <span className="flex items-center gap-2 text-sm">
            <span>⚙️</span> Filtrele ve Sırala
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
              <h4 className="font-extrabold text-gray-900 text-lg">Filtreleme</h4>
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

      {/* MASAÜSTÜ SİDEBAR (Masaüstünde Aynen Görünür) */}
      <div className="hidden lg:block bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        {filterContent}
      </div>
    </>
  );
}
