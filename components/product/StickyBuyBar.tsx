"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";

interface StickyBuyBarProps {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    stock: number;
  };
}

export default function StickyBuyBar({ product }: StickyBuyBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl p-3 sm:p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* ÜRÜN BİLGİSİ */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 p-1 flex-shrink-0 flex items-center justify-center">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} width={48} height={48} className="object-contain" />
            ) : (
              <span>📦</span>
            )}
          </div>

          <div className="hidden sm:block">
            <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm line-clamp-1">{product.name}</h4>
            <span className="text-[10px] text-green-600 font-bold block">
              {product.stock > 0 ? "🟢 Stokta Var - 24 Saatte Kargoda" : "🔴 Tükendi"}
            </span>
          </div>
        </div>

        {/* FİYAT VE SEPETE EKLE BUTONU */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-gray-400 font-bold block">FİYAT</span>
            <span className="text-lg sm:text-2xl font-black text-blue-600">
              {product.price.toLocaleString("tr-TR")} ₺
            </span>
          </div>

          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              images: product.imageUrl ? [{ imageUrl: product.imageUrl }] : [],
              stock: product.stock,
            }}
            className="!px-6 !py-3 !text-sm !rounded-2xl min-h-[44px]"
          />
        </div>

      </div>
    </div>
  );
}
