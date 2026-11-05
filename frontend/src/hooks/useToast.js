import { create } from 'zustand'

export const useToastStore = create((set) => ({
  toasts: [],
  add: (message, variant = 'info', duration = 4000) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, variant, duration }] }))
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, duration)
    }
  },
  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function useToast() {
  const add = useToastStore((s) => s.add)
  return {
    success: (message) => add(message, 'success'),
    error: (message) => add(message, 'error'),
    warning: (message) => add(message, 'warning'),
    info: (message) => add(message, 'info'),
  }
}

