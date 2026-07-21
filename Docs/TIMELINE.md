# JodTod Mobile App - Development Timeline

---

## Overview

**Total Estimated Duration: 6-8 weeks** (for a single developer, working full-time)

This assumes:
- Developer is new to React Native / Expo but knows JavaScript
- Learning + building simultaneously
- Backend API routes need to be created alongside mobile development

---

## Phase 0: Environment Setup & Learning (3-5 days)

| Task | Duration | Description |
|------|----------|-------------|
| Install development tools | 0.5 day | Node.js, Android Studio, Expo, VS Code extensions |
| React Native basics | 1-2 days | Core concepts, components, styling, navigation |
| Expo tutorial | 0.5 day | Expo Router, build system, EAS |
| Create project scaffold | 0.5 day | Initialize project, folder structure, install dependencies |
| NativeWind setup | 0.5 day | Configure Tailwind for React Native |

**Deliverable**: Empty project with navigation structure, theme, and base components running on device/emulator.

---

## Phase 1: Authentication (4-5 days)

| Task | Duration | Description |
|------|----------|-------------|
| Backend: Sanctum API setup | 0.5 day | Install Sanctum, create API auth routes |
| Backend: API auth controllers | 1 day | Login, register, forgot password, Google OAuth endpoints |
| Mobile: Auth screens UI | 1 day | Login, register, forgot password screens |
| Mobile: Auth logic | 1 day | API integration, token storage, auth state management |
| Mobile: Google OAuth | 0.5-1 day | expo-auth-session with Google |
| Testing & fixes | 0.5 day | End-to-end auth flow testing |

**Deliverable**: Working login/register flow. User can sign in and reach the dashboard shell.

---

## Phase 2: Dashboard & Core UI (3-4 days)

| Task | Duration | Description |
|------|----------|-------------|
| Backend: Dashboard API endpoint | 0.5 day | Summary data endpoint |
| Mobile: Bottom tab navigation | 0.5 day | 5 tabs with icons |
| Mobile: Dashboard screen | 1 day | Summary cards, quick actions, recent activity |
| Mobile: Base components | 1 day | Button, Input, Card, Modal, EmptyState, LoadingSpinner |
| Mobile: Charts | 0.5 day | Pie chart + bar chart components |

**Deliverable**: Dashboard with real data, tab navigation working, base component library ready.

---

## Phase 3: Personal Expenses (4-5 days)

| Task | Duration | Description |
|------|----------|-------------|
| Backend: Expense API endpoints | 1 day | CRUD + filters + summary endpoints |
| Mobile: Expense list screen | 1 day | List with filters, search, sort, pagination |
| Mobile: Add/Edit expense form | 1 day | ExpenseForm component with validation |
| Mobile: Category picker | 0.5 day | Grid category selector |
| Mobile: Swipe-to-delete | 0.5 day | Gesture handler for delete action |
| Testing & fixes | 0.5 day | CRUD flow testing |

**Deliverable**: Full personal expense tracking. Add, edit, delete, filter, search expenses.

---

## Phase 4: Groups (5-6 days)

| Task | Duration | Description |
|------|----------|-------------|
| Backend: Group API endpoints | 1 day | CRUD + invite + join + leave + members |
| Mobile: Groups list screen | 0.5 day | Group cards with balance |
| Mobile: Create group screen | 0.5 day | Form + creation flow |
| Mobile: Join group screen | 0.5 day | Invite code input + link handling |
| Mobile: Group detail screen | 1 day | Header, member list, tab sections |
| Mobile: Group expenses | 1 day | List + add with split options |
| Mobile: Split selector | 1 day | Equal / Custom / Percentage UI |
| Testing & fixes | 0.5 day | Group flow testing |

**Deliverable**: Full group management. Create, join, add group expenses with splits.

---

## Phase 5: Settlements & Balances (3-4 days)

| Task | Duration | Description |
|------|----------|-------------|
| Backend: Settlement API endpoints | 1 day | Calculate, settle, history endpoints |
| Mobile: Balances tab in group | 0.5 day | Member balance cards |
| Mobile: Settlement screen | 1 day | Settlement plan display, settle actions |
| Mobile: Settlement history | 0.5 day | Past settlements list |
| Testing & fixes | 0.5 day | Settlement calculation testing |

**Deliverable**: Working settlement system. View balances, settle up, see history.

---

## Phase 6: Incomes & Profile (2-3 days)

| Task | Duration | Description |
|------|----------|-------------|
| Backend: Income API endpoints | 0.5 day | CRUD endpoints |
| Mobile: Income list + form | 1 day | Income tracking screens |
| Mobile: Profile screens | 1 day | View, edit profile, change password |
| Mobile: App settings | 0.5 day | Currency, theme, notification toggles |

**Deliverable**: Income tracking and profile management complete.

---

## Phase 7: Notifications & Polish (3-4 days)

| Task | Duration | Description |
|------|----------|-------------|
| Backend: Push notification setup | 1 day | Expo push service integration |
| Mobile: Push notification handling | 1 day | Permission, token registration, handlers |
| Mobile: Notification list screen | 0.5 day | In-app notification center |
| Mobile: Offline support | 0.5 day | TanStack Query persistence, offline banner |
| Mobile: Deep linking | 0.5 day | URL scheme + universal links |
| Bug fixes & polish | 0.5 day | UI polish, edge cases |

**Deliverable**: Push notifications working. App handles offline gracefully.

---

## Phase 8: Testing & App Store (3-5 days)

| Task | Duration | Description |
|------|----------|-------------|
| End-to-end testing | 1 day | Test all flows on Android + iOS |
| Performance optimization | 0.5 day | List rendering, image optimization |
| App icon + splash screen | 0.5 day | Design and configure |
| EAS Build setup | 0.5 day | Configure build profiles |
| Google Play Store submission | 1 day | Screenshots, description, build, submit |
| Apple App Store submission | 1 day | Screenshots, description, build, submit, review |
| Fix review feedback | 0.5-1 day | Address any store review issues |

**Deliverable**: App live on both stores.

---

## Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|-----------|
| Phase 0: Setup & Learning | 3-5 days | Week 1 |
| Phase 1: Authentication | 4-5 days | Week 1-2 |
| Phase 2: Dashboard & Core UI | 3-4 days | Week 2-3 |
| Phase 3: Personal Expenses | 4-5 days | Week 3-4 |
| Phase 4: Groups | 5-6 days | Week 4-5 |
| Phase 5: Settlements | 3-4 days | Week 5-6 |
| Phase 6: Incomes & Profile | 2-3 days | Week 6 |
| Phase 7: Notifications & Polish | 3-4 days | Week 6-7 |
| Phase 8: Testing & Store | 3-5 days | Week 7-8 |
| **Total** | **30-41 days** | **6-8 weeks** |

---

## Parallel Development Strategy

Since backend API routes and mobile screens can be developed in parallel:

```
Week 1-2:  [Backend: Auth API + Sanctum] ──parallel── [Mobile: Setup + Auth UI]
Week 2-3:  [Backend: Expense + Dashboard API] ──parallel── [Mobile: Dashboard + Base UI]
Week 3-4:  [Backend: Group API] ──parallel── [Mobile: Expense screens]
Week 4-5:  [Backend: Settlement API] ──parallel── [Mobile: Group screens]
Week 5-6:  [Backend: Notifications] ──parallel── [Mobile: Settlements + Income]
Week 6-7:  [Backend: Polish] ──parallel── [Mobile: Notifications + Polish]
Week 7-8:  [Testing + Store submission]
```

---

## Shortcuts to Ship Faster

1. **Skip Google OAuth initially** - Email/password first, add Google later
2. **Skip offline support initially** - Add after core features work
3. **Skip push notifications initially** - Focus on in-app experience first
4. **Use EAS Build from day 1** - Don't waste time on local build setup
5. **Test on physical device** - More reliable than emulators, faster iteration

With these shortcuts, **MVP can be ready in 4-5 weeks**.

---

## Post-Launch Roadmap

| Feature | Priority |
|---------|----------|
| Biometric login (fingerprint/face) | High |
| Dark mode | High |
| Widget (Android) for quick expense add | Medium |
| Export expenses to PDF/CSV | Medium |
| Receipt photo attachment | Medium |
| Recurring expenses | Low |
| Multi-currency support | Low |
| Budget alerts | Low |
