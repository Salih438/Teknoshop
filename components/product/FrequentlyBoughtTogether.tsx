"use client";

import { useState } from "react";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import toast from "react-hot-toast";

interface BundleItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export default function FrequentlyBoughtTogether({ mainProduct }: { mainProduct: BundleItem }) {
  const addItem = useCartStore((state) => state.addItem);

  const mockAccessories: BundleItem[] = [
    {
      id: `${mainProduct.id}-acc1`,
      name: "Orijinal 20W USB-C Hızlı Şarj Adaptörü",
      price: 699,
      imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: `${mainProduct.id}-acc2`,
      name: "Şeffaf Darbe Emici Magsafe Kılıf",
      price: 349,
      imageUrl: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?q=80&w=400&auto=format&fit=crop",
    },
  ];

  const [selectedItems, setSelectedItems] = useState<string[]>([
    mainProduct.id,
    mockAccessories[0].id,
    mockAccessories[1].id,
  ]);

  const allItems = [mainProduct, ...mockAccessories];

  const toggleItem = (id: string) => {
    if (id === mainProduct.id) return; // Ana ürün çıkarılamaz
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const totalPrice = allItems
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  const handleAddAllToCart = () => {
    const selectedBundle = allItems.filter((item) => selectedItems.includes(item.id));
    selectedBundle.forEach((item) => {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        imageUrls: [item.imageUrl],
        quantity: 1,
        maxStock: 50,
      });
    });
    toast.success(`${selectedBundle.length} ürün avantajlı paket olarak sepete eklendi! 🛒`);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6 text-left my-8">
      <div>
        <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
          🎁 AVANTAJLI PAKET FIRSATI
        </span>
        <h3 className="text-lg sm:text-xl font-black text-gray-900 mt-1">Birlikte Sık Alınanlar</h3>
        <p className="text-xs text-gray-500 font-medium">Bu ürünle birlikte en çok tercih edilen tamamlayıcı aksesuarlar.</p>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        
        {/* ÜRÜN KARTLARI SIRALAMASI */}
        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar py-2 w-full lg:w-auto">
          {allItems.map((item, idx) => {
            const isSelected = selectedItems.includes(item.id);
            return (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  onClick={() => toggleItem(item.id)}
                  className={`p-3 bg-white rounded-2xl border-2 transition-all cursor-pointer w-32 sm:w-36 text-center space-y-2 flex-shrink-0 ${
                    isSelected ? "border-blue-600 shadow-md" : "border-gray-200 opacity-60"
                  }`}
                >
                  <div className="w-16 h-16 mx-auto relative">
                    <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="object-contain" />
                  </div>
                  <p className="text-[11px] font-bold text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                  <span className="text-xs font-black text-blue-600 block">{item.price.toLocaleString("tr-TR")} ₺</span>
                </div>

                {idx < allItems.length - 1 && <span className="text-gray-300 font-black text-xl">+</span>}
              </div>
            );
          })}
        </div>

        {/* PAKET FİYATI VE TEK TIKLA SEPETE EKLE */}
        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 w-full lg:w-72 text-center space-y-3">
          <div>
            <span className="text-xs text-gray-500 font-bold block">PAKET TOPLAM FİYATI</span>
            <span className="text-2xl font-black text-blue-600">{totalPrice.toLocaleString("tr-TR")} ₺</span>
          </div>

          <button
            onClick={handleAddAllToCart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl transition text-xs shadow-md min-h-[44px]"
          >
            🛒 Seçilenleri Sepete Ekle ({selectedItems.length} Ürün)
          </button>
        </div>

      </div>
    </div>
  );
}
