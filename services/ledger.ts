import api from './api';
import type { ApiResponse } from '../types/api';
import type { LedgerEntryType, LedgerPerson, LedgerTotals } from '../types/models';

export interface LedgerPersonData {
  name: string;
  phone?: string | null;
  note?: string | null;
}

export interface LedgerEntryData {
  type: LedgerEntryType;
  amount: number;
  entry_date: string;
  note?: string | null;
}

export interface LedgerListResponse {
  people: LedgerPerson[];
  totals: LedgerTotals;
}

export const ledgerService = {
  getPeople() {
    return api.get<ApiResponse<LedgerListResponse>>('/ledger-people');
  },

  getPerson(id: number) {
    return api.get<ApiResponse<LedgerPerson>>(`/ledger-people/${id}`);
  },

  createPerson(data: LedgerPersonData) {
    return api.post<ApiResponse<LedgerPerson>>('/ledger-people', data);
  },

  updatePerson(id: number, data: LedgerPersonData) {
    return api.put<ApiResponse<LedgerPerson>>(`/ledger-people/${id}`, data);
  },

  deletePerson(id: number) {
    return api.delete<ApiResponse<null>>(`/ledger-people/${id}`);
  },

  addEntry(id: number, data: LedgerEntryData) {
    return api.post<ApiResponse<LedgerPerson>>(`/ledger-people/${id}/entries`, data);
  },

  updateEntry(id: number, entryId: number, data: LedgerEntryData) {
    return api.put<ApiResponse<LedgerPerson>>(`/ledger-people/${id}/entries/${entryId}`, data);
  },

  deleteEntry(id: number, entryId: number) {
    return api.delete<ApiResponse<LedgerPerson>>(`/ledger-people/${id}/entries/${entryId}`);
  },
};
