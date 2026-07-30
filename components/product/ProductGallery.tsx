"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string>(images[0] || "");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({ display: "none", backgroundPosition: "0% 0%" });

  // Escape tuşu ile Lightbox kapatma dinleyicisi
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: "block",
      backgroundPosition: `${x}% ${y}%`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle((prev) => ({ ...prev, display: "none" }));
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-4 w-full">
      {/* 🚀 BÜYÜK GÖRSEL VE HOVER ZOOM KUTUSU */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsLightboxOpen(true)}
        className="h-[320px] sm:h-[450px] lg:h-[520px] bg-white rounded-3xl p-4 sm:p-8 shadow-xs border border-gray-100 flex items-center justify-center relative group cursor-zoom-in overflow-hidden"
      >
        {selectedImage ? (
          <Image
            src={selectedImage}
            alt={productName}
            width={600}
            height={600}
            className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-gray-400 text-xs">Görsel Bulunamadı</span>
        )}

        {/* 🔍 MASAÜSTÜ BÜYÜTEÇ HOVER ZOOM OVERLAY */}
        <div
          style={{
            display: zoomStyle.display,
            backgroundImage: `url(${selectedImage})`,
            backgroundPosition: zoomStyle.backgroundPosition,
            backgroundSize: "200%",
          }}
          className="absolute inset-0 z-30 pointer-events-none rounded-3xl bg-no-repeat bg-white hidden lg:block border border-blue-200 shadow-2xl transition-opacity duration-200"
        />

        {/* İŞARETÇİ ROZETİ */}
        <span className="absolute bottom-4 right-4 bg-gray-900/70 hover:bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-xs shadow-xs hidden sm:flex items-center gap-1 z-20">
          <span>🔍 Büyütmek İçin Tıklayın</span>
        </span>
      </div>

      {/* 🚀 THUMBNAIL GALERİ ŞERİDİ */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto py-2 custom-scrollbar">
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedImage(img)}
              onMouseEnter={() => setSelectedImage(img)}
              className={`w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-2xl bg-white p-1.5 border-2 cursor-pointer transition-all duration-300 ${
                selectedImage === img
                  ? "border-blue-600 shadow-md scale-105 ring-2 ring-blue-100"
                  : "border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img} alt={`${productName} - ${idx + 1}`} width={100} height={100} className="w-full h-full object-contain rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* 🚀 LIGHTBOX FULLSCREEN MODAL OVERLAY */}
      {isLightboxOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsLightboxOpen(false);
            }
          }}
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300 select-none border-none outline-none"
        >
          {/* KAPAT BUTONU */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Görsel penceresini kapat"
            className="absolute top-5 right-5 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md cursor-pointer transition-all flex items-center justify-center w-11 h-11 text-xl font-bold outline-none focus:ring-2 focus:ring-white/50 shadow-2xl"
          >
            ✕
          </button>

          {/* BÜYÜK GÖRSEL KART KONTEYNERİ (FILL PROPORTIONAL EXPANSION) */}
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsLightboxOpen(false);
              }
            }}
            className="relative max-w-5xl max-h-[85vh] w-full h-[80vh] flex items-center justify-center p-2 sm:p-4 bg-transparent border-none outline-none"
          >
            <Image
              src={selectedImage}
              alt={productName}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-contain p-2 sm:p-6 rounded-2xl bg-white shadow-2xl transition-all duration-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}
