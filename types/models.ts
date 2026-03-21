export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  avatar_url: string | null;
  currency: string;
  language: string;
  role: string;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  notification_email: boolean;
  notification_push: boolean;
}

export interface AuthData {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_name: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  device_name: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
}

export interface Expense {
  id: number;
  amount: number;
  description: string | null;
  expense_date: string;
  category_id: number;
  category?: Category;
  image_1: string | null;
  image_2: string | null;
  created_at: string;
}

export interface ExpenseSummary {
  monthly_total: number;
  last_month_total: number;
  category_breakdown: { category: string; icon: string; total: number }[];
}

export interface Income {
  id: number;
  amount: number;
  source: string;
  description: string | null;
  income_date: string;
  created_at: string;
}

export interface IncomeSummary {
  this_month_income: number;
  last_month_income: number;
  this_month_savings: number;
}

export interface Contact {
  id: number;
  contact_user_id: number;
  contact_user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    avatar_url: string | null;
  };
  created_at: string;
}

export interface SearchUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  avatar_url: string | null;
}

export interface TodoCategory {
  id: number;
  name: string;
  color: string;
}

export interface Todo {
  id: number;
  title: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  is_completed: boolean;
  category_id: number | null;
  category?: TodoCategory;
  assigned_to: number | null;
  assigned_user?: { id: number; name: string; avatar: string | null; avatar_url: string | null };
  reminder_at: string | null;
  user_id: number;
  created_at: string;
}

export interface GroupMember {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  avatar_url: string | null;
  pivot: { role: 'admin' | 'member'; is_active: boolean };
}

export interface Group {
  id: number;
  name: string;
  description: string | null;
  photo: string | null;
  photo_url: string | null;
  invite_code: string;
  members: GroupMember[];
  members_count: number;
  pivot?: { role: string };
  is_all_settled?: boolean;
}

export interface GroupExpense {
  id: number;
  amount: number;
  description: string | null;
  expense_date: string;
  category_id: number;
  category?: Category;
  paid_by: number;
  payer?: { id: number; name: string; avatar: string | null; avatar_url: string | null };
  split_type: 'equal' | 'custom' | 'percentage';
  splits?: { user_id: number; share_amount: number; percentage: number | null }[];
}

export interface MemberBalance {
  user_id: number;
  name: string;
  avatar: string | null;
  balance: number;
}

export interface SuggestedTransaction {
  from: { id: number; name: string; avatar: string | null };
  to: { id: number; name: string; avatar: string | null };
  amount: number;
}

export interface Settlement {
  id: number;
  from_user: { id: number; name: string; avatar: string | null };
  to_user: { id: number; name: string; avatar: string | null };
  amount: number;
  status: 'pending' | 'completed';
  settled_at: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  type: string;
  data: { title?: string; message?: string; [key: string]: any };
  read_at: string | null;
  created_at: string;
}
