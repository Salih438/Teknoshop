"use client";

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { useCartStore } from "../lib/store";
import { SignInButton, SignUpButton, UserButton, useAuth, useUser } from "@clerk/nextjs";
import SearchBar from "./SearchBar";
import NotificationBell from "./notifications/NotificationBell";
import MiniCartPopover from "./cart/MiniCartPopover";
import AccountPopover from "./profile/AccountPopover";
import MobileNavigationDrawer from "./MobileNavigationDrawer";

const emptySubscribe = () => () => { };

export default function Navbar({
  categories = [],
}: {
  categories?: Array<{
    id: string;
    name: string;
    _count?: {
      products: number;
    };
  }>;
}) {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);
  const [isAccountHovered, setIsAccountHovered] = useState(false);

  const cartHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accountHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize user profile (name, role) from backend API
  const fetchUserProfile = useCallback(() => {
    if (isSignedIn) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setIsAdmin(data.user.role === "ADMIN");
            if (data.user.name) {
              setUserName(data.user.name);
            }
          }
        })
        .catch(() => { });
    }
  }, [isSignedIn]);

  useEffect(() => {
    fetchUserProfile();

    // Listen for custom profile update event triggered by profile edit modals
    const handleProfileUpdate = () => {
      fetchUserProfile();
      if (user) {
        user.reload().catch(() => { });
      }
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [fetchUserProfile, user]);

  const handleCartMouseEnter = () => {
    if (cartHoverTimeoutRef.current) clearTimeout(cartHoverTimeoutRef.current);
    cartHoverTimeoutRef.current = setTimeout(() => {
      setIsCartHovered(true);
    }, 200);
  };

  const handleCartMouseLeave = () => {
    if (cartHoverTimeoutRef.current) clearTimeout(cartHoverTimeoutRef.current);
    cartHoverTimeoutRef.current = setTimeout(() => {
      setIsCartHovered(false);
    }, 200);
  };

  const handleAccountMouseEnter = () => {
    if (accountHoverTimeoutRef.current) clearTimeout(accountHoverTimeoutRef.current);
    accountHoverTimeoutRef.current = setTimeout(() => {
      setIsAccountHovered(true);
    }, 200);
  };

  const handleAccountMouseLeave = () => {
    if (accountHoverTimeoutRef.current) clearTimeout(accountHoverTimeoutRef.current);
    accountHoverTimeoutRef.current = setTimeout(() => {
      setIsAccountHovered(false);
    }, 200);
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 text-gray-800 sticky top-0 z-50 transition-all w-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-1 sm:gap-4">

          {/* 1. SOL KISIM: LOGO & ÜRÜNLER LİNKİ */}
          <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
            {/* MOBİL MENÜ TETİKLEYİCİ BUTONU (☰) */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Menüyü aç"
              aria-expanded={isDrawerOpen}
              aria-controls="mobile-navigation-drawer"
              className="md:hidden text-gray-700 hover:text-blue-600 p-2 rounded-xl hover:bg-gray-100 transition-colors min-h-[44px] min-w-[40px] flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link
              href="/"
              className="text-base sm:text-2xl font-extrabold text-blue-600 tracking-tight hover:opacity-80 transition-opacity flex items-center gap-1 min-h-[44px] min-w-[44px]"
            >
              <span>Teknoshop</span>
            </Link>

            <Link
              href="/products"
              className="hidden md:inline-flex items-center text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors py-2 px-3.5 rounded-xl hover:bg-gray-100 min-h-[44px]"
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
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">

            {/* MOBİL ARAMA TETİKLEYİCİ BUTONU */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen((prev) => !prev)}
              aria-label="Arama Yap"
              title="Arama Yap"
              className="lg:hidden text-gray-600 hover:text-blue-600 p-2 sm:p-2.5 rounded-xl hover:bg-gray-100 transition-colors min-h-[44px] min-w-[40px] sm:min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>


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
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 sm:px-3 py-1.5 rounded-xl border border-gray-200 font-medium transition-all flex items-center gap-1.5 min-h-[44px] min-w-[40px] sm:min-w-[44px] justify-center"
                    title="Admin Yönetim Paneli"
                  >
                    <span>🛡️</span>
                    <span className="hidden md:inline">Admin Paneli</span>
                  </Link>
                )}

                {/* 🔔 BİLDİRİM ÇANI */}
                {isSignedIn && <NotificationBell />}

                {/* FAVORİLER LİNKİ (Sadece Masaüstü ve Tablette Görünür - hidden sm:flex) */}
                {isSignedIn && (
                  <Link
                    href="/favorites"
                    className="hidden sm:flex hover:text-red-500 transition-colors items-center gap-1.5 p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 group min-h-[44px] min-w-[44px] justify-center"
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

                {/* SEPET LİNKİ & MİNİ SEPET PREVIEW POPOVER (MASAÜSTÜ) */}
                <div
                  className="relative hidden sm:block"
                  onMouseEnter={handleCartMouseEnter}
                  onMouseLeave={handleCartMouseLeave}
                >
                  <Link
                    href="/cart"
                    className="hover:text-blue-600 transition-colors flex items-center gap-1.5 p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 group min-h-[44px] min-w-[44px] justify-center"
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

                  {/* 🚀 MINI CART POPOVER DROPDOWN */}
                  {isCartHovered && (
                    <MiniCartPopover onClose={() => setIsCartHovered(false)} />
                  )}
                </div>

                {/* MOBİL SEPET LİNKİ */}
                <Link
                  href="/cart"
                  className="sm:hidden hover:text-blue-600 transition-colors flex items-center gap-1.5 p-2 sm:p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 group min-h-[44px] min-w-[40px] sm:min-w-[44px] justify-center"
                  title="Sepetim"
                  aria-label="Sepetim"
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
                </Link>

                {/* KULLANICI AUTH BUTONLARI VE ACCOUNT POPOVER */}
                {!isSignedIn ? (
                  <div className="flex items-center gap-1 sm:gap-2 ml-1">
                    <SignInButton mode="modal">
                      <button className="text-blue-600 font-bold px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors text-xs sm:text-sm min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer">
                        Giriş Yap
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="bg-blue-600 text-white font-bold px-3.5 py-2 rounded-xl hover:bg-blue-700 hover:shadow-sm transition-all text-xs sm:text-sm min-h-[44px] inline-flex items-center justify-center cursor-pointer">
                        Kayıt Ol
                      </button>
                    </SignUpButton>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-3 ml-0.5">

                    {/* 🚀 ACCOUNT POPOVER HOVER CONTAINER (MASAÜSTÜ) */}
                    <div
                      className="relative hidden sm:block"
                      onMouseEnter={handleAccountMouseEnter}
                      onMouseLeave={handleAccountMouseLeave}
                    >
                      <Link
                        href="/profile"
                        className="inline-flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors text-sm font-semibold py-2 px-1 group min-h-[44px]"
                      >
                        <span>Hesabım</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </Link>

                      {isAccountHovered && (
                        <AccountPopover onClose={() => setIsAccountHovered(false)} />
                      )}
                    </div>

                    {/* 🚀 MOBİL HESABIM LİNKİ (Sadece Mobilde Görünür - sm:hidden) */}
                    <Link
                      href="/profile"
                      className="sm:hidden hover:text-blue-600 transition-colors flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 text-gray-600 group min-h-[44px] min-w-[40px]"
                      aria-label="Hesabım"
                      title="Hesabım"
                    >
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </Link>

                    <div className="border-l border-gray-200 h-5 hidden sm:block"></div>
                    <div className="hidden sm:flex items-center justify-center min-h-[44px] min-w-[44px]">
                      <UserButton />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 🚀 MOBİL ARAMA DRAWER */}
        {isMobileSearchOpen && (
          <div className="lg:hidden pb-3 pt-2 px-1 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200 w-full">
            <SearchBar />
          </div>
        )}

        {/* 🚀 MOBİL NAVİGASYON DRAWER (PORTAL) */}
        <MobileNavigationDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          categories={categories}
        />

      </div>
    </header>
  );
}