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

// 'push': nothing logged for 7 days. 'training': many plans in 30 days but nobody joined.
export type TeamMemberFlag = 'push' | 'training';

// Someone below me in a team (any depth), as the upline sees them.
export interface TeamMemberSummary {
  user_id: number;
  name: string;
  avatar_url: string | null;
  phone: string | null;
  joined_at: string;
  is_direct: boolean;
  sponsor_name: string | null;
  last_active_at: string | null;
  open_prospects: number;
  overdue_follow_ups: number;
  plans_week: number;
  follow_ups_week: number;
  joined_week: number;
  target: WeeklyTarget | null;
  flag: TeamMemberFlag | null;
}

// 0 means no target for that number.
export interface WeeklyTarget {
  plans_per_week: number;
  follow_ups_per_week: number;
  // Upline who set it; null when the user set it themselves.
  set_by_name: string | null;
}

export interface TeamAnnouncement {
  id: number;
  team_id: number;
  team_name: string | null;
  message: string;
  link: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  is_mine: boolean;
  created_at: string;
}

export interface AnnouncementsResponse {
  announcements: TeamAnnouncement[];
  // Only members with someone below them can post.
  can_post: boolean;
}

export interface TeamMembersResponse {
  members: TeamMemberSummary[];
  counts: { total: number; push: number; training: number };
}

// What an upline may see of a member's prospect: no phone number or notes.
export interface ProspectBrief {
  id: number;
  name: string;
  status: ProspectStatus;
  next_follow_up_at: string | null;
  joined_at: string | null;
  last_activity_at: string | null;
}

export interface TeamMemberDetail extends TeamMemberSummary {
  prospects: ProspectBrief[];
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
  target: WeeklyTarget | null;
  latest_announcement: TeamAnnouncement | null;
}
