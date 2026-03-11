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
  appliedVoucher: { code: string; discount_amount: number; store_id: string } | null;
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (id: string, startDate: string, endDate: string, quantity: number) => void;
  removeFromCart: (id: string, startDate?: string, endDate?: string) => void;
  removeFromCartAtIndex: (index: number) => void;
  clearCart: () => void;
  setAppliedVoucher: (voucher: { code: string; discount_amount: number; store_id: string } | null) => void;
}

interface NavigationSlice {
  page: AppPage;
  selectedStoreId: string | null;
  selectedItemId: string | null;
  lastSubmittedApplication: SubmittedApplication | null;
  homeSearchQuery: string;
  showHomeNavSearch: boolean;
  setPage: (page: AppPage) => void;
  openStore: (id: string) => void;
  openItem: (id: string) => void;
  setLastSubmittedApplication: (application: SubmittedApplication | null) => void;
  setHomeSearchQuery: (value: string) => void;
  setShowHomeNavSearch: (value: boolean) => void;
}

interface UiSlice {
  activeRequests: number;
  beginRequest: () => void;
  endRequest: () => void;
  cartConflict: { open: boolean; message: string } | null;
  openCartConflict: (message?: string) => void;
  closeCartConflict: () => void;
}

export type AppStore = AuthSlice & CartSlice & NavigationSlice & UiSlice;

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      cart: [],
      appliedVoucher: null,
      page: 'home',
      selectedStoreId: null,
      selectedItemId: null,
      lastSubmittedApplication: null,
      homeSearchQuery: '',
      showHomeNavSearch: false,
      activeRequests: 0,
      cartConflict: null,
      setSession: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null, cart: [], appliedVoucher: null, page: 'home', selectedStoreId: null, selectedItemId: null, lastSubmittedApplication: null }),
      addToCart: (item) =>
        set((state) => {
          const existingStoreId = state.cart[0]?.store_id;
          if (existingStoreId && existingStoreId !== item.store_id) {
            return {
              cartConflict: {
                open: true,
                message: 'You can only add items from one store at a time. Please clear your cart to add items from another store.',
              },
            };
          }
          const quantityToAdd = Math.max(1, item.quantity || 1);
          const clearVoucher = state.appliedVoucher && state.appliedVoucher.store_id !== item.store_id;
          const existingIndex = state.cart.findIndex(
            (entry) => entry.id === item.id && entry.startDate === item.startDate && entry.endDate === item.endDate,
          );
          if (existingIndex === -1) {
            return { cart: [...state.cart, { ...item, quantity: quantityToAdd }], appliedVoucher: clearVoucher ? null : state.appliedVoucher };
          }
          const existing = state.cart[existingIndex];
          const maxStock = Math.max(1, existing.stock || item.stock || 1);
          const nextQuantity = Math.min(maxStock, Math.max(1, (existing.quantity || 1) + quantityToAdd));
          const updated = [...state.cart];
          updated[existingIndex] = { ...existing, quantity: nextQuantity };
          return { cart: updated, appliedVoucher: clearVoucher ? null : state.appliedVoucher };
        }),
      updateCartQuantity: (id, startDate, endDate, quantity) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === id && item.startDate === startDate && item.endDate === endDate
              ? { ...item, quantity: Math.max(1, Math.min(Math.max(1, item.stock || 1), Math.floor(quantity))) }
              : item,
          ),
        })),
      removeFromCart: (id, startDate, endDate) =>
        set((state) => {
          let nextCart = state.cart.filter((item) => !(item.id === id && item.startDate === startDate && item.endDate === endDate));
          if (nextCart.length === state.cart.length) {
            nextCart = state.cart.filter((item) => item.id !== id);
          }
          const nextStoreId = nextCart[0]?.store_id || '';
          const clearVoucher = state.appliedVoucher && state.appliedVoucher.store_id !== nextStoreId;
          return { cart: nextCart, appliedVoucher: clearVoucher ? null : state.appliedVoucher };
        }),
      removeFromCartAtIndex: (index) =>
        set((state) => {
          const nextCart = state.cart.filter((_, idx) => idx !== index);
          const nextStoreId = nextCart[0]?.store_id || '';
          const clearVoucher = state.appliedVoucher && state.appliedVoucher.store_id !== nextStoreId;
          return { cart: nextCart, appliedVoucher: clearVoucher ? null : state.appliedVoucher };
        }),
      clearCart: () => set({ cart: [], appliedVoucher: null, cartConflict: null }),
      setAppliedVoucher: (voucher) => set({ appliedVoucher: voucher }),
      setPage: (page) => set({ page }),
      openStore: (id) => set({ selectedStoreId: id, page: 'store' }),
      openItem: (id) => set({ selectedItemId: id, page: 'item' }),
      setLastSubmittedApplication: (application) => set({ lastSubmittedApplication: application }),
      setHomeSearchQuery: (value) => set({ homeSearchQuery: value }),
      setShowHomeNavSearch: (value) => set({ showHomeNavSearch: value }),
      beginRequest: () => set((state) => ({ activeRequests: state.activeRequests + 1 })),
      endRequest: () => set((state) => ({ activeRequests: Math.max(0, state.activeRequests - 1) })),
      openCartConflict: (message) =>
        set({
          cartConflict: {
            open: true,
            message: message || 'You can only add items from one store at a time. Please clear your cart to add items from another store.',
          },
        }),
      closeCartConflict: () => set({ cartConflict: null }),
    }),
    {
      name: 'camrent-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        cart: state.cart,
        appliedVoucher: state.appliedVoucher,
        lastSubmittedApplication: state.lastSubmittedApplication,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<AppStore>),
      }),
    },
  ),
);
