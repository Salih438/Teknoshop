"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useCartStore, CART_STORAGE_KEY } from "@/lib/store";

export default function AuthCartSync() {
  const { isSignedIn, isLoaded } = useAuth();
  const wasSignedIn = useRef(isSignedIn);
  
  // To prevent circular updates when hydration happens
  const isHydrating = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // HYDRATION: Kullanıcı giriş yaptığında veritabanındaki sepeti çek
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && !wasSignedIn.current) {
        // Yeni giriş yaptı (Veya sayfayı yeni yeniledi ve oturum açık)
        const fetchCart = async () => {
          try {
            isHydrating.current = true;
            const res = await fetch("/api/cart");
            if (res.ok) {
              const data = await res.json();
              if (data.items) {
                // 🚀 Misafir sepeti ile DB sepetini birleştir
                useCartStore.getState().mergeCart(data.items);

                // Birleştirilmiş güncel sepeti DB'ye de kaydet
                const mergedItems = useCartStore.getState().items;
                await fetch("/api/cart", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ items: mergedItems }),
                });
              }
            }
          } catch (error) {
            console.error("Cart hydration & merge error:", error);
          } finally {
            isHydrating.current = false;
          }
        };
        fetchCart();
      }

      if (wasSignedIn.current && !isSignedIn) {
        // Kullanıcı oturumu kapattı (Çıkış yaptı)
        useCartStore.getState().clearCart();
        localStorage.removeItem(CART_STORAGE_KEY);
      }
      
      wasSignedIn.current = isSignedIn;
    }
  }, [isLoaded, isSignedIn]);

  // MUTATION: Sepet değiştiğinde veritabanına kaydet
  useEffect(() => {
    let previousItems = useCartStore.getState().items;

    const unsubscribe = useCartStore.subscribe(
      (state) => {
        const items = state.items;
        
        // Eğer referans aynıysa değişmemiştir
        if (items === previousItems) return;
        previousItems = items;

        if (!isLoaded || !isSignedIn || isHydrating.current) return;

        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(async () => {
          try {
            await fetch("/api/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items }),
            });
          } catch (error) {
            console.error("Cart sync error:", error);
          }
        }, 1000);
      }
    );

    return () => {
      unsubscribe();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [isLoaded, isSignedIn]);

  return null;
}
