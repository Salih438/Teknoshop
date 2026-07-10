"use client"; // Bu satır, butonun tarayıcıda canlı çalışacağını söyler

import { useCartStore } from "../lib/store";

// Butonun dışarıdan hangi ürün bilgilerini alacağını tanımlıyoruz
interface AddToCartProps {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrls: string[]; // Resimlerimiz dizi formundaydı
  };
}

export default function AddToCartButton({ product }: AddToCartProps) {
  // store.ts'den sepete ekleme fonksiyonumuzu çağırıyoruz
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    // Fonksiyonu çalıştırıp ürün bilgilerini hafızaya gönderiyoruz
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      // GÜNCELLEME: Tekil string yerine diziyi (array) doğrudan aktarıyoruz
      imageUrls: product.imageUrls || [], 
    });
    
    // Geçici olarak çalıştığını anlamak için minik bir bildirim:
    alert(`${product.name} sepete eklendi! 🛒`);
  };

  return (
    <button 
      onClick={handleAddToCart}
      className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium active:scale-95"
    >
      Sepete Ekle
    </button>
  );
}