import { formatCurrency } from '../utils/format';
import { cancelLocalReminders, getLocalReminderDate, scheduleLocalReminder } from './localReminders';

const MATCH_KEY = 'ledgerPersonId';

// On-device reminder to collect money from a Give & Take person.
export function scheduleCollectReminder(personId: number, name: string, amount: number, date: Date): Promise<boolean> {
  return scheduleLocalReminder(MATCH_KEY, {
    title: 'Collect money',
    body: `${name} owes you ${formatCurrency(amount)}.`,
    data: { type: 'ledger_reminder', [MATCH_KEY]: personId },
    date,
  });
}

export function cancelCollectReminder(personId: number): Promise<void> {
  return cancelLocalReminders(MATCH_KEY, personId);
}

export function getCollectReminderDate(personId: number): Promise<Date | null> {
  return getLocalReminderDate(MATCH_KEY, personId);
}
