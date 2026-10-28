import { TEAM_BUILDER_HOME_ROUTE } from '../constants/navigation';

type Route = { pathname: string; params?: Record<string, string> };

// Screen to open for a Team Builder notification (push tap or the Notifications list), or null.
export function getTeamBuilderNotificationRoute(data: Record<string, any>): Route | null {
  const teamId = data.team_id ? String(data.team_id) : null;

  switch (data.type) {
    case 'team_member_joined':
    case 'team_weekly_summary':
      return teamId ? { pathname: '/tb-team-detail', params: { id: teamId } } : { pathname: TEAM_BUILDER_HOME_ROUTE };
    case 'team_announcement':
      return teamId ? { pathname: '/tb-announcements', params: { teamId } } : { pathname: TEAM_BUILDER_HOME_ROUTE };
    case 'team_target_set':
      return { pathname: TEAM_BUILDER_HOME_ROUTE };
    case 'prospect_follow_up':
      return data.prospectId ? { pathname: '/tb-prospect-detail', params: { id: String(data.prospectId) } } : null;
    default:
      return null;
  }
}
