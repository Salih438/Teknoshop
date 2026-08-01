"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store";

interface MiniCartPopoverProps {
  onClose?: () => void;
}

export default function MiniCartPopover({ onClose }: MiniCartPopoverProps) {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const displayedItems = items.slice(0, 3);
  const extraItemsCount = Math.max(0, items.length - 3);

  return (
    <div
      role="dialog"
      aria-label="Sepet Önizleme"
      className="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-white shadow-2xl rounded-2xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200 p-4 text-xs sm:text-sm text-gray-800"
    >
      {/* BAŞLIK */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
          <span>🛒</span> Sepetim ({totalItems})
        </h4>
        <Link
          href="/cart"
          onClick={onClose}
          className="text-xs text-blue-600 font-bold hover:underline"
        >
          Sepete Git ➔
        </Link>
      </div>

      {/* SEPET BOŞSA */}
      {items.length === 0 ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto text-xl">
            🛒
          </div>
          <p className="font-bold text-gray-700 text-xs">Sepetinizde ürün bulunmamaktadır.</p>
          <Link
            href="/products"
            onClick={onClose}
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs"
          >
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        /* SEPET DOLUYSA */
        <div className="pt-3 space-y-3">
          {/* ÜRÜN LİSTESİ (İlk 3 Ürün) */}
          <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto custom-scrollbar">
            {displayedItems.map((item) => {
              const imageSrc = item.imageUrls?.[0] || "";
              return (
                <div key={item.cartItemId} className="py-2.5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={item.name}
                        width={44}
                        height={44}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-base">📦</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-xs line-clamp-1">{item.name}</p>
                    {item.variantId && (
                      <span className="text-[10px] text-gray-400 font-semibold block truncate">
                        Varyant: {item.variantId}
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-gray-500 font-medium">Adet: {item.quantity}</span>
                      <span className="font-extrabold text-blue-600">
                        {(item.price * item.quantity).toLocaleString("tr-TR")} ₺
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EKSTRA ÜRÜN BİLGİSİ */}
          {extraItemsCount > 0 && (
            <p className="text-[11px] text-center font-bold text-gray-400 bg-gray-50 py-1.5 rounded-lg border border-gray-100">
              +{extraItemsCount} ürün daha var
            </p>
          )}

          {/* ALT TOPLAM ALANI */}
          <div className="pt-2 border-t border-gray-100 flex justify-between items-center font-bold text-gray-900 text-sm">
            <span>Toplam Tutarlar:</span>
            <span className="text-base font-black text-blue-600">
              {totalPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
            </span>
          </div>

          {/* AKSİYON BUTONLARI */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/cart"
              onClick={onClose}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center min-h-[40px]"
            >
              Sepete Git
            </Link>
            <Link
              href="/checkout"
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition shadow-xs flex items-center justify-center min-h-[40px]"
            >
              Ödemeye Geç ➔
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
