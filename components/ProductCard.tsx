"use client";
import Image from "next/image";


import { memo } from 'react';
import Link from 'next/link';
import FavoriteButton from "@/components/FavoriteButton";
import AddToCartButton from "@/components/AddToCartButton";

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string; 
  stock: number;    
  category?: {
    name: string;
  };
  reviews?: { rating: number }[]; 
}

// 🚀 OPTİMİZASYON 1: React.memo ile sarmalayarak gereksiz render'ları önlüyoruz
const ProductCard = memo(({ product }: { product: ProductCardProps }) => {
  
  // Yorum Hesaplamaları
  const totalReviews = product.reviews?.length || 0;
  const averageRating = totalReviews > 0 
    ? ((product.reviews ?? []).reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  return (
    <div className="border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden bg-white flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 relative group">
      
      {/* Sağ Üstte Favori Butonu */}
      <div className="absolute top-3 right-3 z-20">
        <FavoriteButton productId={product.id} />
      </div>

      <Link href={`/products/${product.id}`} className="flex flex-col flex-grow">
        
        {/* Ürün Görseli */}
        <div className="h-56 w-full overflow-hidden bg-white relative flex items-center justify-center p-6 border-b border-gray-50">
          
          {/* Sol Üstte Stok Rozeti */}
          <div className="absolute top-3 left-3 z-10">
             <span className={`px-2.5 py-1 text-[10px] uppercase tracking-widest font-extrabold rounded-lg ${product.stock > 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
               {product.stock > 0 ? 'STOKTA' : 'TÜKENDİ'}
             </span>
          </div>

          {product.imageUrl ? (
            <Image src={product.imageUrl} 
              alt={product.name} 
              loading="lazy"          // 🚀 OPTİMİZASYON 2: Tembel yükleme
              decoding="async"        // Sayfa yüklenmesini engellemez
              className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" 
            width={500} height={500} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-xs font-medium">Görsel Yok</span>
            </div>
          )}
        </div>

        {/* Ürün Bilgileri */}
        <div className="p-5 flex flex-col flex-grow">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mb-1.5">
            {product.category?.name || "Kategori Yok"}
          </span>
          
          <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* DİNAMİK YILDIZ ALANI (SVG ile profesyonelleştirildi) */}
          <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-gray-50">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className={`w-3.5 h-3.5 ${star <= Math.round(Number(averageRating)) ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {totalReviews > 0 ? (
              <>
                <span className="font-bold text-xs text-gray-900">{averageRating}</span>
                <span className="text-gray-400 text-[10px] font-bold tracking-wider">({totalReviews})</span>
              </>
            ) : (
              <span className="text-gray-400 text-[10px] font-medium">Değerlendirme yok</span>
            )}
          </div>

        </div>
      </Link>
        
      {/* Alt Kısım: Fiyat ve Sepete Ekle Butonu */}
      <div className="px-5 pb-5 flex items-center justify-between">
        <p className="text-lg font-black text-blue-600 tracking-tight">
          {product.price.toLocaleString('tr-TR')} ₺
        </p>
        
        {/* 🚀 OPTİMİZASYON 3: Kod tekrarını sildik, yazdığımız güçlü bileşeni çağırıyoruz */}
        <div className="w-auto z-10">
          <AddToCartButton 
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              images: product.imageUrl ? [{ imageUrl: product.imageUrl }] : [],
              stock: product.stock
            }}
            className="!px-3 !py-2 !text-xs !rounded-lg" // Karta özel boyutlandırma
          />
        </div>
      </div>

    </div>
  );
});

// React DevTools'da isminin isimsiz (Anonymous) görünmemesi için
ProductCard.displayName = "ProductCard";

export default ProductCard;