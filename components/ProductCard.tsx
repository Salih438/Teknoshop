"use client";

import Link from 'next/link';
import { useCartStore } from "@/lib/store";
import toast from 'react-hot-toast'; // Kullanıcıya sepete eklendi bildirimi vermek için

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string; 
  stock: number;    
  category?: {
    name: string;
  };
}

export default function ProductCard({ product }: { product: ProductCardProps }) {
  // Zustand sepetimizden ekleme fonksiyonunu çekiyoruz
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Linke tıklamayı (sayfa değişimini) engeller, sadece sepete ekler
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      // 🚀 İŞTE SİHİRLİ DOKUNUŞ BURASI: Tekil veritabanı resmini, sepetin istediği DİZİ formatına çeviriyoruz
      imageUrls: product.imageUrl ? [product.imageUrl] : [],
    });
    
    toast.success(`${product.name} sepete eklendi! 🛒`);
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white flex flex-col hover:shadow-lg transition-shadow duration-300">
      
      {/* 🚀 Ürünün resmine veya ismine tıklanabilir olması için Link ile sardık */}
      <Link href={`/products/${product.id}`} className="flex flex-col flex-grow">
        
        {/* Ürün Görseli */}
        <div className="h-48 w-full overflow-hidden bg-gray-100 relative group">
          
          {/* Sol Üstte Stok Rozeti */}
          <div className="absolute top-2 left-2 z-10">
             <span className={`px-2 py-1 text-xs font-bold rounded-md ${product.stock > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
               {product.stock > 0 ? 'STOKTA' : 'TÜKENDİ'}
             </span>
          </div>

          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
              Görsel Yok
            </div>
          )}
        </div>

        {/* Ürün Bilgileri */}
        <div className="p-4 flex flex-col flex-grow">
          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            {product.category?.name || "Teknoloji"}
          </span>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </div>
      </Link>
        
      {/* Alt Kısım: Fiyat ve Sepete Ekle Butonu */}
      <div className="px-4 pb-4 mt-auto flex items-center justify-between">
        <p className="text-xl font-bold text-blue-600">
          {product.price.toLocaleString('tr-TR')} ₺
        </p>
        
        <button 
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-bold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {product.stock > 0 ? 'Sepete Ekle' : 'Tükendi'}
        </button>
      </div>

    </div>
  );
}