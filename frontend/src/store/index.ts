import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppPage } from '@/src/types/app';
import type { CartItem, User } from '@/src/types/domain';

interface AuthSlice {
  user: User | null;
  token: string | null;
  setSession: (user: User | null, token: string | null) => void;
  logout: () => void;
}

interface CartSlice {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

interface NavigationSlice {
  page: AppPage;
  selectedStoreId: string | null;
  selectedItemId: string | null;
  setPage: (page: AppPage) => void;
  openStore: (id: string) => void;
  openItem: (id: string) => void;
}

export type AppStore = AuthSlice & CartSlice & NavigationSlice;

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      cart: [],
      page: 'home',
      selectedStoreId: null,
      selectedItemId: null,
      setSession: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null, cart: [], page: 'home', selectedStoreId: null, selectedItemId: null }),
      addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
      removeFromCart: (id) => set((state) => ({ cart: state.cart.filter((item) => item.id !== id) })),
      clearCart: () => set({ cart: [] }),
      setPage: (page) => set({ page }),
      openStore: (id) => set({ selectedStoreId: id, page: 'store' }),
      openItem: (id) => set({ selectedItemId: id, page: 'item' }),
    }),
    {
      name: 'camrent-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        cart: state.cart,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<AppStore>),
      }),
    },
  ),
);
