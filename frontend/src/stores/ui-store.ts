"use client";

// UI Store (Zustand)
// Centralized, framework-agnostic UI state for global modals, toasts,
// drawers, theme, and transient UI flags. Use fine-grained selectors to
// avoid unnecessary re-renders.

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  createdAt: number;
}

interface UIState {
  // Theme and layout
  theme: 'light' | 'dark' | 'dark-theme';
  navbarVisible: boolean;

  // Overlays and affordances
  modals: Record<string, boolean>; // e.g., { themeSelector: true }
  toasts: Toast[];

  // Global loading flags
  isGlobalLoading: boolean;

  // Actions
  setTheme: (theme: UIState['theme']) => void;
  showNavbar: () => void;
  hideNavbar: () => void;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  pushToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        theme: 'dark',
        navbarVisible: false,
        modals: {},
        toasts: [],
        isGlobalLoading: false,

        setTheme: (theme) => set({ theme }),
        showNavbar: () => set({ navbarVisible: true }),
        hideNavbar: () => set({ navbarVisible: false }),
        openModal: (id) => set((s) => ({ modals: { ...s.modals, [id]: true } })),
        closeModal: (id) => set((s) => {
          const next = { ...s.modals };
          delete next[id];
          return { modals: next };
        }),
        pushToast: (toast) => {
          const id = `t_${crypto.randomUUID()}`;
          set((s) => ({ toasts: [...s.toasts, { id, createdAt: Date.now(), ...toast }] }));
          return id;
        },
        removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
        setGlobalLoading: (loading) => set({ isGlobalLoading: loading })
      }),
      {
        name: 'ui-store', // localStorage key
        partialize: (state) => ({ theme: state.theme }), // persist only theme by default
      }
    )
  )
);

