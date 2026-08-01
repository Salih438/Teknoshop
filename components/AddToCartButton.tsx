"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store";
import toast from "react-hot-toast";

interface AddToCartProps {
  product: {
    id: string;
    name: string;
    price: number;
    images?: { imageUrl: string }[];
    stock?: number; 
  };
  // 🚀 GÜNCELLEME 1: Seçili varyasyon bilgisini dışarıdan alıyoruz
  selectedVariant?: {
    id: string;
    name: string;
    price: number;
  } | null;
  className?: string; 
}

export default function AddToCartButton({ product, selectedVariant, className = "" }: AddToCartProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 

    if (product.stock !== undefined && product.stock <= 0) {
      toast.error("Bu ürün maalesef tükendi.");
      return;
    }

    setIsAdding(true);

    const extractedImageUrls = product.images?.map(img => img.imageUrl) || [];

    // 🚀 GÜNCELLEME 2: Fiyatı ve ismi varyasyona göre dinamik hesapla
    const finalPrice = selectedVariant ? selectedVariant.price : product.price;
    const finalName = selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name;

    addItem({
      id: product.id,
      name: finalName,
      price: finalPrice,
      imageUrls: extractedImageUrls,
      variantId: selectedVariant?.id, // Benzersiz ID oluşumu için store'a gönderiyoruz
    });
    
    toast.success(`${finalName} sepete eklendi.`);

    setTimeout(() => setIsAdding(false), 600);
  };

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <button 
      onClick={handleAddToCart}
      disabled={isOutOfStock || isAdding}
      aria-label={isOutOfStock ? "Ürün Tükendi" : "Sepete Ekle"}
      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 w-full sm:w-auto whitespace-nowrap ${
        isOutOfStock 
          ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none" 
          : isAdding 
            ? "bg-green-600 text-white shadow-md border border-transparent" 
            : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 border border-transparent"
      } ${className}`}
    >
      {isOutOfStock ? (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Tükendi
        </span>
      ) : isAdding ? (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-in zoom-in duration-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Eklendi
        </span>
      ) : (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Sepete Ekle
        </span>
      )}
    </button>
  );
}