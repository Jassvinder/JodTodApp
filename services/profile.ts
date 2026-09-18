import api from './api';
import type { ApiResponse } from '../types/api';
import type { User } from '../types/models';

export const profileService = {
  getProfile() {
    return api.get<ApiResponse<User>>('/profile');
  },

  updateProfile(data: { name: string; currency?: string; language?: string }) {
    return api.patch<ApiResponse<User>>('/profile', data);
  },

  updatePassword(data: { current_password?: string; password: string; password_confirmation: string }) {
    return api.put<{ success: boolean; message: string }>('/password', data);
  },

  deleteAccount(password: string) {
    return api.delete<ApiResponse<null>>('/profile', { data: { password } });
  },

  updateAvatar(base64: string) {
    return api.post<{ avatar_url: string }>('/profile/avatar', { avatar: base64 });
  },

  destroyAvatar() {
    return api.delete<{ message: string }>('/profile/avatar');
  },

  sendPhoneOtp(phone: string) {
    return api.post<{ message: string; otp_debug: string | null }>('/profile/phone/send-otp', { phone });
  },

  verifyPhoneOtp(phone: string, otp: string) {
    return api.post<{ message: string; phone: string }>('/profile/phone/verify', { phone, otp });
  },

  removePhone() {
    return api.delete<{ message: string }>('/profile/phone');
  },
};
