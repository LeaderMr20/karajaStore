import { create } from 'zustand';
import api from '../services/api';
import type { User, AuthResponse, LoginCredentials } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true });
    try {
      const response = await api.post<{ success: boolean; data: AuthResponse }>('/login', credentials);
      const { user, access_token } = response.data.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/logout');
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const response = await api.get('/me');
      const user = response.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));
