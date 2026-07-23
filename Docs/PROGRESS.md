# JodTod Mobile App - Development Progress

## Project Info

- **Code:** `D:\Development\Projects\JodTodApp`
- **GitHub:** https://github.com/Jassvinder/JodTodApp
- **Docs:** `D:\Development\Projects\JodTodApp\Docs\`
- **Web Backend (API):** `D:\Development\Projects\JodTod` (Laravel - same DB, shared API)

## Environment Audit (20-07-2026)

- Active Node.js updated to `24.18.0`; the previous `20.18.0` version is unsupported by current Expo tooling (minimum `20.19.4`).
- `npx expo-doctor` passes all 19 checks for Expo SDK `55.0.28`, React `19.2.0`, and React Native `0.83.6`.
- Android SDK platform-tools `37.0.0` and ADB `1.0.41` are installed, with `ANDROID_HOME`, `ANDROID_SDK_ROOT`, and user PATH configured. The USB-connected phone has no authorized ADB interface, so Expo Go USB testing remains blocked until USB debugging is enabled and the correct OEM ADB driver is installed.

## Push Notification Audit (21-07-2026)

- Remote push notifications cannot be tested in Android Expo Go on Expo SDK 53 or later. Use the existing EAS `preview` development-build profile instead.
- The app has Expo SDK 55-compatible notification dependencies, the `expo-notifications` config plugin, and an EAS project ID. Push registration now creates the Android notification channel before requesting permission and reads the project ID from either Expo or EAS runtime config.
- Before the first Android development build, configure Firebase Cloud Messaging V1 credentials in EAS and set `expo.android.googleServicesFile` to the downloaded `google-services.json` file. The Firebase service-account JSON is secret and must not be committed.

## Android Firebase Native Sync (21-07-2026)
- Investigated the `Default FirebaseApp is not initialized` error from the Task 1502 development-build test. The Firebase file and `app.json` path were present, but the existing Android native project had not been regenerated with them.
- Ran `npx expo prebuild --platform android`. The Android project now applies `com.google.gms.google-services` and includes `android/app/google-services.json`, allowing Firebase to initialize in the next fresh build.
- Removed the channel-level `sound: 'default'` configuration because Expo interpreted it as a missing custom sound. The platform default notification sound is now used.

## Todo Categories API Contract Fix (23-07-2026)
- Aligned Todo category handling with the backend schema field `todo_category_id`. The mobile create and edit screens now send this field, and the Todo model type reads it when pre-filling edits.
- The backend categories endpoint now queries `todos.todo_category_id`, fixing the Manage Categories SQL error and allowing newly created categories to load in the Add Task screen.

## Tech Stack

- React Native 0.83 + Expo 55 (expo-router for file-based routing)
- TypeScript
- NativeWind (Tailwind CSS for React Native)
- Zustand (state management)
- Axios (API client)
- expo-secure-store (token storage)
- @tanstack/react-query (installed, not yet used)
- Ionicons (icons)

---

## What's Built (as of 2026-03-19)

### Project Setup

- Expo project initialized with TypeScript
- NativeWind configured (tailwind.config.js, global.css)
- File-based routing via expo-router
- Constants: colors.ts (theme colors), config.ts (API_URL)
- .env for API_URL (gitignored)

### API Client (`services/api.ts`)

- Axios instance with baseURL from config
- Request interceptor: auto-attaches Bearer token from SecureStore
- Response interceptor: clears token on 401 (auto-logout)
- 15s timeout, JSON headers

### Auth System

**Store:** `stores/authStore.ts` (Zustand)

- State: user, token, isLoading, isAuthenticated
- Actions: login, register, loginWithOtp, logout, loadToken, setUser
- Token persisted in expo-secure-store

**Service:** `services/auth.ts`

- login, register, logout, getUser, sendOtp, verifyOtp, forgotPassword, resetPassword

**Screens:**

- `app/(auth)/login.tsx` - Email/Password + OTP login (tabbed UI, full validation, dev OTP debug display)
- `app/(auth)/register.tsx` - Name, email, password, confirm password
- `app/(auth)/forgot-password.tsx` - Email input → success message
- `app/(auth)/verify-email.tsx` - Resend verification email

**Navigation:**

- `app/_layout.tsx` - Root layout, checks auth state, routes to (auth) or (tabs)
- `app/index.tsx` - Splash/loading screen while checking token
- `app/(auth)/_layout.tsx` - Auth stack layout

### Dashboard (`app/(tabs)/index.tsx`)

**Service:** `services/dashboard.ts` - getData() calls GET /dashboard

**UI Sections:**

- Welcome header with user name
- Summary cards (Expenses, Income, Savings/Loss, You Owe, Owed to You)
- Pending settlements alert (amber banner with payment details)
- Todo stats widget (pending/overdue count)
- Groups overview (list with balance per group)
- Category breakdown (progress bars with percentages)
- Recent activity feed (personal/group expenses + settlements)
- Pull-to-refresh

### Profile (`app/(tabs)/profile/index.tsx`)

**Service:** `services/profile.ts` - getProfile, updateProfile, deleteAccount

**UI Sections:**

- Avatar display (image or initials)
- Email verified/unverified badge
- Profile info card (name, email, phone, currency) with Edit mode
- Edit: inline form for name + email (saves via API)
- Notification preferences (email/push toggles - display only for now)
- Logout button
- Delete account (password confirmation flow)

### Tab Navigation (`app/(tabs)/_layout.tsx`)

5 tabs configured:

1. **Home** (dashboard) - home-outline icon
2. **Expenses** - wallet-outline icon (placeholder)
3. **Groups** - people-outline icon (placeholder)
4. **Incomes** - trending-up-outline icon (placeholder)
5. **Profile** - person-outline icon

### Placeholder Screens (Coming Soon)

- `app/(tabs)/expenses/index.tsx` - "Coming soon" with icon
- `app/(tabs)/groups/index.tsx` - "Coming soon" with icon
- `app/(tabs)/incomes/index.tsx` - "Coming soon" with icon

### Utilities

- `utils/format.ts` - formatCurrency (INR), formatRelativeDate, percentChange
- `utils/device.ts` - getDeviceName (for Sanctum token naming)

### Types

- `types/models.ts` - User, LoginPayload, RegisterPayload
- `types/api.ts` - ApiResponse<T>, PaginatedResponse<T>
- `types/dashboard.ts` - DashboardData with all sub-types

---

## What's NOT Built Yet

### Backend API Controllers (in Laravel `D:\Development\Projects\JodTod`)

These need to be created under `app/Http/Controllers/Api/V1/`:

- ExpenseController (personal expenses CRUD + filters)
- IncomeController (income CRUD + summary)
- TodoController + TodoCategoryController (todos CRUD + categories)
- ContactController (contacts search + CRUD)
- GroupController (groups CRUD + members + invite)
- GroupExpenseController (group expenses + splits)
- SettlementController (settle up + mark paid + history)
- NotificationController (list + mark read + unread count)
- CategoryController (categories list)

**Note:** DashboardController and ProfileController already have `wantsJson()` support (dual-purpose).

### Mobile Screens

- Personal Expenses (list, add, edit, delete, filters, images, charts)
- Income (list, add, edit, delete, summary, charts)
- Todos (list, add, edit, delete, categories, reminders, assignment)
- Contacts (list, search, add, remove)
- Groups (list, create, detail, members, invite, join, leave)
- Group Expenses (list, add with splits, edit, delete)
- Settlements (balances, suggestions, settle up, mark paid, history)
- Notifications (list, mark read, badge)

### Features

- Dark mode toggle
- Push notifications (expo-notifications)
- Deep linking (/join/{code})
- Offline indicator
- Image upload (camera + gallery)
- Google OAuth
- Phone verification

---

## File Structure

```
D:\Development\Projects\JodTodApp\
├── app/
│   ├── _layout.tsx              # Root layout (auth check)
│   ├── index.tsx                # Splash screen
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth stack
│   │   ├── login.tsx            # Email + OTP login
│   │   ├── register.tsx         # Registration
│   │   ├── forgot-password.tsx  # Password reset
│   │   └── verify-email.tsx     # Email verification
│   └── (tabs)/
│       ├── _layout.tsx          # Tab navigator (5 tabs)
│       ├── index.tsx            # Dashboard/Home
│       ├── expenses/
│       │   ├── _layout.tsx
│       │   └── index.tsx        # Placeholder
│       ├── groups/
│       │   ├── _layout.tsx
│       │   └── index.tsx        # Placeholder
│       ├── incomes/
│       │   ├── _layout.tsx
│       │   └── index.tsx        # Placeholder
│       └── profile/
│           ├── _layout.tsx
│           └── index.tsx        # Profile screen
├── services/
│   ├── api.ts                   # Axios instance + interceptors
│   ├── auth.ts                  # Auth API calls
│   ├── dashboard.ts             # Dashboard API
│   └── profile.ts               # Profile API
├── stores/
│   └── authStore.ts             # Zustand auth state
├── types/
│   ├── models.ts                # User, payloads
│   ├── api.ts                   # ApiResponse types
│   └── dashboard.ts             # Dashboard data types
├── utils/
│   ├── format.ts                # Currency, dates, percentage
│   └── device.ts                # Device name helper
├── constants/
│   ├── colors.ts                # Theme colors
│   └── config.ts                # API_URL
├── assets/images/
│   └── logo.png                 # App logo
├── package.json
├── app.json                     # Expo config
├── tsconfig.json
├── tailwind.config.js
└── global.css
```
