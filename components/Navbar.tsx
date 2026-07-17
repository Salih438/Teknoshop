"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '../lib/store'; 
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import SearchBar from './SearchBar'; 

export default function Navbar() {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  
  // isLoaded: Clerk verisi çekilirken bekleme durumunu kontrol eder
  const { isLoaded, isSignedIn } = useAuth(); 
  
  // Hydration hatasını önlemek için state
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-sm border-b border-gray-100 text-gray-800 sticky top-0 z-50 transition-all">
      
      {/* 1. SOL KISIM: LOGO */}
      <div className="flex-shrink-0">
        <Link href="/" className="text-2xl font-extrabold text-blue-600 tracking-tight hover:opacity-80 transition-opacity">
          Vitrin
        </Link>
      </div>

      {/* 2. ORTA KISIM: ARAMA ÇUBUĞU */}
      <div className="hidden lg:flex flex-1 justify-center px-8">
        <div className="w-full max-w-2xl">
          <SearchBar />
        </div>
      </div>

      {/* 3. SAĞ KISIM: MENÜ VE KİMLİK DOĞRULAMA */}
      <div className="flex gap-4 md:gap-6 font-medium items-center flex-shrink-0 text-sm md:text-base">
        
        <Link href="/products" className="hidden sm:block hover:text-blue-600 transition-colors">
          Ürünler
        </Link>

        {/* 🚀 FAZ 9: UX İyileştirmesi - Yükleniyor Durumu (Skeleton) */}
        {!isLoaded ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-8 bg-gray-100 animate-pulse rounded-md"></div>
            <div className="w-8 h-8 bg-gray-100 animate-pulse rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Kullanıcı giriş yaptıysa Favoriler (İkonlu) */}
            {isSignedIn && (
              <Link href="/favorites" className="hover:text-red-500 transition-colors flex items-center gap-1.5 group">
                <span className="hidden sm:block">Favoriler</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>
            )}

            {/* Sepet ve Bildirim Baloncuğu */}
            <Link href="/cart" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
              <span className="hidden sm:block">Sepet</span>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                    {totalItems}
                  </span>
                )}
              </div>
            </Link>

            {/* Giriş yapılmamışsa Giriş ve Kayıt Butonları */}
            {!isSignedIn ? (
              <div className="flex items-center gap-2 ml-1">
                <SignInButton mode="modal">
                  <button className="text-blue-600 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                    Giriş
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="hidden sm:block bg-blue-600 text-white font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 hover:shadow-md transition-all text-sm">
                    Kayıt Ol
                  </button>
                </SignUpButton>
              </div>
            ) : (
              // Giriş yapılmışsa Hesabım Linki ve Profil İkonu
              <div className="flex items-center gap-3 ml-2">
                <Link href="/profile" className="hidden sm:block hover:text-blue-600 transition-colors font-medium">
                  Hesabım
                </Link>
                <div className="border-l border-gray-200 h-6 mx-1"></div>
                <UserButton />
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
}