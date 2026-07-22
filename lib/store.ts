import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 🚀 GÜNCELLEME 1: Sepetteki bir ürünün bilgilerine 'cartItemId' ve 'maxStock' eklendi
export interface CartItem {
  cartItemId: string; // Sepetteki satırı benzersiz yapan ID (Örn: iphone16-512gb)
  id: string;         // Ürünün gerçek veritabanı ID'si
  name: string;
  price: number;
  imageUrls: string[];
  quantity: number;
  variantId?: string; // Hangi varyasyon seçilmiş?
  maxStock?: number;  // 🚀 YENİ: Gerçek zamanlı stok takibi için eklendi
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'cartItemId' | 'maxStock'> & { quantity?: number }) => void; 
  increaseQuantity: (cartItemId: string) => void;
  decreaseQuantity: (cartItemId: string) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  // 🚀 YENİ: Sepeti veritabanından gelen güncel bilgilerle senkronize eden metod
  syncCart: (validations: { cartItemId: string; isActive: boolean; stock: number; price: number }[]) => { removedCount: number; updatedCount: number };
}

const safeStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(name);
      if (item) JSON.parse(item); 
      return item;
    } catch (error) {
      console.error('Sepet verisi bozuk, otomatik temizleniyor...', error);
      if (typeof window !== 'undefined') localStorage.removeItem(name); 
      return null; 
    }
  },
  setItem: (name: string, value: string) => {
    if (typeof window !== 'undefined') localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window !== 'undefined') localStorage.removeItem(name);
  },
}));

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [], 
      
      addItem: (item) => set((state) => {
        const quantityToAdd = item.quantity || 1; 
        const cartItemId = item.variantId ? `${item.id}-${item.variantId}` : item.id;
        const existingItem = state.items.find((i) => i.cartItemId === cartItemId);
        
        if (existingItem) {
          // Eğer maxStock bilgisi varsa (stok doğrulama yapılmışsa), onu aşmamaya dikkat et
          const maxAllowed = existingItem.maxStock ?? 10;
          if (existingItem.quantity + quantityToAdd > maxAllowed) return state; 
          
          return {
            items: state.items.map((i) =>
              i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + quantityToAdd } : i
            ),
          };
        }
        
        return { items: [...state.items, { ...item, cartItemId, quantity: quantityToAdd }] };
      }),

      increaseQuantity: (cartItemId) => set((state) => ({
        items: state.items.map((i) => {
          if (i.cartItemId === cartItemId) {
            const limit = i.maxStock !== undefined ? Math.min(i.maxStock, 10) : 10;
            return i.quantity < limit ? { ...i, quantity: i.quantity + 1 } : i;
          }
          return i;
        })
      })),

      decreaseQuantity: (cartItemId) => set((state) => ({
        items: state.items.map((i) =>
          i.cartItemId === cartItemId && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i
        )
      })),

      removeItem: (cartItemId) => set((state) => ({
        items: state.items.filter((i) => i.cartItemId !== cartItemId)
      })),

      clearCart: () => set({ items: [] }),

      // 🚀 YENİ: Senkronizasyon Metodu
      syncCart: (validations) => {
        const state = get();
        let removedCount = 0;
        let updatedCount = 0;

        const newItems = state.items.map(item => {
          const validation = validations.find(v => v.cartItemId === item.cartItemId);
          if (!validation) return item; // Eğer yanıt gelmediyse dokunma

          // Ürün pasif olmuşsa veya tamamen stoksuz kalmışsa işaretle
          if (!validation.isActive || validation.stock <= 0) {
            removedCount++;
            return { ...item, _shouldRemove: true };
          }

          let newQuantity = item.quantity;
          let changed = false;

          // Eğer istenen miktar gerçek stoğu aşıyorsa düşür
          if (newQuantity > validation.stock) {
            newQuantity = validation.stock;
            changed = true;
          }

          // Fiyat değişmişse güncelle
          if (item.price !== validation.price) {
            changed = true;
          }

          // Max stoku veya diğer özellikleri değiştiyse güncelle
          if (changed || item.maxStock !== validation.stock) {
            if (changed) updatedCount++;
            return { ...item, quantity: newQuantity, price: validation.price, maxStock: validation.stock };
          }

          return item;
        }).filter(item => !(item as any)._shouldRemove);

        if (removedCount > 0 || updatedCount > 0) {
          set({ items: newItems });
        }

        return { removedCount, updatedCount };
      },
    }),
    {
      name: 'cart-storage',
      storage: safeStorage, 
    }
  )
);