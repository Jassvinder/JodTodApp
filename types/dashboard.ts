export interface PersonalSummary {
  this_month_total: number;
  last_month_total: number;
  category_breakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  name: string;
  icon: string;
  total: number;
}

export interface IncomeSummary {
  this_month_income: number;
  last_month_income: number;
  this_month_savings: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

export interface GroupBalance {
  group_id: number;
  group_name: string;
  your_balance: number;
  members_count: number;
}

export interface GroupsSummary {
  groups: GroupBalance[];
  total_you_owe: number;
  total_owed_to_you: number;
}

export interface RecentActivity {
  type: 'personal_expense' | 'group_expense' | 'settlement';
  description: string;
  amount: number;
  date: string;
  category: string | null;
  category_icon: string | null;
  group_name: string | null;
  status?: string;
}

export interface PendingSettlement {
  id: number;
  group_name: string;
  to_user_name: string;
  to_user_avatar: string | null;
  amount: number;
}

export interface TodoStats {
  pending: number;
  overdue: number;
}

export interface DashboardData {
  personalSummary: PersonalSummary;
  incomeSummary: IncomeSummary;
  monthlyTrend: MonthlyTrend[];
  groupsSummary: GroupsSummary;
  recentActivity: RecentActivity[];
  pendingSettlements: { items: PendingSettlement[]; count: number };
  todoStats: TodoStats;
}
