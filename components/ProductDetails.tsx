"use client";

import { useState, useRef } from "react";
import { useCartStore } from "@/lib/store";
import Link from "next/link";
import toast from "react-hot-toast";
import ProductReviews from "@/components/ProductReviews";
import VariantSelector, { ProductVariant } from "@/components/VariantSelector";
import ProductGallery from "@/components/product/ProductGallery";
import StickyBuyBar from "@/components/product/StickyBuyBar";
import InstallmentModal from "@/components/product/InstallmentModal";
import RelatedProductsSlider from "@/components/product/RelatedProductsSlider";
import RecentlyViewedProducts from "@/components/product/RecentlyViewedProducts";
import { ProductCardProps } from "@/components/ProductCard";

interface ProductDetailsProps {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: number;
  categoryId: string | null;
  imageUrl: string;
  images?: { imageUrl: string }[];
  category?: { name: string } | null;
  brand?: { name: string } | null;
  reviews?: { rating: number }[];
  favorites?: { id: string }[];
  comparePrice?: number | null;
  variants?: ProductVariant[];
}

export default function ProductDetails({
  product,
  relatedProducts = [],
}: {
  product: ProductDetailsProps;
  relatedProducts?: ProductCardProps[];
}) {
  const addItem = useCartStore((state) => state.addItem);
  const tabsRef = useRef<HTMLDivElement>(null);

  const imageList = [product.imageUrl, ...(product.images?.map((img) => img.imageUrl) || [])].filter(Boolean);

  const brandName = product?.brand?.name || "Belirtilmemiş";
  const categoryName = product?.category?.name || "Kategori Yok";

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("desc");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const currentPrice = selectedVariant?.discountedPrice || selectedVariant?.price || product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const inStock = currentStock > 0;

  const totalReviews = product?.reviews?.length || 0;
  const averageRating =
    totalReviews > 0
      ? ((product.reviews ?? []).reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
      : "0.0";

  const currentProductForCard: ProductCardProps = {
    id: product.id,
    name: product.name,
    price: currentPrice,
    comparePrice: product.comparePrice,
    imageUrl: imageList[0] || "",
    stock: currentStock,
    category: product.category ?? undefined,
    reviews: product.reviews,
  };

  const handleAddToCart = () => {
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast.error("Lütfen sepete eklemeden önce renk ve hafıza seçimi yapın.", { icon: "⚠️" });
      return;
    }

    let finalProductName = product.name;
    if (selectedVariant) {
      const options =
        selectedVariant.combination ||
        [selectedVariant.color, selectedVariant.storage].filter(Boolean).join(" • ");
      if (options) finalProductName = `${product.name} (${options})`;
    }

    addItem({
      id: product.id,
      name: finalProductName,
      price: currentPrice,
      imageUrls: imageList,
      quantity: quantity,
      variantId: selectedVariant?.id,
      maxStock: currentStock,
    });

    toast.success(`${quantity} adet ürün sepete eklendi! 🛒`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Ürün bağlantısı panoya kopyalandı! 📋");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 sm:pb-8 animate-in fade-in duration-500 w-full overflow-x-clip text-left">
      
      {/* 1. BREADCRUMB */}
      <div className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 custom-scrollbar">
        <Link href="/" className="hover:text-blue-600 transition-colors">
          Ana Sayfa
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-blue-600 transition-colors">
          Ürünler
        </Link>
        {categoryName !== "Kategori Yok" && (
          <>
            <span>/</span>
            <Link
              href={`/products?category=${product.categoryId}`}
              className="hover:text-blue-600 transition-colors"
            >
              {categoryName}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900 font-bold truncate">{product.name}</span>
      </div>

      {/* 2. ÜRÜN BİLGİLERİ VE SATIN ALMA ALANI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        
        {/* PREMİUM GÖRSEL GALERİSİ */}
        <div>
          <ProductGallery images={imageList} productName={product.name} />
        </div>

        {/* SATIN ALMA DETAYLARI */}
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm font-extrabold text-blue-600 uppercase tracking-wider">
              {brandName}
            </span>
            <button
              onClick={handleShare}
              className="text-xs font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1 bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition min-h-[36px]"
            >
              <span>🔗 Paylaş</span>
            </button>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-snug sm:leading-tight">
            {product.name}
          </h1>

          {/* CRO ROZETLERİ */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-amber-200">
              🔥 Çok Satan Ürün
            </span>
            <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-200">
              🚚 Bugün Kargoda
            </span>
            <span className="bg-blue-100 text-blue-900 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-blue-200">
              👁️ 14 Kişi İncelemekte
            </span>
          </div>

          {/* YILDIZ VE DEĞERLENDİRME */}
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => setActiveTab("reviews")}>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(Number(averageRating)) ? "text-yellow-400" : "text-gray-200"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-extrabold text-gray-900 ml-1">
                {averageRating} ({totalReviews} Değerlendirme)
              </span>
            </div>
          </div>

          {/* VARYASYON SEÇİCİ */}
          {product.variants && product.variants.length > 0 && (
            <VariantSelector
              variants={product.variants}
              onSelect={(variant) => {
                setSelectedVariant(variant);
                setQuantity(1);
              }}
            />
          )}

          {/* FİYAT VE TAKSİT BİLGİSİ */}
          <div className="p-5 sm:p-6 bg-white border border-gray-200 rounded-3xl shadow-xs space-y-3">
            <div>
              {product.comparePrice && product.comparePrice > currentPrice && (
                <span className="text-sm text-gray-400 line-through font-bold block">
                  {product.comparePrice.toLocaleString("tr-TR")} ₺
                </span>
              )}
              <div className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
                {currentPrice.toLocaleString("tr-TR")}{" "}
                <span className="text-xl sm:text-2xl text-gray-400">₺</span>
              </div>
            </div>

            <InstallmentModal price={currentPrice} />

            {inStock && currentStock <= 5 && (
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <div className="flex justify-between text-xs font-bold text-red-600 animate-pulse">
                  <span>⚠️ Kritik Stok Alarmı!</span>
                  <span>Son {currentStock} Adet Kaldı</span>
                </div>
                <div className="w-full bg-red-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-red-600 h-full w-[85%] rounded-full animate-pulse" />
                </div>
              </div>
            )}
          </div>

          {/* ADET VE SEPETE EKLE BUTONU */}
          <div className="flex gap-4 items-center pt-2">
            <div className="flex items-center border-2 border-gray-200 rounded-2xl bg-gray-50 overflow-hidden min-h-[48px]">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-200 font-bold text-lg min-h-[44px] min-w-[44px]"
              >
                -
              </button>
              <span className="px-4 py-2.5 font-black text-gray-900 bg-white border-x-2 border-gray-200 w-12 text-center text-sm">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-200 font-bold text-lg min-h-[44px] min-w-[44px]"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`flex-1 py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg min-h-[48px] ${
                inStock
                  ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span>🛒 {inStock ? "Sepete Ekle" : "Tükendi"}</span>
            </button>
          </div>

          {/* GÜVEN ROZETLERİ */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100 text-xs font-bold text-gray-700">
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2">
              <span>🔒 256-Bit SSL Koruma</span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2">
              <span>↩️ 14 Gün Ücretsiz İade</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. YORUMLAR VE SEKMELER */}
      <div ref={tabsRef} className="mt-12 bg-white border border-gray-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto custom-scrollbar">
          {[
            { id: "desc", label: "Ürün Açıklaması" },
            { id: "specs", label: "Teknik Özellikler" },
            { id: "reviews", label: `Değerlendirmeler (${totalReviews})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-extrabold text-xs sm:text-sm transition-colors whitespace-nowrap min-h-[44px] ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 border-t-2 border-blue-600 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-10 min-h-[200px]">
          {activeTab === "desc" && (
            <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4">
              <h3 className="text-xl font-black text-gray-900">{product.name} Hakkında</h3>
              <div className="whitespace-pre-wrap font-medium text-sm sm:text-base">
                {product.description || "Bu ürün için henüz detaylı bir açıklama girilmemiştir."}
              </div>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="space-y-4">
              <h3 className="text-xl font-black text-gray-900">Teknik Özellikler</h3>
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-xs sm:text-sm text-left text-gray-600">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <th className="py-3 px-4 font-bold text-gray-900 bg-gray-50 w-1/3">Marka</th>
                      <td className="py-3 px-4 font-medium">{brandName}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <th className="py-3 px-4 font-bold text-gray-900 bg-gray-50 w-1/3">Model</th>
                      <td className="py-3 px-4 font-medium">{product.name}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <th className="py-3 px-4 font-bold text-gray-900 bg-gray-50 w-1/3">Garanti</th>
                      <td className="py-3 px-4 font-medium">24 Ay Resmi Üretici Garantisi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              <ProductReviews productId={product.id} />
            </div>
          )}
        </div>
      </div>

      {/* 4. REVİZYON 2: BENZER ÜRÜNLER SLIDER (ProductCard Yeniden Kullanılarak) */}
      <RelatedProductsSlider products={relatedProducts} />

      {/* 5. REVİZYON 3: SON İNCELEDİKLERİNİZ SLIDER (LocalStorage Sync) */}
      <RecentlyViewedProducts currentProduct={currentProductForCard} />

      {/* STICKY BOTTOM SATIN ALMA BARI */}
      <StickyBuyBar
        product={{
          id: product.id,
          name: product.name,
          price: currentPrice,
          imageUrl: imageList[0] || "",
          stock: currentStock,
        }}
      />
    </div>
  );
}