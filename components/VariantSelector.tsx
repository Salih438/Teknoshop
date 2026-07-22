"use client";

import { useState, useEffect } from "react";

export interface ProductVariant {
  id: string;
  color: string | null;
  storage: string | null;
  price: number | null;
  stock: number;
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant | null) => void;
}

// Renk isimlerini CSS kodlarına çeviren sözlük
const colorMap: Record<string, string> = {
  "Siyah": "bg-gray-900",
  "Beyaz": "bg-gray-100 border border-gray-300",
  "Mavi": "bg-blue-500",
  "Pembe": "bg-pink-400",
  "Kırmızı": "bg-red-500",
  "Yeşil": "bg-green-500",
  "Sarı": "bg-yellow-400",
  "Mor": "bg-purple-500",
  "Gri": "bg-gray-500",
  "Gümüş": "bg-gray-300 bg-gradient-to-br from-gray-200 to-gray-400",
  "Altın": "bg-yellow-200 bg-gradient-to-br from-yellow-200 to-yellow-500",
};

export default function VariantSelector({ variants, onSelect }: VariantSelectorProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);

  // Varyasyon listesinden benzersiz renkleri ve hafızaları çıkarıyoruz
  const availableColors = Array.from(new Set(variants.map(v => v.color).filter(Boolean))) as string[];
  const availableStorages = Array.from(new Set(variants.map(v => v.storage).filter(Boolean))) as string[];

  // Kullanıcının seçtiği renk ve hafıza kombinasyonuna ait varyasyonu buluyoruz
  const matchedVariant = variants.find(
    v => (selectedColor ? v.color === selectedColor : true) && 
         (selectedStorage ? v.storage === selectedStorage : true) &&
         (selectedColor || selectedStorage) // İkisinden biri seçiliyse filtrele
  );

  // Seçim değiştiğinde üst bileşene (ProductDetails) haber veriyoruz
  useEffect(() => {
    // Hem renk hem hafıza seçildiyse ve eşleşiyorsa tam varyasyonu gönder
    if (selectedColor && selectedStorage) {
      const exactMatch = variants.find(v => v.color === selectedColor && v.storage === selectedStorage);
      onSelect(exactMatch || null);
    } else {
      // Eksik seçim varsa veya seçim iptal edildiyse ana fiyata dönmek için null gönder
      onSelect(null);
    }
  }, [selectedColor, selectedStorage, variants, onSelect]);

  if (!variants || variants.length === 0) return null;

  return (
    <div className="mb-8 space-y-8 border-b border-gray-100 pb-8 animate-in fade-in">
      
      {/* 1. RENK SEÇİMİ */}
      {availableColors.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Renk</h3>
            <span className="text-sm text-gray-500 font-medium">{selectedColor || "Seçiniz"}</span>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {availableColors.map((colorName) => {
              const isSelected = selectedColor === colorName;
              const colorClass = colorMap[colorName] || "bg-gray-800"; // Tanımsızsa koyu gri

              return (
                <button
                  key={colorName}
                  type="button"
                  onClick={() => setSelectedColor(isSelected ? null : colorName)} // Aynı renge tıklarsa iptal et
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all outline-none 
                    ${isSelected ? "ring-2 ring-blue-600 ring-offset-2 scale-110" : "hover:scale-105 hover:ring-2 hover:ring-gray-300 hover:ring-offset-1"}
                  `}
                  title={colorName}
                >
                  <span className={`w-10 h-10 rounded-full block shadow-inner ${colorClass}`}></span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. HAFIZA SEÇİMİ */}
      {availableStorages.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Depolama</h3>
            <span className="text-sm text-gray-500 font-medium">{selectedStorage || "Seçiniz"}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {availableStorages.map((storage) => {
              const isSelected = selectedStorage === storage;
              
              // Seçili bir renk varsa, bu hafıza seçeneği o renkte stokta var mı kontrolü
              const isOutOfStock = selectedColor 
                ? !variants.find(v => v.color === selectedColor && v.storage === storage && v.stock > 0)
                : false;

              return (
                <button
                  key={storage}
                  type="button"
                  onClick={() => !isOutOfStock && setSelectedStorage(isSelected ? null : storage)}
                  disabled={isOutOfStock}
                  className={`relative py-3 rounded-xl border text-sm font-bold transition-all
                    ${isSelected 
                      ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm" 
                      : isOutOfStock 
                        ? "border-gray-100 bg-gray-50 text-gray-400 opacity-50 cursor-not-allowed" 
                        : "border-gray-300 text-gray-700 hover:border-gray-400 bg-white"
                    }
                  `}
                >
                  <span className="relative z-10">{storage}</span>
                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-[80%] h-[1.5px] bg-gray-400 rotate-[-12deg]"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. DİNAMİK STOK BİLGİSİ */}
      {matchedVariant && selectedColor && selectedStorage && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-xl">📦</span>
          <p className="text-sm font-medium text-gray-700">
            Kalan Stok: <span className="font-bold text-gray-900">{matchedVariant.stock} adet</span>
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 font-medium mt-4">
        Stokta olmayan kombinasyonlar pasif görünür.
      </p>
    </div>
  );
}