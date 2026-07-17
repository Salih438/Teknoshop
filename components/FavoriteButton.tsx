"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { toggleFavorite } from "@/actions/favorite";

interface FavoriteButtonProps {
  productId: string;
  initialIsFavorite?: boolean;
  className?: string; // 🚀 BİLEŞENİ ÖZGÜRLEŞTİREN YENİ PROP
}

export default function FavoriteButton({ 
  productId, 
  initialIsFavorite = false,
  className = "" // Varsayılan olarak boş string
}: FavoriteButtonProps) {
  const { userId } = useAuth(); // Clerk ile aktif oturum kontrolü
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);

  // Arka planda revalidatePath çalıştığında, sunucudan gelen yeni değeri anında butona yansıtır.
  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    // BUBBLING ENGELİ: Kartın (Link) tıklanmasını kesin olarak durdurur.
    e.stopPropagation(); 
    
    if (!userId) {
      toast.error("Favorilere eklemek için lütfen giriş yapın! 🔒");
      return;
    }

    if (loading) return;

    // Optimistic UI Update: Kalbi anında kırmızı/gri yapıyoruz
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);
    setLoading(true);

    const result = await toggleFavorite(productId);

    if (result.success) {
      if (result.isFavorite) {
        toast.success("Favorilerinize eklendi! ❤️");
      } else {
        toast.success("Favorilerinizden çıkarıldı! 💔");
      }
    } else {
      // Sunucu tarafında bir hata oluşursa kalbi eski haline geri döndürüyoruz
      setIsFavorite(previousState);
      toast.error(result.error || "Bir hata oluştu.");
    }

    setLoading(false);
  };

  return (
    <button 
      onClick={handleToggle}
      disabled={loading}
      // Sabit konumlandırmalar silindi, dışarıdan gelen 'className' buraya eklendi
      className={`bg-white p-3 rounded-full shadow-md transition-all duration-300 z-10 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-110 active:scale-95'} ${className}`}
      type="button"
      aria-label="Favorilere Ekle"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-6 w-6 transition-colors duration-300 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400 hover:text-red-400'}`} 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        fill={isFavorite ? "currentColor" : "none"}
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
        />
      </svg>
    </button>
  );
}