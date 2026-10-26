import { OPEN_PROSPECT_STATUSES } from '../constants/teamBuilder';
import { cancelLocalReminders, scheduleLocalReminder } from './localReminders';
import type { Prospect } from '../types/teamBuilder';

const MATCH_KEY = 'prospectId';

// Keeps the on-device follow-up reminder in step with the prospect after every save.
export async function syncFollowUpReminder(prospect: Prospect): Promise<void> {
  const isOpen = OPEN_PROSPECT_STATUSES.includes(prospect.status);
  if (!isOpen || !prospect.next_follow_up_at) {
    await cancelFollowUpReminder(prospect.id);
    return;
  }

  await scheduleLocalReminder(MATCH_KEY, {
    title: 'Follow-up due',
    body: `Time to follow up with ${prospect.name}.`,
    data: { type: 'prospect_follow_up', [MATCH_KEY]: prospect.id },
    date: new Date(prospect.next_follow_up_at),
  });
}

export function cancelFollowUpReminder(prospectId: number): Promise<void> {
  return cancelLocalReminders(MATCH_KEY, prospectId);
}
