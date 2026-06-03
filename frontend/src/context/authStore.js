// src/context/authStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          set({
            user: data.data.user,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            isLoading: false,
          })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, message: err.response?.data?.message || 'Login failed' }
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/register', { name, email, password })
          set({
            user: data.data.user,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            isLoading: false,
          })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, message: err.response?.data?.message || 'Registration failed' }
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch {}
        set({ user: null, accessToken: null, refreshToken: null })
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) return false
        try {
          const { data } = await api.post('/auth/refresh', { refreshToken })
          set({
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          })
          return true
        } catch {
          set({ user: null, accessToken: null, refreshToken: null })
          return false
        }
      },
    }),
    {
      name: 'finpulse-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)

export default useAuthStore
