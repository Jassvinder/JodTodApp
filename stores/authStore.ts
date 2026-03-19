import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/auth';
import type { User, LoginPayload, RegisterPayload } from '../types/models';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  loginWithOtp: (data: { phone: string; otp: string; device_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  loadToken: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        set({ token, isAuthenticated: true });
        // Fetch fresh user data
        const response = await authService.getUser();
        set({ user: response.data.data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      // Token expired or invalid
      await SecureStore.deleteItemAsync('auth_token');
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (data: LoginPayload) => {
    const response = await authService.login(data);
    const { token, user } = response.data.data;

    await SecureStore.setItemAsync('auth_token', token);
    set({ token, user, isAuthenticated: true });
  },

  register: async (data: RegisterPayload) => {
    const response = await authService.register(data);
    const { token, user } = response.data.data;

    await SecureStore.setItemAsync('auth_token', token);
    set({ token, user, isAuthenticated: true });
  },

  loginWithOtp: async (data: { phone: string; otp: string; device_name: string }) => {
    const response = await authService.verifyOtp(data);
    const { token, user } = response.data.data;

    await SecureStore.setItemAsync('auth_token', token);
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors
    }
    await SecureStore.deleteItemAsync('auth_token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  setUser: (user: User) => set({ user }),
}));
