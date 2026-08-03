"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import toast from "react-hot-toast";
import SaveForLaterSection from "@/components/cart/SaveForLaterSection";
import CampaignInfoBar from "@/components/cart/CampaignInfoBar";
import CartRecommendations from "@/components/cart/CartRecommendations";
import { ProductCardProps } from "@/components/ProductCard";

export default function CartPage() {
  const { items, removeItem, increaseQuantity, decreaseQuantity, syncCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [storeSettings, setStoreSettings] = useState<{ shippingFee: number; freeShippingThreshold: number } | null>(null);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductCardProps[]>([]);

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStoreSettings(data);
      })
      .catch((err) => console.error("Ayarlar çekilemedi:", err));
  }, []);

  const hasValidatedRef = useRef(false);

  useEffect(() => {
    if (!mounted || items.length === 0 || hasValidatedRef.current) return;
    hasValidatedRef.current = true;

    const validateCart = async () => {
      setIsValidating(true);
      try {
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({
              id: i.id,
              variantId: i.variantId,
              cartItemId: i.cartItemId,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.items) {
            const { removedCount, updatedCount } = syncCart(data.items);
            if (removedCount > 0) {
              toast.error(`${removedCount} ürün stok bittiği için sepetinizden silindi.`);
            } else if (updatedCount > 0) {
              toast.error(`Sepetinizdeki ${updatedCount} ürünün fiyat/stok bilgisi güncellendi.`);
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
  }, [mounted, items, syncCart]);

  // 🤖 AI SEPET ÖNERİLERİNİ ÇEK
  useEffect(() => {
    if (!mounted) return;
    const cartProductIds = items.map((i) => i.id);
    fetch("/api/cart/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: cartProductIds }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.recommendations) setRecommendedProducts(data.recommendations);
      })
      .catch((err) => console.error("Sepet önerileri çekilemedi:", err));
  }, [mounted, items]);

  const saveForLater = (item: {
    id: string;
    name: string;
    price: number;
    imageUrls?: string[];
    cartItemId: string;
  }) => {
    try {
      const existing = localStorage.getItem("vitrin_saved_for_later");
      const list = existing ? JSON.parse(existing) : [];
      const newItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrls?.[0] || "",
      };
      if (!list.some((i: { id: string }) => i.id === item.id)) {
        list.push(newItem);
        localStorage.setItem("vitrin_saved_for_later", JSON.stringify(list));
      }
      removeItem(item.cartItemId);
      toast.success(`${item.name} 'Daha Sonra Satın Al' listenize eklendi! 🕒`);
    } catch (e) {}
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const defaultFee = storeSettings?.shippingFee ?? 149.99;
  const threshold = storeSettings?.freeShippingThreshold ?? 5000.0;
  const isFreeShipping = total >= threshold;
  const shippingCost = isFreeShipping ? 0 : defaultFee;
  const netTotal = Math.max(0, total + shippingCost);
  const progressPercentage = Math.min(100, (total / threshold) * 100);
  const remainingForFreeShipping = Math.max(0, threshold - total);

  if (!mounted) {
    return (
      <div className="py-8 max-w-5xl mx-auto px-4 mt-4 animate-pulse w-full">
        <div className="h-10 bg-gray-200 rounded-xl w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-32 bg-gray-100 rounded-2xl" />
            <div className="h-32 bg-gray-100 rounded-2xl" />
          </div>
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8 max-w-6xl mx-auto px-4 mt-2 sm:mt-4 pb-28 lg:pb-8 animate-in fade-in duration-500 w-full overflow-x-clip text-left">
      
      {/* BAŞLIK VE STOK KONTROL DURUMU */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          Alışveriş Sepetim ({items.length} Ürün)
        </h1>
        {isValidating && (
          <span className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse font-bold">
            ⚡ Canlı Stoklar Kontrol Ediliyor...
          </span>
        )}
      </div>

      {/* BOŞ SEPET EKRANI */}
      {items.length === 0 ? (
        <div className="space-y-12">
          <div className="text-center p-8 sm:p-16 bg-white rounded-3xl shadow-xs border border-gray-200 flex flex-col items-center justify-center space-y-4">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl shadow-inner">
              🛒
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Sepetiniz Şu An Boş</h2>
            <p className="text-gray-500 text-xs sm:text-sm max-w-md font-medium">
              Sepetinizde ürün bulunmamaktadır. Teknolojinin en yeni Apple ve aksesuar fırsatlarını hemen keşfedin.
            </p>
            <Link
              href="/products"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-md text-sm min-h-[48px] inline-flex items-center justify-center gap-2"
            >
              <span>Ürünleri Keşfet</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <SaveForLaterSection />
        </div>
      ) : (

        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* SOL TARAF: ÜRÜN LİSTESİ VE KAMPANYA BİLGİ BARI */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* FREE SHIPPING PROGRESS BAR */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-2">
                <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                  <span className="text-gray-800 flex items-center gap-1.5">
                    🚚 <strong>Kargo Durumu:</strong>
                  </span>
                  {isFreeShipping ? (
                    <span className="text-green-600 font-black">Tebrikler! Kargonuz BEDAVA 🎉</span>
                  ) : (
                    <span className="text-blue-600 font-extrabold">
                      Ücretsiz kargo için <strong>{remainingForFreeShipping.toLocaleString("tr-TR")} ₺</strong> daha ekleyin!
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden p-0.5 border border-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isFreeShipping ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gradient-to-r from-blue-500 to-indigo-600"
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* ÜRÜN KARTLARI LİSTESİ */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex flex-col sm:flex-row items-center gap-4 p-4 sm:p-5 bg-white rounded-3xl shadow-xs border border-gray-200 hover:shadow-md transition-all relative w-full"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-white rounded-2xl p-2 border border-gray-100 flex items-center justify-center">
                        <Link href={`/products/${item.id}`}>
                          {item.imageUrls && item.imageUrls.length > 0 ? (
                            <Image src={item.imageUrls[0]} alt={item.name} width={200} height={200} className="object-contain max-h-full" />
                          ) : (
                            <span className="text-xs text-gray-300">Görsel Yok</span>
                          )}
                        </Link>
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.id}`}>
                          <h3 className="font-extrabold text-sm sm:text-base text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors leading-snug">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-blue-600 font-black text-base sm:text-lg mt-0.5">{item.price.toLocaleString("tr-TR")} ₺</p>
                        {item.maxStock !== undefined && item.maxStock < 5 && (
                          <span className="text-xs text-red-600 font-bold block animate-pulse">⚠️ Son {item.maxStock} adet kaldı!</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center w-full sm:w-auto sm:flex-col sm:items-end gap-3 pt-3 sm:pt-0 border-t sm:border-none border-gray-100 ml-auto">
                      
                      <div className="flex items-center border-2 border-gray-200 rounded-2xl bg-gray-50 overflow-hidden min-h-[44px]">
                        <button
                          onClick={() => decreaseQuantity(item.cartItemId)}
                          disabled={item.quantity <= 1}
                          className="px-3.5 py-2 text-gray-600 hover:bg-gray-200 font-bold text-base min-h-[44px] min-w-[44px]"
                          aria-label={`${item.name} miktarını azalt`}
                          title={`${item.name} miktarını azalt`}
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-black text-gray-900 bg-white border-x-2 border-gray-200 py-2 text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => increaseQuantity(item.cartItemId)}
                          disabled={item.quantity >= (item.maxStock ?? 10)}
                          className="px-3.5 py-2 text-gray-600 hover:bg-gray-200 font-bold text-base min-h-[44px] min-w-[44px]"
                          aria-label={`${item.name} miktarını artır`}
                          title={`${item.name} miktarını artır`}
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => saveForLater(item)}
                          className="text-xs font-bold text-gray-500 hover:text-blue-600 transition"
                          aria-label={`${item.name} ürününü daha sonra satın almak için kaydet`}
                          title={`${item.name} ürününü daha sonra satın almak için kaydet`}
                        >
                          🕒 Daha Sonra Al
                        </button>

                        <button
                          onClick={() => setItemToRemove(item.cartItemId)}
                          className="text-xs font-bold text-red-500 hover:text-red-700 transition"
                          aria-label={`${item.name} ürününü sepetten kaldır`}
                          title={`${item.name} ürününü sepetten kaldır`}
                        >
                          ✕ Sil
                        </button>
                      </div>

                    </div>

                  </div>
                ))}
              </div>

              {/* KAMPANYA BİLGİ BARI */}
              <CampaignInfoBar />

              {/* DAHA SONRA SATIN ALINACAKLAR BÖLÜMÜ */}
              <SaveForLaterSection />

            </div>

            {/* SAĞ TARAF: SİPARİŞ ÖZETİ */}
            <div className="space-y-4 lg:sticky lg:top-24 h-fit">
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3">Sipariş Özeti</h3>

                <div className="space-y-3 text-xs sm:text-sm text-gray-600 border-b border-gray-100 pb-4 font-medium">
                  <div className="flex justify-between">
                    <span>Ara Toplam</span>
                    <span className="font-bold text-gray-900">{total.toLocaleString("tr-TR")} ₺</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Kargo Ücreti</span>
                    {isFreeShipping ? (
                      <span className="font-black text-green-600">ÜCRETSIZ</span>
                    ) : (
                      <span className="font-bold text-gray-900">{shippingCost.toLocaleString("tr-TR")} ₺</span>
                    )}
                  </div>

                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Tahmini KDV (%20 Dahil)</span>
                    <span>{Math.round(netTotal * 0.2).toLocaleString("tr-TR")} ₺</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-black text-gray-900 text-base">Genel Toplam</span>
                  <span className="text-2xl font-black text-blue-600">{netTotal.toLocaleString("tr-TR")} ₺</span>
                </div>

                <Link
                  href="/checkout"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-md text-sm sm:text-base min-h-[48px] flex items-center justify-center gap-2"
                >
                  <span>Alışverişi Tamamla</span>
                  <span>&rarr;</span>
                </Link>

                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-2">
                  <span>⚡ <strong>Tahmini Teslimat:</strong> İstanbul/Ankara 24 Saatte Kargoda!</span>
                </div>

                <div className="pt-2 text-center text-[10px] font-bold text-gray-400 space-y-1">
                  <p>🔒 256-Bit SSL Koruma • ↩️ 14 Gün Kolay İade</p>
                  <p>💳 Visa, MasterCard, Troy, Papara, Axess, World</p>
                </div>

              </div>
            </div>

          </div>

          {/* 🤖 AI SEPET ÖNERİLERİ */}
          <CartRecommendations products={recommendedProducts} />

        </div>

      )}

      {/* MOBİL STICKY BOTTOM CHECKOUT BUTTON */}
      {items.length > 0 && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 p-3 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div>
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Toplam</span>
            <span className="text-xl font-black text-blue-600">{netTotal.toLocaleString("tr-TR")} ₺</span>
          </div>

          <Link
            href="/checkout"
            className="flex-1 bg-blue-600 text-white font-black text-sm py-3.5 rounded-2xl shadow-md flex items-center justify-center min-h-[44px]"
          >
            Siparişi Tamamla ➔
          </Link>
        </div>
      )}

      {/* SILME ONAY MODALI */}
      {itemToRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-remove-modal-title"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-gray-100">
            <span className="text-3xl block">⚠️</span>
            <h3 id="cart-remove-modal-title" className="font-black text-gray-900 text-base">
              Ürünü Sepetten Çıkarmak İstiyor Musunuz?
            </h3>
            <p className="text-xs text-gray-500 font-medium">Bu ürünü silebilir veya daha sonra satın almak üzere saklayabilirsiniz.</p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  removeItem(itemToRemove);
                  setItemToRemove(null);
                  toast.success("Ürün sepetinizden silindi.");
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-2.5 rounded-xl text-xs"
                aria-label="Ürünü sepetten silmeyi onayla"
              >
                Evet, Sepetten Sil
              </button>
              <button
                onClick={() => setItemToRemove(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold py-2.5 rounded-xl text-xs"
                aria-label="Silme işlemini iptal et"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}