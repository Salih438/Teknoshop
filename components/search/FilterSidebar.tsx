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

  // URL'den mevcut parametreleri al (sayfa yenilendiğinde filtrelerin kalması için)
  const currentQ = searchParams.get("q") || "";
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCategory(searchParams.get("category") || "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedBrand(searchParams.get("brand") || "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinPrice(searchParams.get("minPrice") || "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMaxPrice(searchParams.get("maxPrice") || "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    
    // q parametresini koruyarak sadece filtreleri temizle
    if (currentQ) {
      router.push(`/search?q=${currentQ}`);
    } else {
      router.push(`/search`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-24">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Filtreler
        </h2>
        <button 
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-red-500 font-medium transition-colors"
        >
          Temizle
        </button>
      </div>

      <div className="space-y-6">
        {/* SIRALAMA */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Sıralama</label>
          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none"
          >
            <option value="newest">En Yeniler</option>
            <option value="price_asc">Fiyat (Düşükten Yükseğe)</option>
            <option value="price_desc">Fiyat (Yüksekten Düşüğe)</option>
            <option value="sales">En Çok Satanlar</option>
          </select>
        </div>

        {/* KATEGORİ */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Kategori</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* MARKA */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Marka</label>
          <select 
            value={selectedBrand} 
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none"
          >
            <option value="">Tüm Markalar</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* FİYAT ARALIĞI */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Fiyat Aralığı</label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="Min ₺" 
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="number" 
              placeholder="Max ₺" 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none"
            />
          </div>
        </div>

        {/* UYGULA BUTONU */}
        <button 
          onClick={applyFilters}
          className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all shadow-md mt-4"
        >
          Sonuçları Göster
        </button>
      </div>
    </div>
  );
}
