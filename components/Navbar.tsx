"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCartStore } from "../lib/store";
import { SignInButton, SignUpButton, UserButton, useAuth, useUser } from "@clerk/nextjs";
import SearchBar from "./SearchBar";
import NotificationBell from "./notifications/NotificationBell";

export default function Navbar() {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  // Synchronize user profile (name, role) from backend API
  const fetchUserProfile = useCallback(() => {
    if (isSignedIn) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) {
            if (data.user.role === "ADMIN") {
              setIsAdmin(true);
            }
            if (data.user.name) {
              setUserName(data.user.name);
            }
          }
        })
        .catch(() => {});
    }
  }, [isSignedIn]);

  useEffect(() => {
    setMounted(true);
    fetchUserProfile();

    // Listen for custom profile update event triggered by profile edit modals
    const handleProfileUpdate = () => {
      fetchUserProfile();
      if (user) {
        user.reload().catch(() => {});
      }
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [fetchUserProfile, user]);

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 text-gray-800 sticky top-0 z-50 transition-all w-full overflow-x-clip">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* 1. SOL KISIM: LOGO & ÜRÜNLER LİNKİ */}
          <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
            <Link
              href="/"
              className="text-xl sm:text-2xl font-extrabold text-blue-600 tracking-tight hover:opacity-80 transition-opacity flex items-center gap-1 min-h-[44px]"
            >
              <span>Teknoshop</span>
            </Link>

            <Link
              href="/products"
              className="hidden md:inline-flex items-center text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors py-2 px-3 rounded-lg hover:bg-gray-50 min-h-[44px]"
            >
              Ürünler
            </Link>
          </div>

          {/* 2. ORTA KISIM: MASAÜSTÜ ARAMA ÇUBUĞU */}
          <div className="hidden lg:flex flex-1 justify-center px-4 max-w-2xl">
            <div className="w-full">
              <SearchBar />
            </div>
          </div>

          {/* 3. SAĞ KISIM: MENÜ KISAYOLLARI VE KİMLİK DOĞRULAMA */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Mobil Ürünler Kısayolu */}
            <Link
              href="/products"
              className="md:hidden text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-50 min-h-[44px] flex items-center"
              aria-label="Tüm Ürünler"
            >
              Ürünler
            </Link>

            {/* SKELETON LOADING STATE */}
            {!isLoaded ? (
              <div className="flex items-center gap-2">
                <div className="w-12 h-8 bg-gray-100 animate-pulse rounded-lg"></div>
                <div className="w-8 h-8 bg-gray-100 animate-pulse rounded-full"></div>
              </div>
            ) : (
              <>
                {/* 🛡️ ADMİN PANELİ BUTONU */}
                {isSignedIn && isAdmin && (
                  <Link
                    href="/admin"
                    className="bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 font-extrabold px-3 py-1.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 min-h-[44px] shadow-xs"
                    title="Admin Yönetim Paneli"
                  >
                    <span>🛡️</span>
                    <span className="hidden md:inline">Admin Paneli</span>
                  </Link>
                )}

                {/* 🔔 BİLDİRİM ÇANI */}
                {isSignedIn && <NotificationBell />}

                {/* FAVORİLER LİNKİ */}
                {isSignedIn && (
                  <Link
                    href="/favorites"
                    className="hover:text-red-500 transition-colors flex items-center gap-1.5 p-2 rounded-xl hover:bg-red-50/50 text-gray-600 group min-h-[44px]"
                    title="Favorilerim"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 group-hover:text-red-500 transition-colors flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span className="hidden sm:inline text-sm font-semibold">Favoriler</span>
                  </Link>
                )}

                {/* SEPET VE BİLDİRİM BALONCUĞU */}
                <Link
                  href="/cart"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1.5 p-2 rounded-xl hover:bg-blue-50/50 text-gray-600 group min-h-[44px]"
                  title="Sepetim"
                >
                  <div className="relative flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {mounted && totalItems > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-extrabold h-4.5 w-4.5 min-w-[18px] flex items-center justify-center rounded-full ring-2 ring-white shadow-sm">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm font-semibold">Sepet</span>
                </Link>

                {/* KULLANICI AUTH BUTONLARI (Giriş Yap & Kayıt Ol her ekranda kullanılabilir) */}
                {!isSignedIn ? (
                  <div className="flex items-center gap-1 sm:gap-2 ml-1">
                    <SignInButton mode="modal">
                      <button className="text-blue-600 font-bold px-2.5 sm:px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors text-xs sm:text-sm min-h-[44px] flex items-center justify-center">
                        Giriş Yap
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="bg-blue-600 text-white font-bold px-2.5 sm:px-3.5 py-2 rounded-xl hover:bg-blue-700 hover:shadow-sm transition-all text-xs sm:text-sm min-h-[44px] inline-flex items-center justify-center">
                        Kayıt Ol
                      </button>
                    </SignUpButton>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3 ml-1">
                    <Link
                      href="/profile"
                      className="hidden sm:inline-flex items-center gap-1 hover:text-blue-600 transition-colors text-sm font-semibold py-2 px-1"
                    >
                      <span>Hesabım</span>
                      {userName && (
                        <span className="text-xs text-gray-500 font-normal truncate max-w-[100px]">
                          ({userName})
                        </span>
                      )}
                    </Link>
                    <div className="border-l border-gray-200 h-5 hidden sm:block"></div>
                    <div className="flex items-center justify-center min-h-[44px] min-w-[44px]">
                      <UserButton />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 4. MOBİL ARAMA ÇUBUĞU */}
        <div className="block lg:hidden pb-3 pt-1 w-full">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}