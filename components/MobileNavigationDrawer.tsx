"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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

          {/* 2. Ürünler */}
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
            <span>Ürünler</span>
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

          <div className="border-t border-gray-100 my-2" />

          {/* 4. Favorilerim */}
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

          {/* 5. Sepetim */}
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

          {/* 6. Hesabım */}
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
        </nav>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
