import api from './api';
import type { ApiResponse } from '../types/api';
import type { RememberItem } from '../types/models';

export interface RememberItemData {
  name: string;
  note?: string | null;
}

export interface CreateRememberItemData extends RememberItemData {
  done_on?: string | null;
}

export interface RememberEntryData {
  done_on: string;
  note?: string | null;
}

export const rememberService = {
  getItems() {
    return api.get<ApiResponse<RememberItem[]>>('/remember-items');
  },

  getItem(id: number) {
    return api.get<ApiResponse<RememberItem>>(`/remember-items/${id}`);
  },

  createItem(data: CreateRememberItemData) {
    return api.post<ApiResponse<RememberItem>>('/remember-items', data);
  },

  updateItem(id: number, data: RememberItemData) {
    return api.put<ApiResponse<RememberItem>>(`/remember-items/${id}`, data);
  },

  deleteItem(id: number) {
    return api.delete<ApiResponse<null>>(`/remember-items/${id}`);
  },

  addEntry(id: number, data: RememberEntryData) {
    return api.post<ApiResponse<RememberItem>>(`/remember-items/${id}/entries`, data);
  },

  deleteEntry(id: number, entryId: number) {
    return api.delete<ApiResponse<RememberItem>>(`/remember-items/${id}/entries/${entryId}`);
  },
};
