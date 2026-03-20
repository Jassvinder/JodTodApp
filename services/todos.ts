import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { Todo, TodoCategory } from '../types/models';

export interface TodoListParams {
  status?: 'pending' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  category_id?: number;
  scope?: 'assigned_to_me' | 'assigned_by_me';
  search?: string;
  page?: number;
}

export interface CreateTodoData {
  title: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string | null;
  category_id?: number | null;
  assigned_to?: number | null;
  reminder_at?: string | null;
}

export interface UpdateTodoData extends CreateTodoData {}

export interface CreateCategoryData {
  name: string;
  color: string;
}

export const todoService = {
  getTodos(params?: TodoListParams) {
    return api.get<PaginatedResponse<Todo>>('/todos', { params });
  },

  createTodo(data: CreateTodoData) {
    return api.post<ApiResponse<Todo>>('/todos', data);
  },

  updateTodo(id: number, data: UpdateTodoData) {
    return api.put<ApiResponse<Todo>>(`/todos/${id}`, data);
  },

  deleteTodo(id: number) {
    return api.delete<ApiResponse<null>>(`/todos/${id}`);
  },

  toggleTodo(id: number) {
    return api.patch<ApiResponse<Todo>>(`/todos/${id}/toggle`);
  },

  getCategories() {
    return api.get<ApiResponse<TodoCategory[]>>('/todo-categories');
  },

  createCategory(data: CreateCategoryData) {
    return api.post<ApiResponse<TodoCategory>>('/todo-categories', data);
  },

  updateCategory(id: number, data: CreateCategoryData) {
    return api.put<ApiResponse<TodoCategory>>(`/todo-categories/${id}`, data);
  },

  deleteCategory(id: number) {
    return api.delete<ApiResponse<null>>(`/todo-categories/${id}`);
  },
};
