"use client";

import Image from "next/image";
import { memo, useState } from "react";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import AddToCartButton from "@/components/AddToCartButton";

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  comparePrice?: number | null;
  imageUrl: string;
  stock: number;
  badgeText?: string;
  category?: {
    name: string;
  };
  reviews?: { rating: number }[];
  isFavorite?: boolean;
}

const ProductCard = memo(({ product }: { product: ProductCardProps }) => {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const totalReviews = product.reviews?.length || 0;
  const averageRating =
    totalReviews > 0
      ? ((product.reviews ?? []).reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
      : "0.0";

  const discountPercentage =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  return (
    <>
      <div className="border border-gray-100 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden bg-white flex flex-col hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)] transition-all duration-500 relative group w-full max-w-full hover:-translate-y-1">
        
        {/* Sağ Üstte Favori Butonu */}
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20">
          <FavoriteButton productId={product.id} initialIsFavorite={product.isFavorite} />
        </div>

        <Link href={`/products/${product.id}`} className="flex flex-col flex-grow group">
          
          {/* Ürün Görseli */}
          <div className="h-44 sm:h-56 w-full overflow-hidden bg-white relative flex items-center justify-center p-3 sm:p-6 border-b border-gray-50">
            
            {/* Sol Üstte ROZETLER (Çok Satan / Yeni / Stok / İndirim) */}
            <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 flex flex-col gap-1 items-start">
              {product.badgeText && (
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                  {product.badgeText}
                </span>
              )}

              {discountPercentage > 0 && (
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg bg-red-600 text-white shadow-xs">
                  %{discountPercentage} İNDİRİM
                </span>
              )}

              <span
                className={`px-2 py-0.5 text-[9px] uppercase tracking-widest font-extrabold rounded-md ${
                  product.stock > 0
                    ? "bg-green-50 text-green-600 border border-green-100"
                    : "bg-red-50 text-red-600 border border-red-100"
                }`}
              >
                {product.stock > 0 ? "STOKTA" : "TÜKENDİ"}
              </span>
            </div>

            {/* Görsel */}
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                width={500}
                height={500}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] sm:text-xs font-medium">Görsel Yok</span>
              </div>
            )}

            {/* Hover Ortasında Hızlı İncele Butonu (Desktop) */}
            <div className="absolute inset-x-4 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:block z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsQuickViewOpen(true);
                }}
                className="w-full bg-gray-900/90 hover:bg-gray-900 text-white font-extrabold text-xs py-2 rounded-xl backdrop-blur-xs transition shadow-md cursor-pointer"
              >
                👁 Hızlı İncele
              </button>
            </div>
          </div>

          {/* Ürün Bilgileri */}
          <div className="p-3.5 sm:p-5 flex flex-col flex-grow">
            <span className="text-[9px] sm:text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mb-1 truncate">
              {product.category?.name || "Teknoloji"}
            </span>

            <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-2 line-clamp-2 h-[2.5rem] sm:h-[2.75rem] flex items-start group-hover:text-blue-600 transition-colors leading-snug">
              {product.name}
            </h3>

            {/* DİNAMİK YILDIZ VE YORUM ALANI */}
            <div className="flex items-center gap-1 sm:gap-1.5 mt-auto pt-2.5 border-t border-gray-50">
              <div className="flex text-yellow-400 flex-shrink-0">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                      star <= Math.round(Number(averageRating)) ? "text-yellow-400" : "text-gray-200"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              {totalReviews > 0 ? (
                <div className="flex items-center gap-1 truncate">
                  <span className="font-bold text-[11px] sm:text-xs text-gray-900">{averageRating}</span>
                  <span className="text-gray-400 text-[9px] sm:text-[10px] font-bold tracking-wider">({totalReviews})</span>
                </div>
              ) : (
                <span className="text-gray-400 text-[9px] sm:text-[10px] font-medium whitespace-nowrap">Değerlendirme yok</span>
              )}
            </div>

          </div>
        </Link>

        {/* Alt Kısım: Fiyat (Üstte) ve Sepete Ekle Butonu (Tam Genişlikte Altında) */}
        <div className="px-3.5 pb-3.5 sm:px-5 sm:pb-5 flex flex-col gap-2.5 mt-auto pt-3 border-t border-gray-100">
          <div className="flex flex-col justify-end">
            {product.comparePrice && product.comparePrice > product.price ? (
              <span className="text-[11px] sm:text-xs text-gray-400 line-through font-bold block leading-none mb-0.5 whitespace-nowrap">
                {product.comparePrice.toLocaleString("tr-TR")}&nbsp;₺
              </span>
            ) : null}
            <p className="text-base sm:text-lg font-black text-blue-600 tracking-tight leading-none whitespace-nowrap font-mono">
              {product.price.toLocaleString("tr-TR")}&nbsp;₺
            </p>
          </div>

          <div className="w-full z-10">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                images: product.imageUrl ? [{ imageUrl: product.imageUrl }] : [],
                stock: product.stock,
              }}
              className="!w-full !py-2.5 !text-xs !rounded-xl min-h-[42px] flex items-center justify-center cursor-pointer whitespace-nowrap"
            />
          </div>
        </div>

      </div>

      {/* 🚀 ENHANCED QUICK VIEW / FAST PREVIEW MODAL */}
      {isQuickViewOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsQuickViewOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none"
        >
          <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative text-left border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* KAPAT BUTONU */}
            <button
              onClick={() => setIsQuickViewOpen(false)}
              aria-label="Hızlı inceleme penceresini kapat"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition w-9 h-9 flex items-center justify-center font-bold text-sm outline-none focus:ring-2 focus:ring-gray-300 z-10 cursor-pointer"
            >
              ✕
            </button>

            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-stretch">
              {/* SOL KOLON: ÜRÜN GÖRSELİ */}
              <div className="w-full sm:w-1/2 bg-gray-50 rounded-2xl p-4 sm:p-6 flex items-center justify-center min-h-[240px] sm:min-h-[300px] relative border border-gray-100/80">
                {product.badgeText && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs z-10">
                    {product.badgeText}
                  </span>
                )}
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="max-w-full max-h-[260px] object-contain"
                  />
                ) : (
                  <span className="text-gray-400 text-xs">Görsel Yok</span>
                )}
              </div>

              {/* SAĞ KOLON: ÜRÜN BİLGİLERİ VE EYLEMLER */}
              <div className="w-full sm:w-1/2 flex flex-col justify-between space-y-4">
                <div>
                  {/* Kategori ve Stok Rozeti */}
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <span className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">
                      {product.category?.name || "TEKNOLOJİ"}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-extrabold rounded-md ${
                        product.stock > 0
                          ? "bg-green-50 text-green-600 border border-green-100"
                          : "bg-red-50 text-red-600 border border-red-100"
                      }`}
                    >
                      {product.stock > 0 ? "Stokta Var" : "Stokta Yok"}
                    </span>
                  </div>

                  {/* Ürün Başlığı */}
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight mb-2">
                    {product.name}
                  </h3>

                  {/* Derecelendirme Özeti */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(Number(averageRating))
                              ? "text-amber-400"
                              : "text-gray-200"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="font-bold text-xs text-gray-900">{averageRating}</span>
                    <span className="text-gray-400 text-xs font-medium">({totalReviews} Değerlendirme)</span>
                  </div>

                  {/* Fiyat Görüntüleme */}
                  <div className="mb-4">
                    {product.comparePrice && product.comparePrice > product.price ? (
                      <span className="text-xs text-gray-400 line-through font-bold block mb-0.5">
                        {product.comparePrice.toLocaleString("tr-TR")} ₺
                      </span>
                    ) : null}
                    <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
                      {product.price.toLocaleString("tr-TR")} ₺
                    </p>
                  </div>

                  {/* Hızlı Özet Öne Çıkanlar */}
                  <div className="text-xs text-gray-500 font-medium space-y-1.5 border-t border-b border-gray-100 py-3 mb-6">
                    <p className="flex items-center gap-1.5">
                      <span className="text-blue-600 font-bold">✓</span> Orijinal Ürün & Resmi Garanti
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-blue-600 font-bold">✓</span> Ücretsiz Hızlı Kargo İmkânı
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-blue-600 font-bold">✓</span> 14 Gün Koşulsuz İade Kolaylığı
                    </p>
                  </div>
                </div>

                {/* İKİLİ AKSİYON BUTON GRUBU */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1">
                    <AddToCartButton
                      product={{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        images: product.imageUrl ? [{ imageUrl: product.imageUrl }] : [],
                        stock: product.stock,
                      }}
                      className="w-full !py-3.5 !bg-blue-600 hover:!bg-blue-700 !text-white !font-extrabold !rounded-xl !transition !shadow-md flex justify-center items-center gap-2 text-xs sm:text-sm min-h-[46px] cursor-pointer"
                    />
                  </div>
                  <Link
                    href={`/products/${product.id}`}
                    onClick={() => setIsQuickViewOpen(false)}
                    className="py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition flex justify-center items-center gap-1 text-xs sm:text-sm min-h-[46px] flex-shrink-0 cursor-pointer"
                  >
                    <span>Detay</span> ➔
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;