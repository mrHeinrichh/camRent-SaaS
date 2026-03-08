import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppPage } from '@/src/types/app';
import type { CartItem, SubmittedApplication, User } from '@/src/types/domain';

interface AuthSlice {
  user: User | null;
  token: string | null;
  setSession: (user: User | null, token: string | null) => void;
  logout: () => void;
}

interface CartSlice {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (id: string, startDate: string, endDate: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

interface NavigationSlice {
  page: AppPage;
  selectedStoreId: string | null;
  selectedItemId: string | null;
  lastSubmittedApplication: SubmittedApplication | null;
  setPage: (page: AppPage) => void;
  openStore: (id: string) => void;
  openItem: (id: string) => void;
  setLastSubmittedApplication: (application: SubmittedApplication | null) => void;
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
      lastSubmittedApplication: null,
      setSession: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null, cart: [], page: 'home', selectedStoreId: null, selectedItemId: null, lastSubmittedApplication: null }),
      addToCart: (item) =>
        set((state) => {
          const quantityToAdd = Math.max(1, item.quantity || 1);
          const existingIndex = state.cart.findIndex(
            (entry) => entry.id === item.id && entry.startDate === item.startDate && entry.endDate === item.endDate,
          );
          if (existingIndex === -1) {
            return { cart: [...state.cart, { ...item, quantity: quantityToAdd }] };
          }
          const existing = state.cart[existingIndex];
          const maxStock = Math.max(1, existing.stock || item.stock || 1);
          const nextQuantity = Math.min(maxStock, Math.max(1, (existing.quantity || 1) + quantityToAdd));
          const updated = [...state.cart];
          updated[existingIndex] = { ...existing, quantity: nextQuantity };
          return { cart: updated };
        }),
      updateCartQuantity: (id, startDate, endDate, quantity) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === id && item.startDate === startDate && item.endDate === endDate
              ? { ...item, quantity: Math.max(1, Math.min(Math.max(1, item.stock || 1), Math.floor(quantity))) }
              : item,
          ),
        })),
      removeFromCart: (id) => set((state) => ({ cart: state.cart.filter((item) => item.id !== id) })),
      clearCart: () => set({ cart: [] }),
      setPage: (page) => set({ page }),
      openStore: (id) => set({ selectedStoreId: id, page: 'store' }),
      openItem: (id) => set({ selectedItemId: id, page: 'item' }),
      setLastSubmittedApplication: (application) => set({ lastSubmittedApplication: application }),
    }),
    {
      name: 'camrent-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        cart: state.cart,
        lastSubmittedApplication: state.lastSubmittedApplication,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<AppStore>),
      }),
    },
  ),
);
