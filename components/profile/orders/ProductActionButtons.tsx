"use client";

import { useState } from "react";
import toast from "react-hot-toast";

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

  const handleBuyAgain = () => {
    setIsAddingToCart(true);
    setTimeout(() => {
      setIsAddingToCart(false);
      toast.success(`"${productName}" tekrar sepetinize eklendi! 🛒`);
    }, 400);
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
        className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 min-h-[38px]"
      >
        <span>🔄</span>
        <span>{isAddingToCart ? "Ekleniyor..." : "Tekrar Satın Al"}</span>
      </button>

      {/* FAVORİLERE EKLE BUTONU */}
      <button
        onClick={handleToggleFavorite}
        className={`font-extrabold px-3.5 py-2 rounded-xl text-xs transition border flex items-center gap-1.5 min-h-[38px] ${
          isFavorite
            ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
      >
        <span>{isFavorite ? "❤️" : "🤍"}</span>
        <span>{isFavorite ? "Favorilerinizde" : "Favorilere Ekle"}</span>
      </button>
    </div>
  );
}
