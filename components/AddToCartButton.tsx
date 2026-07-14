"use client";

import { useCartStore } from "../lib/store";

// Butonun dışarıdan hangi ürün bilgilerini alacağını tanımlıyoruz
interface AddToCartProps {
  product: {
    id: string;
    name: string;
    price: number;
    // GÜNCELLEME: Prisma'dan gelen gerçek veri tipini (Nesne Dizisi) buraya ekledik
    images?: { imageUrl: string }[]; 
  };
}

export default function AddToCartButton({ product }: AddToCartProps) {
  // store.ts'den sepete ekleme fonksiyonumuzu çağırıyoruz
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    // 1. Prisma'dan gelen [{ imageUrl: "resim1.jpg" }] nesnesini map'leyerek
    // store.ts'in beklediği ["resim1.jpg"] (string dizisi) formatına çeviriyoruz.
    const extractedImageUrls = product.images?.map(img => img.imageUrl) || [];

    // 2. Fonksiyonu çalıştırıp dönüştürülmüş ürün bilgilerini hafızaya gönderiyoruz
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrls: extractedImageUrls, // Temizlenmiş string dizisini yolluyoruz
    });
    
    // Geçici olarak çalıştığını anlamak için minik bir bildirim:
    alert(`${product.name} sepete eklendi! 🛒`);
  };

  return (
    <button 
      onClick={handleAddToCart}
      className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium active:scale-95 w-full sm:w-auto"
    >
      Sepete Ekle
    </button>
  );
}