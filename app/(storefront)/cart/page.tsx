"use client";
import Image from "next/image";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import toast from "react-hot-toast";

export default function CartPage() {
  const { items, removeItem, increaseQuantity, decreaseQuantity, syncCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Next.js Hydration hatasını engellemek için bileşenin istemcide yüklendiğinden emin oluyoruz
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // 🚀 GÖREV 12: Sayfa açıldığında sepet stok ve aktiflik durumunu doğrula
  useEffect(() => {
    if (!mounted || items.length === 0) return;

    const validateCart = async () => {
      setIsValidating(true);
      try {
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            items: items.map(i => ({ 
              id: i.id, 
              variantId: i.variantId, 
              cartItemId: i.cartItemId 
            })) 
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.items) {
            const { removedCount, updatedCount } = syncCart(data.items);
            
            if (removedCount > 0 && updatedCount > 0) {
              toast.error(`${removedCount} ürün yayından kaldırıldığı için silindi, ${updatedCount} ürünün ise stok/fiyat bilgisi güncellendi.`, { duration: 6000 });
            } else if (removedCount > 0) {
              toast.error(`${removedCount} ürün yayından kaldırıldığı veya stok bittiği için sepetinizden silindi.`, { duration: 5000 });
            } else if (updatedCount > 0) {
              toast.error(`Sepetinizdeki ${updatedCount} ürünün stok veya fiyat bilgisi güncellendi.`, { duration: 5000 });
            }
          }
        }
      } catch (error) {
        console.error("Sepet doğrulaması başarısız:", error);
      } finally {
        setIsValidating(false);
      }
    };

    validateCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // YÜKLENİYOR (SKELETON) DURUMU: Tarayıcı veriyi okuyana kadar ekranın titremesini engeller
  if (!mounted) {
    return (
      <div className="py-8 max-w-5xl mx-auto px-4 mt-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-48 mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 mt-4 animate-in fade-in duration-500">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight flex items-center gap-3">
        Sepetiniz
        {isValidating && (
          <span className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Stoklar kontrol ediliyor...
          </span>
        )}
      </h1>

      {items.length === 0 ? (
        <div className="text-center p-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sepetiniz şu an boş</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Sepetinizde ürün bulunmamaktadır. Binlerce teknoloji ürünü arasından size en uygun olanı bulmak için vitrine göz atın.</p>
          <Link href="/products" className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all hover:scale-105 shadow-md">
            Ürünleri Keşfet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- SOL TARAF: ÜRÜN LİSTESİ --- */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.cartItemId} className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative">
                
                <div className="w-28 h-28 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center p-2 relative group cursor-pointer border border-gray-100">
                  <Link href={`/products/${item.id}`} className="w-full h-full flex items-center justify-center">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <Image src={item.imageUrls[0]} alt={item.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" width={500} height={500} />
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">Görsel Yok</span>
                    )}
                  </Link>
                </div>
                
                <div className="flex-grow text-center sm:text-left w-full pl-2">
                  <Link href={`/products/${item.id}`}>
                    <h3 className="font-bold text-lg text-gray-900 truncate max-w-[200px] md:max-w-sm hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-blue-600 font-extrabold mt-1 text-lg">{item.price.toLocaleString('tr-TR')} TL</p>
                  {item.maxStock !== undefined && item.maxStock < 5 && (
                    <p className="text-orange-500 text-xs font-bold mt-1">Son {item.maxStock} ürün!</p>
                  )}
                </div>
                
                {/* Miktar Kontrolü ve Silme Butonu */}
                <div className="flex flex-col items-center gap-3 w-full sm:w-auto pr-2">
                  <div className={`flex items-center border-2 rounded-xl bg-gray-50 overflow-hidden ${item.quantity >= (item.maxStock ?? 10) ? 'border-orange-200' : 'border-gray-100'}`}>
                    <button 
                      onClick={() => decreaseQuantity(item.cartItemId)}
                      disabled={item.quantity <= 1 || isValidating}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-200 hover:text-black transition-colors disabled:opacity-30 font-bold text-lg"
                      aria-label="Azalt"
                    >-</button>
                    <span className="w-10 text-center font-extrabold text-gray-900 bg-white border-x-2 border-gray-100 py-2">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => increaseQuantity(item.cartItemId)}
                      disabled={item.quantity >= (item.maxStock ?? 10) || isValidating}
                      className={`px-4 py-2 font-bold text-lg transition-colors ${item.quantity >= (item.maxStock ?? 10) ? 'text-gray-300 bg-gray-100 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200 hover:text-black'}`}
                      aria-label="Artır"
                      title={item.quantity >= (item.maxStock ?? 10) ? "Maksimum stoğa ulaştınız" : ""}
                    >+</button>
                  </div>
                  
                  <button 
                    onClick={() => removeItem(item.cartItemId)}
                    disabled={isValidating}
                    className="text-red-500 text-sm font-semibold hover:text-red-700 transition-colors flex items-center gap-1 p-1 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Kaldır
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* --- SAĞ TARAF: SİPARİŞ ÖZETİ --- */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 h-fit sticky top-28">
            <h3 className="text-xl font-extrabold text-gray-900 mb-6">Sipariş Özeti</h3>
            
            <div className="space-y-4 mb-6 text-gray-600 border-b border-gray-100 pb-6">
              <div className="flex justify-between items-center">
                <span className="font-medium">Ara Toplam</span>
                <span className="font-bold text-gray-900">{total.toLocaleString('tr-TR')} TL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Kargo</span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">Ücretsiz</span>
              </div>
            </div>

            <div className="flex justify-between items-center font-extrabold text-2xl mb-8">
              <span className="text-gray-900">Toplam</span>
              <span className="text-blue-600">{total.toLocaleString('tr-TR')} TL</span>
            </div>
            
            <Link 
              href={isValidating ? "#" : "/checkout"} 
              className={`flex items-center justify-center w-full text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg ${
                isValidating 
                  ? "bg-gray-400 cursor-not-allowed shadow-none" 
                  : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 hover:shadow-blue-600/30"
              }`}
            >
              {isValidating ? "Kontrol Ediliyor..." : "Alışverişi Tamamla"}
              {!isValidating && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </Link>

            {/* Güven Rozeti (Trust Badge) */}
            <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-sm font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              256-bit SSL Güvenli Ödeme
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}