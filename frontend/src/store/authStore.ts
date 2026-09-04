import { create } from 'zustand'
import api from '../lib/api'
import { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: () => boolean
  init: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,

  init: () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        set({ token, user: JSON.parse(userStr) })
      } catch {}
    }
  },

  login: async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    const { access_token, user } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token: access_token, user })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },

  isAdmin: () => get().user?.role === 'admin',
}))
