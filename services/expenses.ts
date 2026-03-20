import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { Expense, Category, ExpenseSummary } from '../types/models';

export interface ExpenseListParams {
  category?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
}

export interface ExpenseListResponse extends PaginatedResponse<Expense> {
  summary: ExpenseSummary;
}

export const expenseService = {
  getExpenses(params?: ExpenseListParams) {
    return api.get<ExpenseListResponse>('/expenses', { params });
  },

  getExpense(id: number) {
    return api.get<ApiResponse<Expense>>(`/expenses/${id}`);
  },

  createExpense(formData: FormData) {
    return api.post<ApiResponse<Expense>>('/expenses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateExpense(id: number, formData: FormData) {
    // Use POST with _method=PUT for FormData (Laravel convention)
    formData.append('_method', 'PUT');
    return api.post<ApiResponse<Expense>>(`/expenses/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteExpense(id: number) {
    return api.delete<ApiResponse<null>>(`/expenses/${id}`);
  },

  getSuggestions(query: string) {
    return api.get<ApiResponse<string[]>>('/expense-suggestions', { params: { q: query } });
  },

  getCategories() {
    return api.get<ApiResponse<Category[]>>('/categories');
  },
};
