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
  has_password: boolean;
  friend_code?: string;
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
  daily_trend: { date: string; total: number }[];
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
  this_month_expense: number;
  this_month_savings: number;
  source_breakdown: { source: string; total: number }[];
  monthly_trend: { month: string; short_month: string; income: number; expense: number; savings: number }[];
}

export interface Contact {
  id: number;
  contact_user_id: number;
  contact_user: {
    id: number;
    name: string;
    email: string;
    friend_code: string;
    avatar: string | null;
    avatar_url: string | null;
  };
  created_at: string;
}

export interface SearchUser {
  id: number;
  name: string;
  friend_code: string;
  avatar: string | null;
  avatar_url: string | null;
  // Pending contact request between the current user and this user, if any.
  request_status?: 'sent' | 'received' | null;
}

export type ContactRequestUser = Pick<SearchUser, 'id' | 'name' | 'friend_code' | 'avatar' | 'avatar_url'>;

export interface ContactRequest {
  id: number;
  user_id: number;
  user: ContactRequestUser;
  created_at: string;
}

export interface SentContactRequest {
  id: number;
  contact_user_id: number;
  contact_user: ContactRequestUser;
  created_at: string;
}

export interface TodoCategory {
  id: number;
  name: string;
  color: string;
  is_default: boolean;
}

export interface Todo {
  id: number;
  title: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  is_completed: boolean;
  todo_category_id: number | null;
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

export interface RememberEntry {
  id: number;
  done_on: string;
  note: string | null;
}

export interface RememberItem {
  id: number;
  name: string;
  note: string | null;
  entries_count: number;
  last_done_on: string | null;
  avg_gap_days: number | null;
  created_at: string;
  entries?: RememberEntry[];
}

// GET /support: free-for-now note and the UPI details set by the admin.
export interface SupportDetails {
  title: string;
  paragraphs: string[];
  early_users_note: string | null;
  pay_steps: string[];
  upi_id: string | null;
  payee_name: string;
  qr_url: string | null;
  upi_link: string | null;
}
