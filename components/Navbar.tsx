"use client";

import Link from 'next/link';
// Eski Context yerine yeni Zustand hafızamızı çağırıyoruz:
import { useCartStore } from '../lib/store'; 
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';
// Arama çubuğunu içe aktarıyoruz
import SearchBar from './SearchBar'; 

export default function Navbar() {
  // Zustand hafızasından sepetteki ürünleri çekiyoruz
  const items = useCartStore((state) => state.items);
  
  // Sepetteki tüm ürünlerin adetlerini topluyoruz
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-md text-gray-800 sticky top-0 z-50">
      
      {/* 1. SOL KISIM: LOGO */}
      <div className="flex-shrink-0">
        <Link href="/" className="text-2xl font-bold text-blue-600 tracking-tight">
          Vitrin
        </Link>
      </div>

      {/* 2. ORTA KISIM: ARAMA ÇUBUĞU */}
      <div className="hidden md:flex flex-1 justify-center px-6">
        <div className="w-full max-w-lg">
          <SearchBar />
        </div>
      </div>

      {/* 3. SAĞ KISIM: MENÜ VE KİMLİK DOĞRULAMA (CLERK) */}
      <div className="flex gap-6 font-medium items-center flex-shrink-0">
        <Link href="/products" className="hover:text-blue-500 transition-colors">
          Ürünler
        </Link>
        <Link href="/cart" className="hover:text-blue-500 transition-colors flex items-center gap-1">
          Sepet
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {totalItems}
          </span>
        </Link>

        {/* Çıkış yapılmışsa Giriş ve Kayıt Butonlarını yan yana göster */}
        <Show when="signed-out">
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
        </Show>

        {/* Giriş yapılmışsa Profil İkonunu göster */}
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
      
    </nav>
  );
}