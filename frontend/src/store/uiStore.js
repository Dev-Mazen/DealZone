import { create } from 'zustand'

export const useUIStore = create((set) => ({
  language: localStorage.getItem('dz_lang') || 'en',
  sidebarCollapsed: false,
  notificationPanelOpen: false,

  setLanguage: (lang) => {
    localStorage.setItem('dz_lang', lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('data-lang', lang)
    set({ language: lang })
  },

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  setNotificationPanelOpen: (v) => set({ notificationPanelOpen: v }),
}))

