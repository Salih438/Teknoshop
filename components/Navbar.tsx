"use client";

import Link from 'next/link';
import { useCartStore } from '../lib/store'; 
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import SearchBar from './SearchBar'; 

export default function Navbar() {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  
  // Hataları önleyen, Clerk'in en güncel ve kararlı hook yapısı
  const { isSignedIn } = useAuth(); 

  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-md text-gray-800 sticky top-0 z-50">
      
      {/* 1. SOL KISIM: LOGO (Eski sade tasarım korundu) */}
      <div className="flex-shrink-0">
        <Link href="/" className="text-2xl font-bold text-blue-600 tracking-tight">
          Vitrin
        </Link>
      </div>

      {/* 2. ORTA KISIM: ARAMA ÇUBUĞU (Eski genişlik ve padding korundu) */}
      <div className="hidden md:flex flex-1 justify-center px-6">
        <div className="w-full max-w-lg">
          <SearchBar />
        </div>
      </div>

      {/* 3. SAĞ KISIM: MENÜ VE KİMLİK DOĞRULAMA */}
      <div className="flex gap-6 font-medium items-center flex-shrink-0">
        <Link href="/products" className="hover:text-blue-500 transition-colors">
          Ürünler
        </Link>

        {/* 🚀 YENİ EKLENEN KISIM: Kullanıcı giriş yaptıysa "Favoriler" linkini göster */}
        {isSignedIn && (
          <Link href="/favorites" className="hover:text-blue-500 transition-colors">
            Favoriler
          </Link>
        )}

        <Link href="/cart" className="hover:text-blue-500 transition-colors flex items-center gap-1">
          Sepet
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {totalItems}
          </span>
        </Link>

        {/* Giriş yapılmamışsa Giriş ve Kayıt Butonları */}
        {!isSignedIn && (
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <button className="text-blue-600 font-medium px-4 py-2 rounded hover:bg-blue-50 transition">
                Giriş Yap
              </button>
            </SignInButton>
            
            <SignUpButton mode="modal">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                Kayıt Ol
              </button>
            </SignUpButton>
          </div>
        )}

        {/* Giriş yapılmışsa Hesabım Linkini ve Profil İkonunu göster */}
        {isSignedIn && (
          <div className="flex items-center gap-4">
            <Link href="/profile" className="hover:text-blue-500 transition-colors">
              Hesabım
            </Link>
            <UserButton />
          </div>
        )}
      </div>
      
    </nav>
  );
}