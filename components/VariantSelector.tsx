"use client";

import { useState, useEffect } from "react";

export interface ProductVariant {
  id: string;
  combination: string | null;
  color: string | null;
  storage: string | null;
  price: number | null;
  discountedPrice: number | null;
  stock: number;
  sku: string | null;
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant | null) => void;
}

export default function VariantSelector({ variants, onSelect }: VariantSelectorProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedVariantId) {
      const match = variants.find(v => v.id === selectedVariantId);
      onSelect(match || null);
    } else {
      onSelect(null);
    }
  }, [selectedVariantId, variants, onSelect]);

  if (!variants || variants.length === 0) return null;

  return (
    <div className="mb-8 space-y-6 border-b border-gray-100 pb-8 animate-in fade-in">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Seçenekler</h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {variants.map((variant) => {
            const isSelected = selectedVariantId === variant.id;
            const isOutOfStock = variant.stock <= 0;
            const displayLabel = variant.combination || [variant.color, variant.storage].filter(Boolean).join(" / ") || "Standart";
            
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => !isOutOfStock && setSelectedVariantId(isSelected ? null : variant.id)}
                disabled={isOutOfStock}
                className={`relative px-5 py-3 rounded-xl border text-sm font-bold transition-all
                  ${isSelected 
                    ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm ring-2 ring-blue-600 ring-offset-1 scale-105" 
                    : isOutOfStock 
                      ? "border-gray-100 bg-gray-50 text-gray-400 opacity-50 cursor-not-allowed" 
                      : "border-gray-300 text-gray-700 hover:border-gray-400 bg-white hover:shadow-sm"
                  }
                `}
              >
                <span className="relative z-10">{displayLabel}</span>
                {isOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-xl">
                    <div className="w-[120%] h-[1.5px] bg-gray-300 -rotate-[15deg]"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      <p className="text-xs text-gray-400 font-medium mt-2">
        Stokta olmayan varyasyonlar pasif görünür.
      </p>
    </div>
  );
}