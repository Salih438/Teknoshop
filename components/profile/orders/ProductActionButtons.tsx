"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useCartStore } from "@/lib/store";

interface ProductActionButtonsProps {
  productId?: string;
  productName: string;
  price: number;
}

export default function ProductActionButtons({
  productId,
  productName,
  price,
}: ProductActionButtonsProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleBuyAgain = () => {
    setIsAddingToCart(true);
    if (productId) {
      addItem({
        id: productId,
        name: productName,
        price,
        imageUrls: [],
        quantity: 1,
      });
    }
    setTimeout(() => {
      setIsAddingToCart(false);
      toast.success(`"${productName}" tekrar sepetinize eklendi! 🛒`);
    }, 300);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    if (!isFavorite) {
      toast.success(`"${productName}" favorilerinize eklendi! ❤️`);
    } else {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-gray-900 text-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-3 text-xs font-bold items-center gap-2`}>
          <span>💔 Favorilerden çıkarıldı.</span>
        </div>
      ));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
      {/* TEKRAR SATIN AL BUTONU */}
      <button
        onClick={handleBuyAgain}
        disabled={isAddingToCart}
        className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[36px]"
      >
        <span>🔄</span>
        <span>{isAddingToCart ? "Ekleniyor..." : "Tekrar Satın Al"}</span>
      </button>

      {/* FAVORİLERE EKLE BUTONU */}
      <button
        onClick={handleToggleFavorite}
        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer min-h-[36px] ${
          isFavorite
            ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <span>{isFavorite ? "❤️" : "🤍"}</span>
        <span>{isFavorite ? "Favorilerde" : "Favoriye Ekle"}</span>
      </button>
    </div>
  );
}
