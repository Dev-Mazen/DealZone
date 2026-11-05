import { create } from 'zustand'
import { tokenStore } from '../shared/api/axios.js'

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true, // starts true — we try to rehydrate on app load
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user }),

  setTokens: (access, refresh) => {
    tokenStore.setAccess(access)
    tokenStore.setRefresh(refresh)
  },

  clearAuth: () => {
    tokenStore.clearAll()
    set({ user: null, isAuthenticated: false })
  },

  setLoading: (v) => set({ isLoading: v }),
}))

