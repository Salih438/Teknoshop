import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Sepetteki bir ürünün hangi bilgileri taşıyacağını belirliyoruz
export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrls: string[]; 
  quantity: number; 
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void; 
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

// 🛡️ GÜVENLİK MOTORU: JSON hatalarını yakalayan özel depolama katmanı
const safeStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    try {
      const item = localStorage.getItem(name);
      if (item) {
        JSON.parse(item); // Sadece veri bozuk mu diye test ediyoruz
      }
      return item;
    } catch (error) {
      console.error('Sepet verisi bozuk, otomatik temizleniyor...', error);
      localStorage.removeItem(name); // Bozuk veriyi imha et
      return null; // Sistemin çökmesini engelle
    }
  },
  setItem: (name: string, value: string) => localStorage.setItem(name, value),
  removeItem: (name: string) => localStorage.removeItem(name),
}));

// Zustand mağazamızı (hafızayı) oluşturuyoruz
export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [], 
      
      addItem: (item) => set((state) => {
        const quantityToAdd = item.quantity || 1; 
        const existingItem = state.items.find((i) => i.id === item.id);
        
        if (existingItem) {
          if (existingItem.quantity + quantityToAdd > 10) return state; 
          return {
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + quantityToAdd } : i
            ),
          };
        }
        
        return { items: [...state.items, { ...item, quantity: quantityToAdd }] };
      }),

      increaseQuantity: (id) => set((state) => ({
        items: state.items.map((i) =>
          i.id === id && i.quantity < 10 ? { ...i, quantity: i.quantity + 1 } : i
        )
      })),

      decreaseQuantity: (id) => set((state) => ({
        items: state.items.map((i) =>
          i.id === id && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i
        )
      })),

      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id)
      })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
      storage: safeStorage, // Güvenlik motorumuzu sisteme bağladık
    }
  )
);