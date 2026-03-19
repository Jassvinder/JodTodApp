import api from './api';
import type { ApiResponse } from '../types/api';
import type { User } from '../types/models';

export const profileService = {
  getProfile() {
    return api.get<ApiResponse<User>>('/profile');
  },

  updateProfile(data: { name: string; email: string }) {
    return api.patch<ApiResponse<User>>('/profile', data);
  },

  deleteAccount(password: string) {
    return api.delete<ApiResponse<null>>('/profile', { data: { password } });
  },
};
