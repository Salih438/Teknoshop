"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface SearchResultProduct {
  id: string;
  name: string;
  price: number;
  comparePrice?: number | null;
  imageUrl: string;
  stock: number;
  category?: { name: string };
  brand?: { name: string };
}

interface SearchResultCategory {
  id: string;
  name: string;
}

export default function SearchBar() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<SearchResultProduct[]>([]);
  const [categories, setCategories] = useState<SearchResultCategory[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([
    "Kulaklık",
    "Laptop",
    "Klavye",
    "Monitör",
    "SSD",
    "Akıllı Saat",
  ]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isListening, setIsListening] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // LocalStorage'dan Son Aramaları Yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vitrin_recent_searches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  // 300ms Client-Side Debounce & Empty Input Handling
  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setDebouncedQuery("");
      setProducts([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Canlı Arama API Çağrısı with AbortController Race Condition Safety
  useEffect(() => {
    if (!isOpen || !debouncedQuery) {
      if (!debouncedQuery) {
        setProducts([]);
        setCategories([]);
        setLoading(false);
      }
      return;
    }

    const controller = new AbortController();

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setCategories(data.categories || []);
          if (data.trendingSearches) {
            setTrendingSearches(data.trendingSearches);
          }
        }
      } catch (e: any) {
        if (e.name === "AbortError") {
          // In-flight fetch was aborted by a newer request or input clear; do nothing
          return;
        }
        console.error("Search fetch error:", e);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, isOpen]);

  // Dışarı tıklayınca kapatma
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((item) => item !== trimmed)].slice(0, 8);
    setRecentSearches(updated);
    try {
      localStorage.setItem("vitrin_recent_searches", JSON.stringify(updated));
    } catch (e) {}
  };

  const removeRecentSearch = (queryToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((q) => q !== queryToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem("vitrin_recent_searches", JSON.stringify(updated));
    } catch (e) {}
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("vitrin_recent_searches");
  };

  const handleClearInput = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setProducts([]);
    setCategories([]);
    setLoading(false);
  };

  const handleSearchSubmit = (queryToSubmit?: string) => {
    const targetQuery = queryToSubmit || searchQuery;
    const trimmed = targetQuery.trim();
    if (trimmed) {
      saveRecentSearch(trimmed);
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  // Klavyeden Yön Tuşları Desteği
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < products.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && products[selectedIndex]) {
        e.preventDefault();
        saveRecentSearch(products[selectedIndex].name);
        setIsOpen(false);
        router.push(`/products/${products[selectedIndex].id}`);
      }
    }
  };

  // Sesli Arama (Web Speech API)
  const startVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Tarayıcınız sesli aramayı desteklemiyor.");
      return;
    }
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "tr-TR";
      recognition.start();

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
        handleSearchSubmit(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } catch (e) {
      setIsListening(false);
    }
  };

  // Eşleşen kelimeyi kalın yapma (Search Highlight)
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, idx) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={idx} className="font-black text-blue-600 bg-blue-50 px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={containerRef} className="relative w-full text-left">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearchSubmit();
        }}
        className="relative flex items-center w-full group"
      >
        {/* BÜYÜTEÇ İKONU */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* INPUT GİRDİSİ */}
        <input
          type="text"
          placeholder="Ürün, marka veya kategori ara..."
          value={searchQuery}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-11 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-xs text-xs sm:text-sm font-medium"
          aria-label="Arama Kutusu"
        />

        {/* MİKROFON SESLİ ARAMA VE TEMİZLEME İKONLARI */}
        <div className="absolute inset-y-0 right-16 flex items-center gap-1.5 pr-2">
          {searchQuery ? (
            <button
              type="button"
              onClick={handleClearInput}
              className="p-1 text-gray-400 hover:text-gray-700 transition"
              aria-label="Temizle"
            >
              ✕
            </button>
          ) : (
            <button
              type="button"
              onClick={startVoiceSearch}
              className={`p-1.5 rounded-full text-xs transition ${
                isListening ? "bg-red-500 text-white animate-pulse" : "text-gray-400 hover:text-blue-600"
              }`}
              title="Sesli Arama Yap"
            >
              🎙️
            </button>
          )}
        </div>

        {/* ARA BUTONU */}
        <button
          type="submit"
          className="absolute inset-y-1.5 right-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-full transition-all text-xs font-black shadow-xs min-h-[36px] flex items-center justify-center"
        >
          Ara
        </button>
      </form>

      {/* LIVE SEARCH DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden text-xs sm:text-sm animate-in fade-in duration-200">
          
          {/* YÜKLENİYOR SKELETON */}
          {loading && (
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
              <div className="h-12 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="h-12 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          )}

          {!loading && (
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar divide-y divide-gray-100">
              
              {/* 1. KULLANICI HİÇBİR ŞEY YAZMAMIŞKEN (BOŞ ARAMA KUTUSU) */}
              {!searchQuery.trim() && (
                <div className="p-4 space-y-5">
                  
                  {/* SON ARAMALAR */}
                  {recentSearches.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-gray-400 uppercase tracking-widest text-[10px]">
                          🕒 Son Aramalarınız
                        </span>
                        <button
                          onClick={clearAllRecent}
                          className="text-[10px] text-red-500 font-bold hover:underline"
                        >
                          Temizle
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((item) => (
                          <div
                            key={item}
                            onClick={() => handleSearchSubmit(item)}
                            className="bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition flex items-center gap-1.5"
                          >
                            <span>{item}</span>
                            <span
                              onClick={(e) => removeRecentSearch(item, e)}
                              className="text-gray-400 hover:text-red-600 text-xs ml-1"
                            >
                              ✕
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TREND ARAMALAR */}
                  <div className="space-y-2">
                    <span className="font-extrabold text-gray-400 uppercase tracking-widest text-[10px] block">
                      🔥 Popüler Aramalar
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {trendingSearches.map((trend) => (
                        <button
                          key={trend}
                          onClick={() => handleSearchSubmit(trend)}
                          className="bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-800 font-extrabold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1"
                        >
                          <span>🔍</span>
                          <span>{trend}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* 2. KATEGORİ EŞLEŞMELERİ */}
              {categories.length > 0 && (
                <div className="p-3 bg-gray-50/50 space-y-1">
                  <span className="font-extrabold text-gray-400 uppercase tracking-widest text-[10px] px-2 block">
                    📁 İlgili Kategoriler
                  </span>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.id}`}
                      onClick={() => setIsOpen(false)}
                      className="block p-2 rounded-xl hover:bg-white transition font-bold text-gray-800"
                    >
                      {highlightMatch(cat.name, searchQuery)}
                    </Link>
                  ))}
                </div>
              )}

              {/* 3. ÜRÜN EŞLEŞMELERİ CANLI LİSTE */}
              {products.length > 0 && (
                <div className="p-3 space-y-1">
                  <span className="font-extrabold text-gray-400 uppercase tracking-widest text-[10px] px-2 block mb-1">
                    📦 Önerilen Ürünler ({products.length})
                  </span>
                  {products.map((prod, idx) => (
                    <Link
                      key={prod.id}
                      href={`/products/${prod.id}`}
                      onClick={() => {
                        saveRecentSearch(prod.name);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-2xl transition ${
                        selectedIndex === idx ? "bg-blue-50/80 border border-blue-200" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                          {prod.imageUrl ? (
                            <Image src={prod.imageUrl} alt={prod.name} width={40} height={40} className="object-contain" />
                          ) : (
                            <span>📦</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{highlightMatch(prod.name, searchQuery)}</p>
                          <span className="text-[10px] text-gray-400 font-bold block">
                            {prod.brand?.name || prod.category?.name || "Teknoloji"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-blue-600 block">{prod.price.toLocaleString("tr-TR")} ₺</span>
                        <span className={`text-[9px] font-bold ${prod.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                          {prod.stock > 0 ? "Stokta" : "Tükendi"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* 4. HİÇ BİR SONUÇ BULUNAMAYINCA (SMART EMPTY STATE) */}
              {searchQuery.trim() && products.length === 0 && !loading && (
                <div className="p-8 text-center space-y-3">
                  <span className="text-4xl block">🔍</span>
                  <p className="font-black text-gray-900 text-sm">"{searchQuery}" için sonuç bulunamadı</p>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Yazım hatası yapmış olabilirsiniz. Lütfen daha kısa veya alternatif kelimeler deneyiniz.
                  </p>
                  <button
                    onClick={() => handleSearchSubmit(searchQuery)}
                    className="bg-gray-900 text-white font-extrabold px-4 py-2 rounded-xl text-xs"
                  >
                    Tüm Katalogda Ara ➔
                  </button>
                </div>
              )}

              {/* ALT AKSİYON BARI */}
              {searchQuery.trim() && (
                <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                  <button
                    onClick={() => handleSearchSubmit()}
                    className="text-xs font-black text-blue-600 hover:underline"
                  >
                    "{searchQuery}" İçin Tüm Sonuçları Gör ({products.length}+ Ürün) ➔
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}