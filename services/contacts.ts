import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { Contact, ContactRequest, SearchUser, SentContactRequest } from '../types/models';

export interface ContactListParams {
  search?: string;
  page?: number;
}

export const contactService = {
  getContacts(params?: ContactListParams, signal?: AbortSignal) {
    return api.get<PaginatedResponse<Contact>>('/contacts', { params, signal });
  },

  searchUsers(query: string) {
    return api.get<ApiResponse<SearchUser[]>>('/contacts/search', { params: { q: query } });
  },

  addContact(contact_user_id: number) {
    return api.post<ApiResponse<Contact>>('/contacts', { contact_user_id });
  },

  getContactRequests() {
    return api.get<ApiResponse<ContactRequest[]>>('/contacts/requests');
  },

  getSentRequests() {
    return api.get<ApiResponse<SentContactRequest[]>>('/contacts/requests/sent');
  },

  approveContactRequest(id: number) {
    return api.post<ApiResponse<null>>(`/contacts/${id}/approve`);
  },

  rejectContactRequest(id: number) {
    return api.delete<ApiResponse<null>>(`/contacts/${id}/reject`);
  },

  removeContact(id: number) {
    return api.delete<ApiResponse<null>>(`/contacts/${id}`);
  },
};
