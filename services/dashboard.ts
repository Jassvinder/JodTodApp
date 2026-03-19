import api from './api';
import type { ApiResponse } from '../types/api';
import type { DashboardData } from '../types/dashboard';

export const dashboardService = {
  getData() {
    return api.get<ApiResponse<DashboardData>>('/dashboard');
  },
};
