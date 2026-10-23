import api from './api';
import type { ApiResponse } from '../types/api';
import type { SupportDetails } from '../types/models';

export const supportService = {
  getDetails() {
    return api.get<ApiResponse<SupportDetails>>('/support');
  },
};
