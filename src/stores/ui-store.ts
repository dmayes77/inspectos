import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * UI state management with Zustand
 * Example store for managing UI state like modals, filters, etc.
 */

interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Modal states
  modals: Record<string, boolean>;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;

  // Filters (example)
  filters: Record<string, unknown>;
  setFilter: (key: string, value: unknown) => void;
  clearFilters: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Modals
      modals: {},
      openModal: (modalId) => set((state) => ({ modals: { ...state.modals, [modalId]: true } })),
      closeModal: (modalId) => set((state) => ({ modals: { ...state.modals, [modalId]: false } })),
      closeAllModals: () => set({ modals: {} }),

      // Filters
      filters: {},
      setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
      clearFilters: () => set({ filters: {} }),
    }),
    {
      name: "ui-storage", // localStorage key
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }), // Only persist sidebar state
    }
  )
);
