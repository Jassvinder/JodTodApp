import api from './api';
import type { ApiResponse } from '../types/api';
import type { AuthData, LoginPayload, RegisterPayload, User } from '../types/models';

export const authService = {
  login(data: LoginPayload) {
    return api.post<ApiResponse<AuthData>>('/login', data);
  },

  register(data: RegisterPayload) {
    return api.post<ApiResponse<AuthData>>('/register', data);
  },

  logout() {
    return api.post<ApiResponse<null>>('/logout');
  },

  getUser() {
    return api.get<ApiResponse<User>>('/user');
  },

  forgotPassword(email: string) {
    return api.post<ApiResponse<null>>('/forgot-password', { email });
  },

  resetPassword(data: { token: string; email: string; password: string; password_confirmation: string }) {
    return api.post<ApiResponse<null>>('/reset-password', data);
  },

  sendOtp(phone: string) {
    return api.post<ApiResponse<{ otp_debug?: string } | null>>('/otp/send', { phone });
  },

  verifyOtp(data: { phone: string; otp: string; device_name: string }) {
    return api.post<ApiResponse<AuthData>>('/otp/verify', data);
  },
};
