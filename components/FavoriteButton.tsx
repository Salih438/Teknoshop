"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { toggleFavorite } from "@/actions/favorite";

interface FavoriteButtonProps {
  productId: string;
  initialIsFavorite?: boolean;
  className?: string; 
}

export default function FavoriteButton({ 
  productId, 
  initialIsFavorite = false,
  className = "" 
}: FavoriteButtonProps) {
  const { userId } = useAuth(); // Clerk ile aktif oturum kontrolü
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);

  // Arka planda revalidatePath çalıştığında, sunucudan gelen yeni değeri butona yansıtır.
  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    // BUBBLING ENGELİ: Kartın (Link) tıklanmasını kesin olarak durdurur.
    e.stopPropagation(); 
    
    if (!userId) {
      toast.error("Favorilere eklemek için lütfen giriş yapın.");
      return;
    }

    if (loading) return;

    // Optimistic UI Update: Kalbi anında değiştiriyoruz
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);
    setLoading(true);

    try {
      const result = await toggleFavorite(productId);

      if (result.success) {
        if (result.isFavorite) {
          toast.success("Favorilerinize eklendi!");
        } else {
          toast.success("Favorilerinizden çıkarıldı.");
        }
      } else {
        // Sunucu mantıksal bir hata döndürürse geri al
        setIsFavorite(previousState);
        toast.error(result.error || "İşlem gerçekleştirilemedi.");
      }
    } catch (error) {
      // Ağ hatası veya sunucu çökmesi durumunda state'i geri al ve sonsuz yüklemeyi engelle
      setIsFavorite(previousState);
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleToggle}
      disabled={loading}
      className={`bg-white p-2.5 sm:p-3 rounded-full shadow-md transition-all duration-300 z-10 ${
        loading ? 'opacity-70 cursor-wait' : 'hover:scale-110 active:scale-95 hover:shadow-lg'
      } ${className}`}
      type="button"
      aria-label={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
      title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-300 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400 hover:text-red-500'}`} 
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