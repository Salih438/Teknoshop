"use client";

import { useState, useRef } from "react";
import { useCartStore } from "@/lib/store";
import Link from "next/link";
import toast from "react-hot-toast";
import FavoriteButton from "@/components/FavoriteButton"; 
import ProductReviews from "@/components/ProductReviews";

export default function ProductDetails({ product }: { product: any }) {
  const addItem = useCartStore((state) => state.addItem);
  const tabsRef = useRef<HTMLDivElement>(null); 
  
  // 🚀 KRİTİK DÜZELTME: Prisma'dan gelen resim dizisini (array) yakalıyoruz
  const imageList = product?.images?.length > 0 
    ? product.images.map((img: any) => img.imageUrl) 
    : (product?.imageUrl ? [product.imageUrl] : []);  

  const stock = product?.stock ?? 25; 
  const brandName = product?.brand?.name || "Belirtilmemiş";
  const categoryName = product?.category?.name || "Kategori Yok";
  const inStock = stock > 0;

  // Etkileşim State'leri
  const [mainImage, setMainImage] = useState(imageList[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("desc");

  // DİNAMİK YORUM VE YILDIZ HESAPLAMASI
  const totalReviews = product?.reviews?.length || 0;
  const averageRating = totalReviews > 0 
    ? (product.reviews.reduce((acc: any, curr: any) => acc + curr.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  // Sepete Ekleme Fonksiyonu
  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrls: imageList, 
      quantity: quantity, 
    });
    toast.success(`${quantity} adet ${product.name} sepete eklendi! 🛒`);
  };

  // Yorumlara Tıklayınca Sekmeye Kaydıran Fonksiyon
  const scrollToReviews = () => {
    setActiveTab("reviews");
    // Header'ın altında kalmaması için ufak bir gecikme ve offset ile kaydırma
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* --- ÜST KISIM (BREADCRUMB) --- */}
      <div className="text-xs sm:text-sm text-gray-500 mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 custom-scrollbar">
        <Link href="/" className="hover:text-blue-600 transition-colors">Ana Sayfa</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-blue-600 transition-colors">Ürünler</Link>
        {categoryName !== "Kategori Yok" && (
          <>
            <span>/</span>
            <Link href={`/products?category=${product.categoryId}`} className="hover:text-blue-600 transition-colors">{categoryName}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900 font-bold truncate">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        
        {/* --- MODÜL 1: GÖRSEL GALERİSİ (SOL) --- */}
        <div className="space-y-4">
          <div className="h-[400px] sm:h-[500px] bg-white rounded-3xl flex items-center justify-center p-6 shadow-sm border border-gray-100 overflow-hidden relative group">
            {mainImage ? (
              <img 
                src={mainImage} 
                alt={product.name} 
                className="max-w-full max-h-full object-contain transform transition-transform duration-700 group-hover:scale-110" 
              />
            ) : (
              <div className="flex flex-col items-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="font-medium">Görsel Bulunamadı</span>
              </div>
            )}
            
            <div className="absolute top-5 right-5 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-sm">
              <FavoriteButton 
                productId={product.id} 
                initialIsFavorite={product?.favorites?.length > 0} 
              />
            </div>
          </div>

          {imageList.length > 1 && (
            <div className="flex gap-4 overflow-x-auto py-2 custom-scrollbar">
              {imageList.map((img: string, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => setMainImage(img)}
                  className={`w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-2xl bg-white p-2 cursor-pointer border-2 transition-all duration-300 ${mainImage === img ? 'border-blue-600 shadow-md scale-105' : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'}`}
                >
                  <img src={img} alt={`Görsel ${idx + 1}`} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- MODÜL 2: ÜRÜN DETAYLARI VE AKSİYONLAR (SAĞ) --- */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">{brandName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{product.name}</h1>
          
          {/* DİNAMİK YILDIZ ALANI (SVG ile profesyonelleştirildi) */}
          <div className="flex flex-wrap items-center gap-3 mb-6 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-1 cursor-pointer" onClick={scrollToReviews}>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-5 h-5 ${star <= Math.round(Number(averageRating)) ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              {totalReviews > 0 ? (
                <>
                  <span className="text-sm font-bold text-gray-900 ml-1">{averageRating}</span>
                  <span className="text-sm text-gray-500 hover:text-blue-600 transition-colors ml-1">
                    ({totalReviews} Değerlendirme)
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-400 ml-2 font-medium">Henüz değerlendirilmedi</span>
              )}
            </div>
          </div>

          <div className="mb-8">
            <div className="text-4xl sm:text-5xl font-black text-blue-600 mb-5 tracking-tight">{product.price.toLocaleString('tr-TR')} ₺</div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${inStock ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {inStock ? (
                  <><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Stokta Var</>
                ) : (
                  <><div className="w-2 h-2 rounded-full bg-red-500"></div> Tükendi</>
                )}
              </span>
              <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                Ücretsiz Kargo
              </span>
            </div>
          </div>

          {/* Özellikler Kartı */}
          <div className="bg-white p-6 rounded-2xl mb-8 space-y-3 shadow-sm border border-gray-100">
            <div className="flex justify-between border-b border-gray-50 pb-3">
              <span className="text-gray-500 font-medium text-sm">Marka</span>
              <span className="text-gray-900 font-bold text-sm">{brandName}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-3">
              <span className="text-gray-500 font-medium text-sm">Kategori</span>
              <span className="text-gray-900 font-bold text-sm">{categoryName}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-3">
              <span className="text-gray-500 font-medium text-sm">Garanti Süresi</span>
              <span className="text-gray-900 font-bold text-sm">2 Yıl Türkiye Garantili</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-gray-500 font-medium text-sm">Stok Kodu</span>
              <span className="text-gray-500 font-mono font-bold text-xs bg-gray-100 px-2 py-1 rounded">#{product.id.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <div className="flex-1"></div>

          {/* Sepete Ekle Aksiyonları */}
          <div className="flex flex-col sm:flex-row gap-4 items-center p-5 sm:p-6 bg-white sm:bg-transparent border sm:border-none border-gray-200 rounded-t-3xl sm:rounded-none shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] sm:shadow-none fixed sm:relative bottom-0 left-0 right-0 z-40 sm:z-10">
            
            {/* Mobilde fiyatı tekrar göster (UX) */}
            <div className="sm:hidden w-full flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-500">Toplam Fiyat</span>
              <span className="text-2xl font-black text-blue-600">{(product.price * quantity).toLocaleString('tr-TR')} ₺</span>
            </div>

            <div className="flex items-center border-2 border-gray-200 rounded-xl bg-gray-50 w-full sm:w-auto overflow-hidden">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="px-5 py-3.5 text-gray-500 hover:bg-gray-200 hover:text-black transition-colors font-bold text-xl"
              >-</button>
              <span className="px-6 py-3.5 font-extrabold text-gray-900 bg-white border-x-2 border-gray-200 w-16 text-center flex-1 sm:flex-none">
                {quantity}
              </span>
              <button 
                onClick={() => setQuantity(q => Math.min(stock, q + 1))}
                className="px-5 py-3.5 text-gray-500 hover:bg-gray-200 hover:text-black transition-colors font-bold text-xl"
              >+</button>
            </div>

            <button 
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`flex-1 w-full py-4 sm:py-3.5 rounded-xl font-extrabold text-lg flex items-center justify-center gap-2 transition-all shadow-md ${
                inStock 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 hover:shadow-lg' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {inStock ? 'Sepete Ekle' : 'Tükendi'}
            </button>
          </div>
        </div>
      </div>

      {/* --- MODÜL 3: SEKMELER (TABS) --- */}
      <div ref={tabsRef} className="mt-16 bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden scroll-mt-24 mb-24 sm:mb-0">
        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab("desc")} 
            className={`flex items-center gap-2 px-6 sm:px-8 py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'desc' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
            Ürün Açıklaması
          </button>
          <button 
            onClick={() => setActiveTab("specs")} 
            className={`flex items-center gap-2 px-6 sm:px-8 py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'specs' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Teknik Özellikler
          </button>
          <button 
            onClick={() => setActiveTab("reviews")} 
            className={`flex items-center gap-2 px-6 sm:px-8 py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'reviews' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            Değerlendirmeler ({totalReviews})
          </button>
        </div>

        <div className="p-6 sm:p-10 min-h-[300px]">
          {activeTab === "desc" && (
            <div className="prose max-w-none text-gray-700 leading-relaxed animate-in fade-in duration-500">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-6">{product.name} Hakkında</h3>
              <div className="whitespace-pre-wrap font-medium">
                {product.description || "Bu ürün için henüz detaylı bir açıklama girilmemiştir. Sorularınız için satıcıya ulaşabilirsiniz."}
              </div>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="animate-in fade-in duration-500">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-6">Donanım ve Teknik Özellikler</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm text-left text-gray-600">
                  <tbody>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors"><th className="py-4 px-6 font-bold text-gray-900 bg-gray-50/50 w-1/3 sm:w-1/4 border-r border-gray-100">Marka</th><td className="py-4 px-6 font-medium">{brandName}</td></tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors"><th className="py-4 px-6 font-bold text-gray-900 bg-gray-50/50 w-1/3 sm:w-1/4 border-r border-gray-100">Model</th><td className="py-4 px-6 font-medium">{product.name}</td></tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors"><th className="py-4 px-6 font-bold text-gray-900 bg-gray-50/50 w-1/3 sm:w-1/4 border-r border-gray-100">Garanti Süresi</th><td className="py-4 px-6 font-medium">24 Ay</td></tr>
                    <tr className="hover:bg-gray-50 transition-colors"><th className="py-4 px-6 font-bold text-gray-900 bg-gray-50/50 w-1/3 sm:w-1/4 border-r border-gray-100">Orijinallik</th><td className="py-4 px-6 font-medium text-green-600 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> %100 Orijinal Ürün Garantisi</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="animate-in fade-in duration-500">
              <ProductReviews productId={product.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}