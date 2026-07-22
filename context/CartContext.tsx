"use client"; // Bu çok önemli! Sepet verisi tarayıcıda (client) tutulacağı için Next.js'e bunu belirtiyoruz.

import { createContext, useContext, useState, ReactNode } from "react";
import { Product } from "@/lib/data";

// 1. Sepetteki ürün tipi (Normal ürüne ek olarak 'quantity' yani 'adet' bilgisini ekliyoruz)
export type CartItem = Product & { quantity: number };

// 2. Hafızamızda hangi verilerin ve fonksiyonların olacağını tanımlıyoruz
type CartContextType = {
  cart: CartItem[]; // Sepetteki ürünlerin listesi
  addToCart: (product: Product) => void; // Sepete ürün ekleme fonksiyonu
  removeFromCart: (productId: number) => void; // Sepetten ürün çıkarma fonksiyonu
  clearCart: () => void; // Sipariş sonrası sepeti temizleme
};

// 3. Boş hafızayı (Context) oluşturuyoruz
const CartContext = createContext<CartContextType | undefined>(undefined);

// 4. Tüm uygulamamızı saracak ve hafızayı dağıtacak olan Sağlayıcı (Provider) bileşeni
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Sepete ürün ekleme mantığı
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      // Ürün zaten sepette var mı kontrol et
      const existingItem = prevCart.find((item: CartItem) => item.id === product.id);
      
      if (existingItem) {
        // Varsa sadece adedini 1 artır
        return prevCart.map((item: CartItem) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Yoksa sepete yeni ekle ve adedini 1 yap
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Sepetten ürün çıkarma mantığı (eşit olmayanları tutarak siler)
  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => String(item.id) !== String(productId)));
  };
  // Sepeti temizleme mantığı
  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

// 5. Sayfalarda bu hafızayı kolayca kullanmamızı sağlayacak özel Kanca (Hook)
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart hook'u CartProvider içinde kullanılmalıdır");
  }
  return context;
}