import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ProspectActivityType, ProspectStatus, TeamMemberFlag } from '../types/teamBuilder';

export const TEAM_BUILDER_COLOR = '#d97706';

export const PROSPECT_STATUSES: ProspectStatus[] = ['new', 'plan_shown', 'follow_up', 'joined', 'not_interested'];

// Statuses that still need follow-ups (same as the backend's Prospect::OPEN_STATUSES).
export const OPEN_PROSPECT_STATUSES: ProspectStatus[] = ['new', 'plan_shown', 'follow_up'];

export const PROSPECT_STATUS_META: Record<ProspectStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: '#2563eb', bg: '#dbeafe' },
  plan_shown: { label: 'Plan Shown', color: '#7c3aed', bg: '#ede9fe' },
  follow_up: { label: 'Follow-up', color: '#d97706', bg: '#fef3c7' },
  joined: { label: 'Joined', color: '#16a34a', bg: '#dcfce7' },
  not_interested: { label: 'Not Interested', color: '#6b7280', bg: '#f3f4f6' },
};

export const ACTIVITY_TYPES: ProspectActivityType[] = ['call', 'plan_shown', 'follow_up', 'meeting', 'note'];

export const ACTIVITY_TYPE_META: Record<ProspectActivityType, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  call: { label: 'Call', icon: 'call-outline' },
  plan_shown: { label: 'Plan Shown', icon: 'easel-outline' },
  follow_up: { label: 'Follow-up', icon: 'repeat-outline' },
  meeting: { label: 'Meeting', icon: 'people-outline' },
  note: { label: 'Note', icon: 'document-text-outline' },
};

// Same rules as the backend's TeamMemberController.
export const MEMBER_FLAG_META: Record<TeamMemberFlag, { label: string; text: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  push: {
    label: 'Push needed',
    text: 'No call, plan, follow-up or meeting logged in the last 7 days.',
    color: '#dc2626',
    bg: '#fee2e2',
    icon: 'flash-outline',
  },
  training: {
    label: 'Training needed',
    text: 'Showed 5 or more plans in the last 30 days, but nobody joined.',
    color: '#7c3aed',
    bg: '#ede9fe',
    icon: 'school-outline',
  },
};
