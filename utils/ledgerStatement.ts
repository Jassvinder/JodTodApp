import { formatCurrency, formatShortDate } from './format';
import { LEDGER_LABEL } from '../constants/navigation';
import { openWhatsApp } from './phone';
import type { LedgerPerson } from '../types/models';

const MAX_STATEMENT_ENTRIES = 30;

// Statement written to the other person, so "gave" reads as "I gave you".
export function buildLedgerStatement(person: LedgerPerson): string {
  // The API returns entries newest first; a statement reads oldest first.
  const entries = (person.entries ?? []).slice(0, MAX_STATEMENT_ENTRIES).reverse();
  const lines = entries.map((entry) =>
    `${formatShortDate(entry.entry_date)} - ${entry.type === 'gave' ? 'I gave you' : 'You paid me'} ${formatCurrency(entry.amount)}${entry.note ? ` (${entry.note})` : ''}`,
  );

  const balance =
    person.balance > 0
      ? `You have to pay me ${formatCurrency(person.balance)}`
      : person.balance < 0
        ? `I have to pay you ${formatCurrency(Math.abs(person.balance))}`
        : 'All settled';

  return [
    `Hi ${person.name},`,
    `Here is our ${LEDGER_LABEL} account from JodTod:`,
    '',
    ...(person.entries_count > entries.length ? [`(Last ${entries.length} of ${person.entries_count} entries)`] : []),
    ...lines,
    '',
    `Total I gave: ${formatCurrency(person.total_gave)}`,
    `Total you paid: ${formatCurrency(person.total_got)}`,
    `Balance: ${balance}`,
  ].join('\n');
}

// Opens WhatsApp straight to the person's chat when they have a phone, otherwise the share sheet.
export function shareLedgerStatement(person: LedgerPerson): Promise<void> {
  return openWhatsApp(person.phone, buildLedgerStatement(person));
}
