import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type {
  Group,
  GroupExpense,
  MemberBalance,
  SuggestedTransaction,
  Settlement,
  Category,
} from '../types/models';

export interface GroupExpenseListParams {
  category?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
}

export interface GroupExpensePayload {
  description: string;
  amount: number;
  paid_by: number;
  category_id: number;
  expense_date: string;
  split_type: 'equal' | 'custom' | 'percentage';
  splits: { user_id: number; share_amount: number; percentage: number | null }[];
}

export interface GroupShowResponse {
  group: Group;
  isAdmin: boolean;
  recentExpenses: GroupExpense[];
  totalExpensesCount: number;
  totalExpensesAmount: number;
  contacts: { id: number; name: string; email: string; phone: string | null; avatar: string | null }[];
  membersWithUnsettled: number[];
  pendingMembers: { id: number; name: string; email: string; phone: string | null; avatar: string | null }[];
}

export interface SettlementsResponse {
  balances: MemberBalance[];
  suggestedTransactions: SuggestedTransaction[];
  settlements: Settlement[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const groupService = {
  // Group CRUD
  getGroups() {
    return api.get<ApiResponse<Group[]>>('/groups');
  },

  createGroup(data: FormData) {
    return api.post<ApiResponse<Group>>('/groups', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getGroup(id: number) {
    return api.get<ApiResponse<GroupShowResponse>>(`/groups/${id}`);
  },

  updateGroup(id: number, data: FormData) {
    return api.post<ApiResponse<Group>>(`/groups/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteGroup(id: number) {
    return api.delete<ApiResponse<null>>(`/groups/${id}`);
  },

  // Join / Leave
  joinGroup(invite_code: string) {
    return api.post<ApiResponse<Group>>('/groups/join', { invite_code });
  },

  leaveGroup(id: number) {
    return api.post<ApiResponse<null>>(`/groups/${id}/leave`);
  },

  // Members
  addMember(groupId: number, user_id: number) {
    return api.post<ApiResponse<null>>(`/groups/${groupId}/add-member`, { user_id });
  },

  removeMember(groupId: number, userId: number) {
    return api.delete<ApiResponse<null>>(`/groups/${groupId}/members/${userId}`);
  },

  reactivateMember(groupId: number, userId: number) {
    return api.post<ApiResponse<null>>(`/groups/${groupId}/members/${userId}/reactivate`);
  },

  approveMember(groupId: number, userId: number) {
    return api.post<ApiResponse<null>>(`/groups/${groupId}/members/${userId}/approve`);
  },

  rejectMember(groupId: number, userId: number) {
    return api.delete<ApiResponse<null>>(`/groups/${groupId}/members/${userId}/reject`);
  },

  // Group Expenses
  getGroupExpenses(groupId: number, params?: GroupExpenseListParams) {
    return api.get<PaginatedResponse<GroupExpense>>(`/groups/${groupId}/expenses`, { params });
  },

  createGroupExpense(groupId: number, data: GroupExpensePayload) {
    return api.post<ApiResponse<GroupExpense>>(`/groups/${groupId}/expenses`, data);
  },

  updateGroupExpense(groupId: number, expenseId: number, data: GroupExpensePayload) {
    return api.put<ApiResponse<GroupExpense>>(`/groups/${groupId}/expenses/${expenseId}`, data);
  },

  deleteGroupExpense(groupId: number, expenseId: number) {
    return api.delete<ApiResponse<null>>(`/groups/${groupId}/expenses/${expenseId}`);
  },

  // Balances
  getBalances(groupId: number) {
    return api.get<ApiResponse<{ balances: MemberBalance[] }>>(`/groups/${groupId}/balances`);
  },

  // Settlements
  getSettlements(groupId: number, page?: number) {
    return api.get<ApiResponse<SettlementsResponse>>(`/groups/${groupId}/settlements`, { params: { page } });
  },

  settleUp(groupId: number) {
    return api.post<ApiResponse<null>>(`/groups/${groupId}/settle`);
  },

  markSettlementComplete(groupId: number, settlementId: number) {
    return api.put<ApiResponse<null>>(`/groups/${groupId}/settlements/${settlementId}/complete`);
  },

  settleAll(groupId: number) {
    return api.post<ApiResponse<null>>(`/groups/${groupId}/settle-all`);
  },

  // Categories (reuse from expenses)
  getCategories() {
    return api.get<ApiResponse<Category[]>>('/categories');
  },
};
