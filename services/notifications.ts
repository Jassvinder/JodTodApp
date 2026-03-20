import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { AppNotification } from '../types/models';

export interface RecentNotificationsResponse {
  notifications: AppNotification[];
  unread_count: number;
}

export const notificationService = {
  getNotifications(page: number = 1) {
    return api.get<PaginatedResponse<AppNotification>>('/notifications', {
      params: { page },
    });
  },

  getRecent() {
    return api.get<ApiResponse<RecentNotificationsResponse>>('/notifications/recent');
  },

  markRead(id: string) {
    return api.put<ApiResponse<AppNotification>>(`/notifications/${id}/read`);
  },

  markAllRead() {
    return api.post<ApiResponse<null>>('/notifications/read-all');
  },
};
