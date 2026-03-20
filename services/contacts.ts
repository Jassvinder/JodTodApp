import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { Contact, SearchUser } from '../types/models';

export interface ContactListParams {
  search?: string;
  page?: number;
}

export const contactService = {
  getContacts(params?: ContactListParams) {
    return api.get<PaginatedResponse<Contact>>('/contacts', { params });
  },

  searchUsers(query: string) {
    return api.get<ApiResponse<SearchUser[]>>('/contacts/search', { params: { q: query } });
  },

  addContact(contact_user_id: number) {
    return api.post<ApiResponse<Contact>>('/contacts', { contact_user_id });
  },

  removeContact(id: number) {
    return api.delete<ApiResponse<null>>(`/contacts/${id}`);
  },
};
