import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { Income, IncomeSummary } from '../types/models';

export interface IncomeListParams {
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
}

export interface IncomeListResponse extends PaginatedResponse<Income> {
  summary: IncomeSummary;
}

export interface IncomePayload {
  amount: number;
  source: string;
  description?: string;
  income_date: string;
}

export const incomeService = {
  getIncomes(params?: IncomeListParams) {
    return api.get<IncomeListResponse>('/incomes', { params });
  },

  getIncome(id: number) {
    return api.get<ApiResponse<Income>>(`/incomes/${id}`);
  },

  createIncome(data: IncomePayload) {
    return api.post<ApiResponse<Income>>('/incomes', data);
  },

  updateIncome(id: number, data: IncomePayload) {
    return api.put<ApiResponse<Income>>(`/incomes/${id}`, data);
  },

  deleteIncome(id: number) {
    return api.delete<ApiResponse<null>>(`/incomes/${id}`);
  },

  getSuggestions(query: string) {
    return api.get<ApiResponse<string[]>>('/income-suggestions', { params: { q: query } });
  },
};
