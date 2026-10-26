export type ProspectStatus = 'new' | 'plan_shown' | 'follow_up' | 'joined' | 'not_interested';

export type ProspectActivityType = 'call' | 'plan_shown' | 'follow_up' | 'meeting' | 'note';

export interface TeamPerson {
  id: number;
  name: string;
  avatar_url: string | null;
  phone: string | null;
}

export interface TeamSummary {
  id: number;
  name: string;
  company_name: string | null;
  is_owner: boolean;
  // My own code: whoever joins with it gets me as their sponsor.
  invite_code: string;
  joined_at: string;
  // 0 = top of the tree.
  level: number;
  sponsor: TeamPerson | null;
  direct_count: number;
  downline_count: number;
}

export interface TeamDirectMember {
  user_id: number;
  name: string;
  avatar_url: string | null;
  phone: string | null;
  joined_at: string;
  direct_count: number;
  downline_count: number;
}

export interface TeamDetail extends TeamSummary {
  direct_members: TeamDirectMember[];
}

export interface ProspectActivity {
  id: number;
  type: ProspectActivityType;
  note: string | null;
  done_at: string;
}

export interface Prospect {
  id: number;
  name: string;
  phone: string | null;
  source: string | null;
  status: ProspectStatus;
  team_id: number | null;
  team_name: string | null;
  next_follow_up_at: string | null;
  joined_at: string | null;
  note: string | null;
  last_activity_at: string | null;
  created_at: string;
  activities?: ProspectActivity[];
}

export type ProspectStatusCounts = Record<ProspectStatus, number>;

export interface ProspectListResponse {
  prospects: Prospect[];
  status_counts: ProspectStatusCounts;
}

export interface FollowUpsResponse {
  overdue: Prospect[];
  today: Prospect[];
  upcoming: Prospect[];
}

export interface TeamBuilderDashboard {
  week: {
    plans_shown: number;
    follow_ups: number;
    calls: number;
    meetings: number;
    new_prospects: number;
    joined: number;
  };
  follow_ups: { overdue: number; today: number };
  pipeline: ProspectStatusCounts;
  teams: { id: number; name: string; downline_count: number }[];
}
