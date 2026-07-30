"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface QuickStockUpdateProps {
  productId: string;
  currentStock: number;
  onUpdate?: () => void;
}

export default function QuickStockUpdate({ productId, currentStock, onUpdate }: QuickStockUpdateProps) {
  const [stock, setStock] = useState(currentStock);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStockChange = async (newVal: number) => {
    if (newVal < 0) return;
    const toastId = toast.loading("Stok güncelleniyor...");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/products/quick-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateStock",
          productId,
          newStock: newVal,
        }),
      });

      if (res.ok) {
        setStock(newVal);
        setIsEditing(false);
        toast.success(`Stok ${newVal} olarak güncellendi!`, { id: toastId });
        if (onUpdate) onUpdate();
      } else {
        toast.error("Stok güncelleme başarısız.", { id: toastId });
      }
    } catch (error) {
      toast.error("Sunucu hatası oluştu.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 bg-white border border-blue-300 p-1 rounded-xl shadow-sm animate-in fade-in duration-200">
        <button
          disabled={loading || stock <= 0}
          onClick={() => handleStockChange(Math.max(0, stock - 5))}
          className="w-6 h-6 bg-red-100 text-red-700 hover:bg-red-200 rounded font-black text-xs transition"
          title="-5 Eksilt"
        >
          -5
        </button>
        <button
          disabled={loading || stock <= 0}
          onClick={() => handleStockChange(Math.max(0, stock - 1))}
          className="w-6 h-6 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded font-black text-xs transition"
          title="-1 Eksilt"
        >
          -1
        </button>
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          className="w-12 text-center font-extrabold text-xs border border-gray-200 rounded p-1 outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          disabled={loading}
          onClick={() => handleStockChange(stock + 1)}
          className="w-6 h-6 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded font-black text-xs transition"
          title="+1 Arttır"
        >
          +1
        </button>
        <button
          disabled={loading}
          onClick={() => handleStockChange(stock + 5)}
          className="w-6 h-6 bg-green-100 text-green-700 hover:bg-green-200 rounded font-black text-xs transition"
          title="+5 Arttır"
        >
          +5
        </button>
        <button
          disabled={loading}
          onClick={() => handleStockChange(stock)}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs transition"
        >
          ✓ Kaydet
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="px-1.5 py-1 text-gray-400 hover:text-gray-600 font-bold text-xs"
        >
          ✕
        </button>
      </div>
    );
  }

  const stockBadgeClass =
    stock > 10
      ? "bg-green-50 text-green-700 border-green-200"
      : stock > 0
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <div className="flex items-center gap-1.5 group">
      <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${stockBadgeClass}`}>
        {stock > 0 ? `${stock} Adet` : "Tükendi"}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className="text-[10px] font-bold text-blue-600 hover:underline opacity-80 group-hover:opacity-100 transition"
        title="Hızlı Stok Güncelle"
      >
        ✏️ Değiştir
      </button>
    </div>
  );
}
