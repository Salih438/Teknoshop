"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, SignOutButton } from "@clerk/nextjs";

export interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isSignedIn?: boolean;
  categories?: Array<{
    id: string;
    name: string;
    _count?: {
      products: number;
    };
  }>;
}

export default function MobileNavigationDrawer({
  isOpen,
  onClose,
  isSignedIn = false,
  categories = [],
}: MobileNavigationDrawerProps) {
  const [store] = useState(() => {
    let mounted = false;
    return {
      getSnapshot: () => mounted,
      subscribe: (callback: () => void) => {
        mounted = true;
        callback();
        return () => {
          mounted = false;
        };
      },
    };
  });

  const mounted = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => false
  );
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Body Scroll Lock - Safe cleanup on unmount or close
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // ESC key listener to close drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus management: focus close button when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const isActiveRoute = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  const drawerContent = (
    <div
      className={`fixed inset-0 z-[998] transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      {/* 1. Full-screen translucent backdrop overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 transition-opacity"
        aria-label="Menüyü kapat"
      />

      {/* 2. Left-sliding navigation drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobil navigasyon menüsü"
        className={`fixed top-0 left-0 h-[100dvh] w-[min(86vw,360px)] max-w-full z-[999] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 h-16 sm:h-20 border-b border-gray-100 flex-shrink-0">
          <Link
            href="/"
            onClick={onClose}
            className="text-xl sm:text-2xl font-extrabold text-blue-600 tracking-tight min-h-[44px] flex items-center"
          >
            Teknoshop
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Menüyü kapat"
            className="w-11 h-11 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer Navigation Content - Vertically Scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 max-h-[calc(100dvh-5rem)]">
          
          {/* 🚀 GUEST AUTHENTICATION CARD (Giriş Yapmamış Kullanıcılar İçin) */}
          {!isSignedIn ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 p-4 rounded-2xl border border-blue-100/80 mb-4 shadow-sm">
              <p className="text-xs font-extrabold text-blue-950 mb-2.5">
                Teknoshop Dünyasına Hoş Geldiniz
              </p>
              <div className="grid grid-cols-2 gap-2">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors min-h-[44px] flex items-center justify-center cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600 outline-none"
                  >
                    Giriş Yap
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full bg-white hover:bg-gray-50 text-blue-600 font-bold py-2.5 px-3 rounded-xl text-xs transition-colors min-h-[44px] flex items-center justify-center cursor-pointer border border-blue-200 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600 outline-none"
                  >
                    Kayıt Ol
                  </button>
                </SignUpButton>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED HESAP DURUM BİLGİSİ */
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 mb-3 flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-700 px-1">Hesabınız Aktif</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full">
                Oturum Açıldı
              </span>
            </div>
          )}

          {/* ==================== BÖLÜM 1: ALIŞVERİŞ ==================== */}
          <div className="pt-1 pb-1">
            <p className="px-4 pt-1 pb-1 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
              Alışveriş
            </p>
          </div>

          {/* 1. Ana Sayfa */}
          <Link
            href="/"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-colors min-h-[44px] ${
              isActiveRoute("/") && pathname === "/"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Ana Sayfa</span>
          </Link>

          {/* 2. Tüm Ürünler */}
          <Link
            href="/products"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-colors min-h-[44px] ${
              isActiveRoute("/products")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            <span>Tüm Ürünler</span>
          </Link>

          {/* 3. Kategoriler - Accordion Section */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => setIsCategoriesOpen((prev) => !prev)}
              aria-expanded={isCategoriesOpen}
              aria-controls="mobile-categories-list"
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors min-h-[44px]"
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span>Kategoriler</span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  isCategoriesOpen ? "rotate-90" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Expandable Category List */}
            {isCategoriesOpen && (
              <div id="mobile-categories-list" className="mt-1 pl-11 pr-2 space-y-1">
                {categories.length === 0 ? (
                  <p className="py-2 text-xs font-semibold text-gray-400">Kategori bulunamadı</p>
                ) : (
                  categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/products?category=${category.id}`}
                      onClick={onClose}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors min-h-[40px]"
                    >
                      <span className="truncate">{category.name}</span>
                      {category._count && typeof category._count.products === "number" && (
                        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {category._count.products}
                        </span>
                      )}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ==================== BÖLÜM 2: HESABIM ==================== */}
          <div className="border-t border-gray-100 my-2 pt-2">
            <p className="px-4 pt-1 pb-1 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
              Hesabım
            </p>
          </div>

          {/* 4. Hesabım / Profil */}
          <Link
            href="/profile"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-colors min-h-[44px] ${
              isActiveRoute("/profile")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0"
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
            <span>Hesabım</span>
          </Link>

          {/* 5. Siparişlerim */}
          <Link
            href="/profile?tab=orders"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors min-h-[44px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span>Siparişlerim</span>
          </Link>

          {/* 6. Favorilerim */}
          <Link
            href="/favorites"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-colors min-h-[44px] ${
              isActiveRoute("/favorites")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0"
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
            <span>Favorilerim</span>
          </Link>

          {/* 7. Sepetim */}
          <Link
            href="/cart"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-colors min-h-[44px] ${
              isActiveRoute("/cart")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0"
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
            <span>Sepetim</span>
          </Link>

          {/* ==================== BÖLÜM 3: KURUMSAL & YARDIM ==================== */}
          <div className="border-t border-gray-100 my-2 pt-2">
            <p className="px-4 pt-1 pb-1 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
              Kurumsal & Yardım
            </p>
          </div>

          {/* 8. Hakkımızda */}
          <Link
            href="/about"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors min-h-[44px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Hakkımızda</span>
          </Link>

          {/* 9. Sık Sorulan Sorular */}
          <Link
            href="/faq"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors min-h-[44px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Sık Sorulan Sorular</span>
          </Link>

          {/* 10. İletişim */}
          <Link
            href="/contact"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors min-h-[44px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>İletişim</span>
          </Link>

          {/* ==================== BÖLÜM 4: ÇIKIŞ YAP (Sadece Oturum Açık) ==================== */}
          {isSignedIn && (
            <>
              <div className="border-t border-gray-100 my-2 pt-2" />
              <SignOutButton>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Çıkış Yap"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-rose-600 hover:bg-rose-50 transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-rose-500 outline-none cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Çıkış Yap</span>
                </button>
              </SignOutButton>
            </>
          )}
        </nav>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
