import api from './api';
import type { ApiResponse } from '../types/api';
import type {
  FollowUpsResponse,
  Prospect,
  ProspectActivityType,
  ProspectListResponse,
  ProspectStatus,
  TeamBuilderDashboard,
  TeamDetail,
  TeamSummary,
} from '../types/teamBuilder';

export interface TeamData {
  name: string;
  company_name?: string | null;
}

export interface ProspectData {
  name: string;
  phone?: string | null;
  source?: string | null;
  team_id?: number | null;
  status: ProspectStatus;
  // Local time, "YYYY-MM-DD HH:MM" (the server uses Indian time).
  next_follow_up_at?: string | null;
  note?: string | null;
}

export interface ProspectActivityData {
  type: ProspectActivityType;
  note?: string | null;
  status?: ProspectStatus;
  // Sent as null to clear the follow-up.
  next_follow_up_at: string | null;
}

const BASE = '/team-builder';

export const teamBuilderService = {
  getDashboard() {
    return api.get<ApiResponse<TeamBuilderDashboard>>(`${BASE}/dashboard`);
  },

  getFollowUps() {
    return api.get<ApiResponse<FollowUpsResponse>>(`${BASE}/follow-ups`);
  },

  getTeams() {
    return api.get<ApiResponse<TeamSummary[]>>(`${BASE}/teams`);
  },

  getTeam(id: number) {
    return api.get<ApiResponse<TeamDetail>>(`${BASE}/teams/${id}`);
  },

  createTeam(data: TeamData) {
    return api.post<ApiResponse<TeamSummary>>(`${BASE}/teams`, data);
  },

  updateTeam(id: number, data: TeamData) {
    return api.put<ApiResponse<TeamSummary>>(`${BASE}/teams/${id}`, data);
  },

  deleteTeam(id: number) {
    return api.delete<ApiResponse<null>>(`${BASE}/teams/${id}`);
  },

  joinTeam(inviteCode: string) {
    return api.post<ApiResponse<TeamSummary>>(`${BASE}/teams/join`, { invite_code: inviteCode });
  },

  leaveTeam(id: number) {
    return api.post<ApiResponse<null>>(`${BASE}/teams/${id}/leave`);
  },

  getProspects(params: { status?: ProspectStatus; search?: string } = {}) {
    return api.get<ApiResponse<ProspectListResponse>>(`${BASE}/prospects`, { params });
  },

  getProspect(id: number) {
    return api.get<ApiResponse<Prospect>>(`${BASE}/prospects/${id}`);
  },

  createProspect(data: ProspectData) {
    return api.post<ApiResponse<Prospect>>(`${BASE}/prospects`, data);
  },

  updateProspect(id: number, data: ProspectData) {
    return api.put<ApiResponse<Prospect>>(`${BASE}/prospects/${id}`, data);
  },

  deleteProspect(id: number) {
    return api.delete<ApiResponse<null>>(`${BASE}/prospects/${id}`);
  },

  addActivity(id: number, data: ProspectActivityData) {
    return api.post<ApiResponse<Prospect>>(`${BASE}/prospects/${id}/activities`, data);
  },

  deleteActivity(id: number, activityId: number) {
    return api.delete<ApiResponse<Prospect>>(`${BASE}/prospects/${id}/activities/${activityId}`);
  },
};
