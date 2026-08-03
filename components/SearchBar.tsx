"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

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

interface SearchBarProps {
  isMobileModalOpen?: boolean;
  onCloseMobileModal?: () => void;
}

export default function SearchBar({ isMobileModalOpen, onCloseMobileModal }: SearchBarProps = {}) {
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
    "Telefon",
  ]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isListening, setIsListening] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Mobil Arama Açıldığında Otomatik Odaklanma (Auto-Focus)
  useEffect(() => {
    if (isMobileModalOpen) {
      const timer = setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isMobileModalOpen]);

  const handleCloseDropdown = () => {
    setIsOpen(false);
    if (onCloseMobileModal) {
      onCloseMobileModal();
    }
  };

  // LocalStorage'dan Son Aramaları Yükle
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem("vitrin_recent_searches");
        if (saved) {
          setRecentSearches(JSON.parse(saved));
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 300ms Client-Side Debounce & Empty Input Handling
  useEffect(() => {
    const trimmed = searchQuery.trim();

    const handler = setTimeout(() => {
      if (!trimmed) {
        setDebouncedQuery("");
        setProducts([]);
        setCategories([]);
        setLoading(false);
      } else {
        setDebouncedQuery(trimmed);
      }
    }, !trimmed ? 0 : 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Canlı Arama API Çağrısı with AbortController Race Condition Safety
  useEffect(() => {
    if (!isOpen || !debouncedQuery) {
      if (!debouncedQuery) {
        const timer = setTimeout(() => {
          setProducts([]);
          setCategories([]);
          setLoading(false);
        }, 0);
        return () => clearTimeout(timer);
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
      } catch (e: unknown) {
        if ((e as Error)?.name === "AbortError") {
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
      const target = e.target as Node;
      const isInsideDesktop = containerRef.current && containerRef.current.contains(target);
      const isInsideMobile = mobileDropdownRef.current && mobileDropdownRef.current.contains(target);
      if (!isInsideDesktop && !isInsideMobile) {
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
    } catch {}
  };

  const removeRecentSearch = (queryToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((q) => q !== queryToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem("vitrin_recent_searches", JSON.stringify(updated));
    } catch {}
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
      handleCloseDropdown();
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  // Klavyeden Yön Tuşları Desteği
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCloseDropdown();
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
        handleCloseDropdown();
        router.push(`/products/${products[selectedIndex].id}`);
      }
    }
  };

  // Sesli Arama (Web Speech API)
  const startVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Tarayıcınız sesli aramayı desteklemiyor.");
      return;
    }
    try {
      const win = window as unknown as {
        SpeechRecognition?: {
          new (): {
            lang: string;
            start: () => void;
            onresult: (e: {
              results: { [i: number]: { [j: number]: { transcript: string } } };
            }) => void;
            onerror: () => void;
            onend: () => void;
          };
        };
        webkitSpeechRecognition?: {
          new (): {
            lang: string;
            start: () => void;
            onresult: (e: {
              results: { [i: number]: { [j: number]: { transcript: string } } };
            }) => void;
            onerror: () => void;
            onend: () => void;
          };
        };
      };
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      const recognition = new SpeechRecognition();
      recognition.lang = "tr-TR";
      recognition.start();

      setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
        handleSearchSubmit(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } catch {
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

  const renderDropdownContent = () => (
    <>
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
                      className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer"
                    >
                      Temizle
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSearchSubmit(item)}
                        className="bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition group"
                      >
                        <span>{item}</span>
                        <button
                          onClick={(e) => removeRecentSearch(item, e)}
                          className="text-gray-400 hover:text-red-500 font-bold ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* POPÜLER / TREND ARAMALAR */}
              <div className="space-y-2">
                <span className="font-extrabold text-gray-400 uppercase tracking-widest text-[10px] block">
                  🔥 Popüler Aramalar
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {trendingSearches.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSearchSubmit(item)}
                      className="bg-blue-50/60 hover:bg-blue-600 text-blue-700 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. KULLANICI BİR ŞEY YAZMIŞ AMA SONUÇ BULUNAMAMIŞSA */}
          {searchQuery.trim() && products.length === 0 && categories.length === 0 && (
            <div className="p-8 text-center space-y-2">
              <span className="text-3xl block">🔍</span>
              <p className="font-extrabold text-gray-800 text-sm">
                &quot;{searchQuery}&quot; ile ilgili sonuç bulunamadı.
              </p>
              <p className="text-gray-400 text-xs">
                Lütfen kelimeyi kontrol edin veya farklı bir kelime deneyin.
              </p>
            </div>
          )}

          {/* 2. ÖNERİLEN KATEGORİLER */}
          {categories.length > 0 && (
            <div className="p-3 bg-gray-50/70 border-b border-gray-100 space-y-1">
              <span className="font-extrabold text-gray-400 uppercase tracking-widest text-[10px] px-2 block mb-1">
                📁 Önerilen Kategoriler
              </span>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/search?q=${encodeURIComponent(searchQuery)}&category=${cat.id}`}
                  onClick={handleCloseDropdown}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white transition font-bold text-gray-800 text-xs sm:text-sm group"
                >
                  <span className="truncate">{cat.name} kategorisinde ara</span>
                  <span className="text-blue-600 font-extrabold text-xs group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                    İncele &rarr;
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* 3. ÖNE ÇIKAN ÜRÜNLER (Mini İlk 3 Ürün Kartı) */}
          {products.length > 0 && (
            <div className="p-3 space-y-1">
              <span className="font-extrabold text-gray-400 uppercase tracking-widest text-[10px] px-2 block mb-1">
                📦 Öne Çıkan Ürünler ({Math.min(3, products.length)})
              </span>
              {products.slice(0, 3).map((prod, idx) => (
                <Link
                  key={prod.id}
                  href={`/products/${prod.id}`}
                  onClick={() => {
                    saveRecentSearch(prod.name);
                    handleCloseDropdown();
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-2xl transition ${
                    selectedIndex === idx ? "bg-blue-50/80 border border-blue-200" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                      {prod.imageUrl ? (
                        <Image src={prod.imageUrl} alt={prod.name} width={40} height={40} className="object-contain" />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 line-clamp-1">{highlightMatch(prod.name, searchQuery)}</p>
                      <span className="text-[10px] text-gray-400 font-bold block truncate">
                        {prod.brand?.name || prod.category?.name || "Teknoloji"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-3">
                    <span className="font-black text-blue-600 block">{prod.price.toLocaleString("tr-TR")} ₺</span>
                    <span className={`text-[9px] font-bold ${prod.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                      {prod.stock > 0 ? "Stokta" : "Tükendi"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {products.length > 0 && (
            <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
              <button
                onClick={() => handleSearchSubmit()}
                className="text-xs font-black text-blue-600 hover:underline cursor-pointer"
              >
                &quot;{searchQuery}&quot; İçin Tüm Sonuçları Gör ({products.length}+ Ürün) ➔
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

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
          placeholder="Ürün veya marka ara..."
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
              aria-label="Sesli Arama"
              className={`p-1.5 rounded-full text-xs transition flex items-center justify-center ${
                isListening ? "bg-red-500 text-white animate-pulse" : "text-gray-400 hover:text-blue-600"
              }`}
              title="Sesli Arama Yap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* ARA BUTONU (44px Minimum Touch Target) */}
        <button
          type="submit"
          className="absolute inset-y-1 right-1 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-full transition-all text-xs font-black shadow-xs min-h-[44px] flex items-center justify-center cursor-pointer"
        >
          Ara
        </button>
      </form>

      {/* 🚀 1. MASAÜSTÜ ARAMA DROPDOWN (Yalnızca Masaüstü - hidden lg:block) */}
      {isOpen && (
        <div className="hidden lg:block absolute top-full left-0 right-0 mt-2 rounded-3xl z-50 max-h-[70vh] bg-white shadow-2xl border border-gray-100 overflow-hidden text-xs sm:text-sm animate-in fade-in duration-200">
          {renderDropdownContent()}
        </div>
      )}

      {/* 🚀 2. MOBİL ARAMA TAM EKRAN MODAL (Yalnızca Mobil/Tablet - lg:hidden) */}
      {isMobileModalOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="lg:hidden fixed inset-0 z-[999] flex flex-col">
            {/* MOBİL BACKDROP OVERLAY */}
            <div
              onClick={handleCloseDropdown}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0 animate-in fade-in duration-200"
            />

            {/* MOBİL ARAMA PANELI (100dvh - Self-contained search surface) */}
            <div
              ref={mobileDropdownRef}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full h-[100dvh] bg-white flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-top-2 duration-200"
            >
              {/* MOBİL ARAMA BAŞLIĞI (HEADER) */}
              <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-gray-100 bg-white flex-shrink-0 shadow-2xs">
                {/* GERİ / KAPAT BUTONU */}
                <button
                  type="button"
                  onClick={handleCloseDropdown}
                  aria-label="Aramayı Kapat"
                  className="p-2 sm:p-2.5 text-gray-600 hover:text-blue-600 rounded-xl hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>

                {/* MOBİL ARAMA FORMU */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchSubmit();
                  }}
                  className="flex-1 relative flex items-center min-w-0"
                >
                  {/* BÜYÜTEÇ İKONU */}
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* MOBİL INPUT GİRDİSİ */}
                  <input
                    ref={mobileInputRef}
                    type="text"
                    placeholder="Ürün veya marka ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-10 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-xs sm:text-sm font-medium"
                    aria-label="Mobil Arama Kutusu"
                  />

                  {/* MİKROFON SESLİ ARAMA VE TEMİZLEME İKONLARI */}
                  <div className="absolute inset-y-0 right-14 flex items-center gap-1 pr-1">
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={handleClearInput}
                        className="p-1.5 text-gray-400 hover:text-gray-700 transition"
                        aria-label="Temizle"
                      >
                        ✕
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startVoiceSearch}
                        aria-label="Sesli Arama"
                        className={`p-1.5 rounded-full text-xs transition flex items-center justify-center ${
                          isListening ? "bg-red-500 text-white animate-pulse" : "text-gray-400 hover:text-blue-600"
                        }`}
                        title="Sesli Arama Yap"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* ARA BUTONU */}
                  <button
                    type="submit"
                    className="absolute inset-y-1 right-1 bg-blue-600 hover:bg-blue-700 text-white px-3.5 rounded-full transition-all text-xs font-black shadow-xs min-h-[38px] flex items-center justify-center cursor-pointer"
                  >
                    Ara
                  </button>
                </form>
              </div>

              {/* MOBİL ARAMA SONUÇLARI (SCROLLABLE AREA) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white">
                {renderDropdownContent()}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}