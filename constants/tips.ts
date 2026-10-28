import type Ionicons from '@expo/vector-icons/Ionicons';

type IconName = keyof typeof Ionicons.glyphMap;

export type TipScreen = 'dashboard' | 'expenses' | 'incomes' | 'groups' | 'todos' | 'contacts' | 'remember' | 'ledger';

export interface Tip {
  // Matches the `id` of a TipAnchor on the screen.
  anchor: string;
  title: string;
  text: string;
}

// One-time tips per screen. They show on the first visit and can be replayed with the "?" button.
export const SCREEN_TIPS: Record<TipScreen, Tip[]> = {
  dashboard: [
    { anchor: 'dashboard.summary', title: 'Your month at a glance', text: 'Spending, income, savings, and what you have to pay or receive from groups and Give & Take. Tap a card header or a row to open its details. Use the + button to add an expense, income, task or Give & Take entry.' },
    { anchor: 'dashboard.notifications', title: 'Notifications', text: 'Contact requests, task reminders and group updates show up here.' },
    { anchor: 'dashboard.menu', title: 'Menu', text: 'Open Contacts, Remember, Help & Tips and everything else from here.' },
  ],
  expenses: [
    { anchor: 'expenses.add', title: 'Add an expense', text: 'Record what you spent and pick a category, so the dashboard can show where your money goes.' },
  ],
  incomes: [
    { anchor: 'incomes.add', title: 'Add income', text: 'Add salary or any other income. Savings on the dashboard is income minus expenses.' },
  ],
  groups: [
    { anchor: 'groups.create', title: 'Create a group', text: 'Make a group for a trip, flat or event, add friends from your contacts, and split bills. JodTod works out who owes whom.' },
    { anchor: 'groups.join', title: 'Join a group', text: 'Got an invite code from a friend? Enter it here to join their group.' },
  ],
  todos: [
    { anchor: 'todos.add', title: 'Add a task', text: 'Set a due date and a reminder. You can also assign the task to one of your contacts.' },
    { anchor: 'todos.filters', title: 'Filter tasks', text: 'Show pending or completed tasks, or narrow them down by priority and category.' },
  ],
  contacts: [
    { anchor: 'contacts.add', title: 'Add a contact', text: 'Find friends by name or friend code and send a request. Once they approve, you can add them to groups and assign them tasks.' },
    { anchor: 'contacts.requests', title: 'Requests', text: 'Requests you received and the ones you sent are here.' },
  ],
  remember: [
    { anchor: 'remember.add', title: 'Remember something', text: 'Save things like when you changed the gas cylinder. Add a date each time it happens, and JodTod shows how often it usually does.' },
  ],
  ledger: [
    { anchor: 'ledger.add', title: 'Add a person', text: 'Add anyone you lend money to or borrow from. Then record each "You Gave" and "You Got", and JodTod keeps the running total.' },
  ],
};

export interface WelcomeSlide {
  icon: IconName;
  color: string;
  background: string;
  title: string;
  text: string;
}

export const WELCOME_SLIDES: WelcomeSlide[] = [
  { icon: 'wallet-outline', color: '#6366f1', background: '#eef2ff', title: 'Track every rupee', text: 'Add expenses and income, see where your money goes, and how much you save each month.' },
  { icon: 'people-outline', color: '#16a34a', background: '#dcfce7', title: 'Split bills with friends', text: 'Create a group for a trip or flat, add shared expenses, and JodTod tells everyone who owes whom.' },
  { icon: 'checkbox-outline', color: '#d97706', background: '#fef3c7', title: 'Plan tasks and reminders', text: 'Add tasks with reminders, plan events months ahead, and assign tasks to friends.' },
  { icon: 'bookmark-outline', color: '#db2777', background: '#fce7f3', title: 'Remember the little things', text: 'Log when you last changed the gas cylinder or remote batteries, and see how often it happens.' },
];

export interface HelpTopic {
  icon: IconName;
  title: string;
  text: string;
  route: string;
}

export const HELP_TOPICS: HelpTopic[] = [
  { icon: 'home-outline', title: 'Dashboard', text: 'This month\'s spending, income, savings, group balances, pending payments and recent activity in one place.', route: '/(tabs)' },
  { icon: 'wallet-outline', title: 'Expenses', text: 'Record personal expenses with a category and date. Search and filter them any time.', route: '/(tabs)/expenses' },
  { icon: 'trending-up-outline', title: 'Income', text: 'Record salary and other income. Savings = income minus expenses.', route: '/(tabs)/incomes' },
  { icon: 'people-circle-outline', title: 'Groups', text: 'Create or join a group, add shared expenses, and settle up. JodTod calculates who owes whom.', route: '/(tabs)/groups' },
  { icon: 'checkbox-outline', title: 'Tasks', text: 'Tasks with due dates, priorities, categories and reminders. Assign tasks to your contacts.', route: '/todos' },
  { icon: 'people-outline', title: 'Contacts', text: 'Friends you split bills and share tasks with. Find them by name or friend code; they join your list after approving.', route: '/contacts' },
  { icon: 'bookmark-outline', title: 'Remember', text: 'Log when recurring things happened, like a gas cylinder change, and see the usual gap between them.', route: '/remember' },
  { icon: 'swap-horizontal-outline', title: 'Give & Take', text: 'Keep a simple record of money you give to or get from people, with each person\'s running balance and your overall "You will get" / "You will give" totals. Share a person\'s statement on WhatsApp and set a reminder to collect money.', route: '/ledger' },
  { icon: 'git-network-outline', title: 'Team Builder', text: 'For network marketing. Switch from More. Add prospects, log calls, plans and follow-ups, get follow-up reminders, and build your team: share your invite code, and everyone who joins with it comes under you. Set weekly targets, see who needs a push or training, and post announcements to your team.', route: '/mode-select' },
  { icon: 'notifications-outline', title: 'Notifications', text: 'Contact requests, task reminders, and group expense and settlement updates.', route: '/notifications' },
];
