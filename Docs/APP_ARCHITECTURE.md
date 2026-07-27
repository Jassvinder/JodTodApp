# JodTod Mobile App - Architecture & Project Structure

---

## Project Structure (Expo Router file-based routing)

```
JodTodApp/
├── app/                          # Screens (file-based routing)
│   ├── _layout.tsx               # Root layout (providers, fonts, splash)
│   ├── index.tsx                 # Entry point → redirects to auth or dashboard
│   │
│   ├── (auth)/                   # Auth group (no bottom tabs)
│   │   ├── _layout.tsx           # Auth layout (centered, no nav)
│   │   ├── login.tsx             # Login screen
│   │   ├── register.tsx          # Register screen
│   │   ├── forgot-password.tsx   # Forgot password screen
│   │   └── reset-password.tsx    # Reset password screen
│   │
│   ├── (tabs)/                   # Main app (bottom tab navigation)
│   │   ├── _layout.tsx           # Tab layout (defines bottom tabs)
│   │   ├── index.tsx             # Dashboard (Home tab)
│   │   ├── expenses/
│   │   │   ├── _layout.tsx       # Expenses stack layout
│   │   │   ├── index.tsx         # Expense list
│   │   │   └── [id].tsx          # Expense detail / edit
│   │   ├── groups/
│   │   │   ├── _layout.tsx       # Groups stack layout
│   │   │   ├── index.tsx         # Groups list
│   │   │   ├── [id]/
│   │   │   │   ├── index.tsx     # Group detail
│   │   │   │   ├── expenses.tsx  # Group expenses
│   │   │   │   ├── settlements.tsx # Group settlements
│   │   │   │   └── settings.tsx  # Group settings
│   │   │   ├── create.tsx        # Create new group
│   │   │   └── join.tsx          # Join group via code
│   │   ├── incomes/
│   │   │   ├── _layout.tsx       # Incomes stack layout
│   │   │   ├── index.tsx         # Income list
│   │   │   └── [id].tsx          # Income detail / edit
│   │   └── profile/
│   │       ├── _layout.tsx       # Profile stack layout
│   │       ├── index.tsx         # Profile overview
│   │       ├── edit.tsx          # Edit profile
│   │       ├── settings.tsx      # App settings
│   │       └── notifications.tsx # Notification settings
│   │
│   └── modals/                   # Modal screens
│       ├── add-expense.tsx       # Add expense modal
│       ├── add-income.tsx        # Add income modal
│       └── confirm.tsx           # Confirmation dialog
│
├── components/                   # Reusable UI components
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ConfirmDialog.tsx
│   ├── expenses/                 # Expense-specific components
│   │   ├── ExpenseForm.tsx       # Reused for personal + group expenses
│   │   ├── ExpenseCard.tsx
│   │   ├── ExpenseFilters.tsx
│   │   └── CategoryPicker.tsx
│   ├── groups/                   # Group-specific components
│   │   ├── GroupCard.tsx
│   │   ├── MemberAvatar.tsx
│   │   ├── SplitSelector.tsx
│   │   └── BalanceBadge.tsx
│   └── charts/                   # Chart components
│       ├── PieChart.tsx
│       └── BarChart.tsx
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hook
│   ├── useExpenses.ts            # Expense CRUD with TanStack Query
│   ├── useGroups.ts              # Group CRUD with TanStack Query
│   ├── useIncomes.ts             # Income CRUD with TanStack Query
│   ├── useSettlements.ts         # Settlement operations
│   └── useNotifications.ts       # Push notification setup
│
├── services/                     # API & external services
│   ├── api.ts                    # Axios instance with interceptors
│   ├── auth.ts                   # Auth API calls (login, register, etc.)
│   ├── expenses.ts               # Expense API calls
│   ├── groups.ts                 # Group API calls
│   ├── incomes.ts                # Income API calls
│   ├── settlements.ts            # Settlement API calls
│   └── notifications.ts          # Notification API calls
│
├── stores/                       # Zustand stores
│   ├── authStore.ts              # Auth state (user, token, isLoggedIn)
│   └── appStore.ts               # App preferences (theme, currency)
│
├── types/                        # TypeScript type definitions
│   ├── api.ts                    # API response types
│   ├── models.ts                 # Data model types (User, Expense, Group, etc.)
│   ├── navigation.ts             # Route parameter types
│   └── forms.ts                  # Form data types + Zod schemas
│
├── utils/                        # Utility functions
│   ├── formatCurrency.ts         # Currency formatting
│   ├── formatDate.ts             # Date formatting
│   ├── storage.ts                # SecureStore / AsyncStorage wrappers
│   └── validation.ts             # Zod validation schemas
│
├── constants/                    # App constants
│   ├── colors.ts                 # Theme colors
│   ├── categories.ts             # Expense categories
│   └── config.ts                 # API base URL, app config
│
├── assets/                       # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── app.json                      # Expo app configuration
├── eas.json                      # EAS Build configuration
├── tailwind.config.js            # NativeWind Tailwind config
├── tsconfig.json                 # TypeScript config
├── package.json
└── .env                          # Environment variables (API_URL, etc.)
```

---

## State Management Architecture

```
┌─────────────────────────────────────────────────┐
│                   App State                      │
├─────────────────┬───────────────────────────────┤
│  Client State   │       Server State            │
│  (Zustand)      │       (TanStack Query)        │
├─────────────────┼───────────────────────────────┤
│  - Auth token   │  - Expenses list              │
│  - User info    │  - Groups list                │
│  - Theme        │  - Group members              │
│  - Currency     │  - Settlements                │
│  - App prefs    │  - Balances                   │
│                 │  - Notifications              │
│                 │  - Dashboard summary           │
│                 │  - Incomes                     │
└─────────────────┴───────────────────────────────┘
```

### Why separate Client vs Server state?
- **Client state** (Zustand): Rarely changes, originates on the device, no API sync needed
- **Server state** (TanStack Query): Changes frequently, lives on the server, needs caching/sync/refetch

---

## Navigation Architecture

```
Root Layout (_layout.tsx)
  │
  ├── (auth) - Stack Navigator (unauthenticated)
  │     ├── login
  │     ├── register
  │     ├── forgot-password
  │     └── reset-password
  │
  └── (tabs) - Bottom Tab Navigator (authenticated)
        ├── Home (Dashboard)           [🏠 icon]
        ├── Expenses                   [💰 icon]
        │     ├── Expense List
        │     └── Expense Detail [id]
        ├── Groups                     [👥 icon]
        │     ├── Groups List
        │     ├── Create Group
        │     ├── Join Group
        │     └── Group Detail [id]
        │           ├── Expenses
        │           ├── Settlements
        │           └── Settings
        ├── Incomes                    [📈 icon]
        │     ├── Income List
        │     └── Income Detail [id]
        └── Profile                    [👤 icon]
              ├── Profile Overview
              ├── Edit Profile
              ├── App Settings
              └── Notification Settings
```

### Bottom Tab Configuration
| Tab | Icon | Screen |
|-----|------|--------|
| Home | House | Dashboard with summary |
| Expenses | Wallet | Personal expense list |
| Groups | Users | Group list |
| Incomes | TrendingUp | Income list |
| Profile | User | Profile & settings |

---

## API Layer Architecture

```
Screen (Component)
    │
    ▼
Custom Hook (useExpenses, useGroups, etc.)
    │
    ▼
TanStack Query (caching, background refresh, optimistic updates)
    │
    ▼
Service Layer (services/expenses.ts, services/groups.ts)
    │
    ▼
Axios Instance (services/api.ts)
    │  - Base URL from .env
    │  - Auth token injection (interceptor)
    │  - Error handling (401 → logout)
    │  - Request/Response logging (dev)
    ▼
Laravel Backend API (/api/v1/*)
```

---

## Offline Strategy

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Online     │────▶│  TanStack    │────▶│   Screen     │
│   API Call   │     │  Query Cache │     │   Renders    │
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                     (Cache persists)
                           │
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Offline    │────▶│  Read from   │────▶│   Screen     │
│   (No API)   │     │  Cache       │     │   Shows      │
└──────────────┘     └──────────────┘     │   Cached Data│
                                          └──────────────┘
```

- **Read operations**: Serve from cache when offline
- **Write operations**: Queue mutations, sync when online (TanStack Query mutation retry)
- **Conflict resolution**: Server wins (last-write-wins for simplicity)

---

## Component Reusability (Mirrors Web App)

| Mobile Component | Web Component | Shared Purpose |
|-----------------|---------------|----------------|
| `ExpenseForm.tsx` | `ExpenseForm.vue` | Add/edit expense (personal + group) |
| `ExpenseCard.tsx` | `ExpenseCard.vue` | Single expense display |
| `ExpenseFilters.tsx` | `ExpenseFilters.vue` | Date, category, search filters |
| `GroupCard.tsx` | `GroupCard.vue` | Group list item |
| `SplitSelector.tsx` | `SplitSelector.vue` | Equal/Custom/Percentage split |
| `BalanceBadge.tsx` | `BalanceBadge.vue` | +/- balance indicator |
| `PieChart.tsx` | `PieChart.vue` | Category breakdown chart |
| `BarChart.tsx` | `BarChart.vue` | Monthly trend chart |
| `Modal.tsx` | `Modal.vue` | Reusable modal wrapper |

**Same design language, same component responsibility — just different rendering targets.**

---

## Security Considerations

1. **Token storage**: JWT stored in `expo-secure-store` (encrypted, not AsyncStorage)
2. **Biometric lock**: Optional app lock with fingerprint/face ID
3. **Certificate pinning**: Pin SSL certificate for production API
4. **No sensitive data in logs**: Strip tokens from error logs
5. **Auto-logout**: After 30 min inactivity or token expiry
6. **Secure API**: All requests over HTTPS, no HTTP fallback
