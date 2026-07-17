"use client";

import { useState } from "react";
import { useCartStore } from "../lib/store";
import toast from "react-hot-toast";

// Butonun dışarıdan alacağı özellikleri genişlettik
interface AddToCartProps {
  product: {
    id: string;
    name: string;
    price: number;
    images?: { imageUrl: string }[];
    stock?: number; // Stok kontrolü eklendi
  };
  className?: string; // Dışarıdan özel stil verebilmek için eklendi
}

export default function AddToCartButton({ product, className = "" }: AddToCartProps) {
  const addItem = useCartStore((state) => state.addItem);
  
  // Görsel geri bildirim (Yeşil "Eklendi" animasyonu) için state
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    // Tıklamanın Link elementlerini tetikleyip sayfa değiştirmesini engeller
    e.preventDefault();
    e.stopPropagation(); 

    // Stok kontrolü
    if (product.stock !== undefined && product.stock <= 0) {
      toast.error("Bu ürün maalesef tükendi.");
      return;
    }

    setIsAdding(true);

    const extractedImageUrls = product.images?.map(img => img.imageUrl) || [];

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrls: extractedImageUrls,
    });
    
    toast.success(`${product.name} sepete eklendi! 🛒`);

    // Butonun yarım saniye boyunca "Eklendi" durumunda kalmasını sağlar
    setTimeout(() => setIsAdding(false), 600);
  };

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <button 
      onClick={handleAddToCart}
      disabled={isOutOfStock || isAdding}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all active:scale-95 w-full sm:w-auto overflow-hidden ${
        isOutOfStock 
          ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
          : isAdding 
            ? "bg-green-600 text-white" 
            : "bg-gray-900 text-white hover:bg-blue-600 hover:shadow-md"
      } ${className}`}
    >
      {isOutOfStock ? (
        "Tükendi"
      ) : isAdding ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-in zoom-in duration-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Eklendi
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Sepete Ekle
        </>
      )}
    </button>
  );
}