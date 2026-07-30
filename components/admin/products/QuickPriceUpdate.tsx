"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface QuickPriceUpdateProps {
  productId: string;
  currentPrice: number;
  currentComparePrice?: number | null;
  onUpdate?: () => void;
}

export default function QuickPriceUpdate({
  productId,
  currentPrice,
  currentComparePrice,
  onUpdate,
}: QuickPriceUpdateProps) {
  const [price, setPrice] = useState(currentPrice);
  const [comparePrice, setComparePrice] = useState(currentComparePrice || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSavePrice = async () => {
    if (price < 0) return;
    const toastId = toast.loading("Fiyat güncelleniyor...");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/products/quick-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePrice",
          productId,
          price,
          comparePrice: comparePrice > 0 ? comparePrice : null,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        toast.success("Fiyat başarıyla güncellendi!", { id: toastId });
        if (onUpdate) onUpdate();
      } else {
        toast.error("Fiyat güncelleme başarısız.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası oluştu.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1 bg-white border border-blue-300 p-2 rounded-xl shadow-sm text-xs animate-in fade-in duration-200">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-gray-400">Satış:</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-20 font-extrabold border border-gray-200 rounded p-1 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span>₺</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-gray-400">Eski:</span>
          <input
            type="number"
            value={comparePrice}
            onChange={(e) => setComparePrice(Number(e.target.value))}
            placeholder="0"
            className="w-20 font-medium border border-gray-200 rounded p-1 outline-none focus:ring-1 focus:ring-blue-500 text-gray-500"
          />
          <span>₺</span>
        </div>

        <div className="flex items-center gap-1 mt-1 justify-end">
          <button
            onClick={() => setIsEditing(false)}
            className="px-2 py-0.5 text-gray-500 hover:text-gray-700 font-bold"
          >
            İptal
          </button>
          <button
            disabled={loading}
            onClick={handleSavePrice}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg transition"
          >
            Kaydet
          </button>
        </div>
      </div>
    );
  }

  const hasDiscount = currentComparePrice && currentComparePrice > currentPrice;

  return (
    <div className="flex items-center gap-1.5 group">
      <div>
        <p className="font-extrabold text-gray-900 text-xs sm:text-sm">
          {price.toLocaleString("tr-TR")} ₺
        </p>
        {hasDiscount && (
          <p className="text-[10px] text-gray-400 line-through">
            {currentComparePrice.toLocaleString("tr-TR")} ₺
          </p>
        )}
      </div>
      <button
        onClick={() => setIsEditing(true)}
        className="text-[10px] font-bold text-blue-600 hover:underline opacity-80 group-hover:opacity-100 transition"
        title="Hızlı Fiyat Güncelle"
      >
        ✏️
      </button>
    </div>
  );
}
