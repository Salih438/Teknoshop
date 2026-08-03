"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import toast from "react-hot-toast";

interface SavedItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export default function SaveForLaterSection() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vitrin_saved_for_later");
      if (saved) {
        Promise.resolve().then(() => setSavedItems(JSON.parse(saved)));
      }
    } catch (e) {}
  }, []);

  const moveToCart = (item: SavedItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrls: [item.imageUrl],
      quantity: 1,
    });
    const updated = savedItems.filter((i) => i.id !== item.id);
    setSavedItems(updated);
    localStorage.setItem("vitrin_saved_for_later", JSON.stringify(updated));
    toast.success(`${item.name} sepetinize geri eklendi! 🛒`);
  };

  const removeSavedItem = (id: string) => {
    const updated = savedItems.filter((i) => i.id !== id);
    setSavedItems(updated);
    localStorage.setItem("vitrin_saved_for_later", JSON.stringify(updated));
    toast.success("Ürün listenizden kaldırıldı.");
  };

  if (savedItems.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4 text-left my-6">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
          <span>🕒</span> Daha Sonra Satın Alınacaklar ({savedItems.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {savedItems.map((item) => (
          <div key={item.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 p-1 flex-shrink-0 flex items-center justify-center">
                {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="object-contain" /> : <span>📦</span>}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-xs line-clamp-1">{item.name}</p>
                <span className="font-black text-blue-600 text-xs">{item.price.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => moveToCart(item)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl transition shadow-xs"
              >
                Sepete Ekle
              </button>
              <button
                onClick={() => removeSavedItem(item.id)}
                className="text-gray-400 hover:text-red-600 text-xs font-bold p-1"
                aria-label={`${item.name} ürününü listeden kaldır`}
                title={`${item.name} ürününü listeden kaldır`}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
