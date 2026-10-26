import type Ionicons from '@expo/vector-icons/Ionicons';
import type { AppMode } from '../types/models';

type IconName = keyof typeof Ionicons.glyphMap;

export interface NavItem {
  label: string;
  icon: IconName;
  route: string;
}

export interface BottomTab extends NavItem {
  // File name of the screen inside the tab layout folder.
  screen: string;
  activeIcon: IconName;
  // Other screens (opened from this tab) that keep this tab highlighted in BottomNav.
  alsoActiveOn?: string[];
}

// Display name of the personal ledger (routes and code still say "ledger").
export const LEDGER_LABEL = 'Give & Take';
export const TEAM_BUILDER_LABEL = 'Team Builder';

export const PERSONAL_HOME_ROUTE = '/(tabs)';
export const TEAM_BUILDER_HOME_ROUTE = '/team-builder';
export const MODE_SELECT_ROUTE = '/mode-select';

export function homeRouteFor(mode: AppMode | null | undefined): string {
  if (!mode) return MODE_SELECT_ROUTE;
  return mode === 'team_builder' ? TEAM_BUILDER_HOME_ROUTE : PERSONAL_HOME_ROUTE;
}

// Shown on the "More" tab and at the bottom of the drawer.
export const MORE_MENU_ITEMS: NavItem[] = [
  { label: `Switch to ${TEAM_BUILDER_LABEL}`, icon: 'git-network-outline', route: MODE_SELECT_ROUTE },
  { label: 'Income', icon: 'trending-up-outline', route: '/(tabs)/incomes' },
  { label: 'Remember', icon: 'bookmark-outline', route: '/remember' },
  { label: LEDGER_LABEL, icon: 'swap-horizontal-outline', route: '/ledger' },
  { label: 'Contacts', icon: 'people-outline', route: '/contacts' },
  { label: 'Notifications', icon: 'notifications-outline', route: '/notifications' },
  { label: 'Profile', icon: 'person-outline', route: '/(tabs)/profile' },
  { label: 'Help & Tips', icon: 'help-circle-outline', route: '/help' },
  { label: 'Support JodTod', icon: 'heart-outline', route: '/support' },
];

export const TEAM_MORE_MENU_ITEMS: NavItem[] = [
  { label: 'Switch to Personal', icon: 'wallet-outline', route: MODE_SELECT_ROUTE },
  { label: 'Contacts', icon: 'people-outline', route: '/contacts' },
  { label: 'Notifications', icon: 'notifications-outline', route: '/notifications' },
  { label: 'Profile', icon: 'person-outline', route: '/(tabs)/profile' },
  { label: 'Help & Tips', icon: 'help-circle-outline', route: '/help' },
  { label: 'Support JodTod', icon: 'heart-outline', route: '/support' },
];

export const DRAWER_MENU_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'home-outline', route: '/(tabs)' },
  { label: 'Expenses', icon: 'wallet-outline', route: '/(tabs)/expenses' },
  { label: 'My Tasks', icon: 'checkbox-outline', route: '/todos' },
  { label: 'Groups', icon: 'people-circle-outline', route: '/(tabs)/groups' },
  ...MORE_MENU_ITEMS,
];

// Tab routes in app/(tabs) that are opened from More instead of having their own tab button.
export const HIDDEN_TAB_SCREENS = [
  { screen: 'incomes', title: 'Income' },
  { screen: 'profile', title: 'Profile' },
];

export const BOTTOM_TABS: BottomTab[] = [
  { screen: 'index', label: 'Home', route: '/(tabs)', icon: 'home-outline', activeIcon: 'home' },
  { screen: 'expenses', label: 'Expenses', route: '/(tabs)/expenses', icon: 'wallet-outline', activeIcon: 'wallet' },
  { screen: 'groups', label: 'Groups', route: '/(tabs)/groups', icon: 'people-outline', activeIcon: 'people' },
  { screen: 'todos', label: 'Tasks', route: '/(tabs)/todos', icon: 'checkbox-outline', activeIcon: 'checkbox' },
  {
    screen: 'more', label: 'More', route: '/(tabs)/more', icon: 'grid-outline', activeIcon: 'grid',
    alsoActiveOn: MORE_MENU_ITEMS.map((item) => item.route),
  },
];

export const TEAM_BOTTOM_TABS: BottomTab[] = [
  { screen: 'index', label: 'Dashboard', route: '/team-builder', icon: 'speedometer-outline', activeIcon: 'speedometer' },
  {
    screen: 'prospects', label: 'Prospects', route: '/team-builder/prospects', icon: 'person-add-outline', activeIcon: 'person-add',
    alsoActiveOn: ['/tb-prospect-detail', '/tb-prospect-form'],
  },
  { screen: 'follow-ups', label: 'Follow-ups', route: '/team-builder/follow-ups', icon: 'alarm-outline', activeIcon: 'alarm' },
  {
    screen: 'team', label: 'Team', route: '/team-builder/team', icon: 'git-network-outline', activeIcon: 'git-network',
    alsoActiveOn: ['/tb-team-detail'],
  },
  {
    screen: 'more', label: 'More', route: '/team-builder/more', icon: 'grid-outline', activeIcon: 'grid',
    alsoActiveOn: TEAM_MORE_MENU_ITEMS.map((item) => item.route),
  },
];

export function bottomTabsFor(mode: AppMode | null | undefined): BottomTab[] {
  return mode === 'team_builder' ? TEAM_BOTTOM_TABS : BOTTOM_TABS;
}

// usePathname() drops route groups, so "/(tabs)/more" is reported as "/more".
const toPathname = (route: string) => route.replace('/(tabs)', '') || '/';

export function isTabActive(tab: BottomTab, pathname: string): boolean {
  return [tab.route, ...(tab.alsoActiveOn ?? [])].some((route) => {
    const path = toPathname(route);
    if (path === '/') return pathname === '/';
    if (path === TEAM_BUILDER_HOME_ROUTE) return pathname === path;
    return pathname === path || pathname.startsWith(path + '/') || pathname.startsWith(path + '-');
  });
}
