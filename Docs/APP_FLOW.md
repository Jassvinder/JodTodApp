# JodTod Mobile App - Screen Flow

---

## 1. App Launch Flow

```
[App Opens]
    │
    ▼
[Splash Screen] (app icon + loading)
    │
    ▼
[Check Auth Token in SecureStore]
    │
    ├── Token exists → [Validate token with API]
    │                       │
    │                       ├── Valid → [Dashboard]
    │                       └── Expired → [Login Screen]
    │
    └── No token → [Login Screen]
```

---

## 2. Authentication Flow

```
[Login Screen] (Tab-based: Email & Password | OTP Login)
    │
    ├── [Tab: Email + Password Login]
    │       │
    │       ▼
    │   [POST /api/v1/login]
    │       │
    │       ├── Success → Store token → [Dashboard]
    │       └── Fail → Show error message
    │
    ├── [Tab: OTP Login]
    │       │
    │       ├── Step 1: Enter phone → [POST /api/v1/otp/send]
    │       │       ├── Success → Show OTP input
    │       │       └── Fail → Show error (no account / not verified)
    │       │
    │       └── Step 2: Enter OTP → [POST /api/v1/otp/verify]
    │               ├── Success → Store token → [Dashboard]
    │               └── Fail → Show error (invalid/expired OTP)
    │               └── Resend OTP option
    │
    ├── [Google OAuth Login]
    │       │
    │       ▼
    │   [Open Google Sign-In WebView]
    │       │
    │       ▼
    │   [Callback with token] → Store token → [Dashboard]
    │
    ├── [Register] → Navigate to Register Screen
    │       │
    │       ▼
    │   [Name, Email, Password form]
    │       │
    │       ▼
    │   [POST /api/v1/register]
    │       │
    │       ▼
    │   [Email Verification Screen]
    │       │
    │       ▼
    │   [Verify Email] → [Dashboard]
    │
    └── [Forgot Password] → Navigate to Forgot Password Screen
            │
            ▼
        [Enter Email] → [POST /api/v1/forgot-password]
            │
            ▼
        [Check Email] → [Reset Password Screen]
            │
            ▼
        [New Password] → [POST /api/v1/reset-password]
            │
            ▼
        [Login Screen]
```

### Login Screen UI Elements
- App logo at top (same logo as web)
- Tab switcher: "Email & Password" | "OTP Login"
- **Email tab:** Email input, Password input (show/hide), "Forgot Password?" link, Login button
- **OTP tab:** Phone input with +91 prefix (Step 1), 6-digit OTP input with resend option (Step 2)
- "Continue with Google" button
- "Don't have an account? Register" link at bottom

> **IMPORTANT:** Mobile app features must mirror web app features. Any feature available on web should also be available on mobile.

### Register Screen UI Elements
- App logo at top
- Full name input
- Email input
- Password input (with strength indicator)
- Confirm password input
- "Create Account" button (primary)
- "Already have an account? Login" link at bottom

---

## 3. Dashboard (Home Tab)

```
[Dashboard Screen]
    │
    ├── [Header]
    │       - "Hello, {name}" greeting
    │       - Notification bell icon (with unread count badge)
    │
    ├── [Monthly Summary Card]
    │       - Total spent this month: ₹XX,XXX
    │       - Comparison with last month (+/- %)
    │       - Total income this month: ₹XX,XXX
    │
    ├── [Quick Actions Row]
    │       - [+ Expense] button
    │       - [+ Income] button
    │       - [+ Group] button
    │
    ├── [Group Balances Card]
    │       - "You owe overall: ₹X,XXX" (red)
    │       - "You are owed: ₹X,XXX" (green)
    │       - List of groups with individual balance
    │       - Tap group → Group Detail
    │
    ├── [Category Breakdown] (Pie Chart)
    │       - This month's spending by category
    │       - Tap category → filtered expense list
    │
    └── [Recent Activity]
            - Last 10 transactions (personal + group)
            - Each item: icon, description, amount, date
            - Tap item → Expense detail
```

---

## 4. Personal Expenses Tab

```
[Expenses Screen]
    │
    ├── [Filter Bar]
    │       - Date range selector (This Month / This Week / Custom)
    │       - Category filter dropdown
    │       - Search bar (by description)
    │       - Sort: Date / Amount
    │
    ├── [Expense List]
    │       - Grouped by date (Today, Yesterday, March 15, etc.)
    │       - Each item: category icon, description, amount, time
    │       - Swipe left → Delete (with confirm)
    │       - Tap → Edit expense
    │       - Pull to refresh
    │       - Infinite scroll pagination
    │
    ├── [Summary Bar] (sticky at top)
    │       - Total for current filter: ₹XX,XXX
    │
    └── [FAB] (+) Floating Action Button
            - Tap → Add Expense Modal
```

### Add/Edit Expense Modal
```
[Expense Form]
    │
    ├── Amount input (large, prominent, numeric keyboard)
    ├── Category picker (grid of category icons)
    ├── Description input (optional)
    ├── Date picker (default: today)
    │
    ├── [Save] button
    └── [Cancel] button
```

---

## 5. Groups Tab

```
[Groups Screen]
    │
    ├── [My Groups List]
    │       - Each group card:
    │           - Group name
    │           - Member count
    │           - Your balance (+/- amount, color coded)
    │           - Last activity date
    │       - Tap → Group Detail
    │       - Pull to refresh
    │
    ├── [+ Create Group] button
    │       │
    │       ▼
    │   [Create Group Screen]
    │       - Group name input
    │       - Description input (optional)
    │       - [Create] button
    │       - After creation → Group Detail with invite options
    │
    └── [Join Group] button
            │
            ▼
        [Join Group Screen]
            - Enter invite code (8 characters)
            - OR paste invite link
            - [Join] button
            - After join → Group Detail
```

---

## 6. Group Detail Flow

```
[Group Detail Screen]
    │
    ├── [Header]
    │       - Group name
    │       - Member avatars (scrollable row)
    │       - Total group spend
    │       - Settings gear icon (admin only)
    │
    ├── [Tab Bar] (within group detail)
    │       ├── [Expenses Tab]
    │       ├── [Balances Tab]
    │       └── [Settlements Tab]
    │
    ├── [Expenses Tab]
    │       - List of group expenses
    │       - Each: description, amount, paid by, date, split indicator
    │       - Filter by date/member/category
    │       - Tap → Expense detail with split breakdown
    │       - [+ Add Expense] FAB
    │
    ├── [Balances Tab]
    │       - Each member card:
    │           - Avatar + Name
    │           - Balance amount (green = owed, red = owes)
    │       - [Settle Up] button → Settlement screen
    │
    ├── [Settlements Tab]
    │       - Settlement history list
    │       - Each: "A paid B ₹X" with date and status
    │       - Pending settlements highlighted
    │       - Tap pending → Mark as completed
    │
    ├── [Invite Members] button
    │       - Share invite code (copy to clipboard)
    │       - Share invite link (system share sheet)
    │       - QR code for invite link
    │
    └── [Group Settings] (admin only)
            - Edit group name/description
            - Member list with remove option
            - Leave group
            - Delete group (with confirmation)
```

### Add Group Expense
```
[Group Expense Form]
    │
    ├── Description input (required)
    ├── Amount input (numeric keyboard)
    ├── Paid by (member selector, default: me)
    ├── Category picker
    ├── Date picker
    │
    ├── [Split Type Selector]
    │       ├── Equal (default)
    │       │     - Select/deselect members
    │       │     - Shows per-person amount
    │       │
    │       ├── Custom
    │       │     - Enter amount per member
    │       │     - Running total validation
    │       │     - "Remaining: ₹X" indicator
    │       │
    │       └── Percentage
    │             - Enter % per member
    │             - Running total validation
    │             - "Remaining: X%" indicator
    │
    ├── [Save] button
    └── [Cancel] button
```

---

## 7. Incomes Tab

```
[Incomes Screen]
    │
    ├── [Monthly Income Summary]
    │       - Total income this month
    │       - Comparison with last month
    │
    ├── [Income List]
    │       - Grouped by date
    │       - Each: source, description, amount, date
    │       - Swipe left → Delete
    │       - Tap → Edit
    │       - Pull to refresh
    │
    └── [FAB] (+) → Add Income Modal
            - Amount input
            - Source picker (Salary, Freelance, Business, Investment, Other)
            - Description (optional)
            - Date picker
            - [Save] button
```

---

## 8. Profile Tab

```
[Profile Screen]
    │
    ├── [Profile Header]
    │       - Avatar (tap to change photo)
    │       - Name
    │       - Email
    │       - Member since date
    │
    ├── [Menu Items]
    │       ├── Edit Profile → Edit screen
    │       ├── App Settings → Settings screen
    │       │       - Currency selector
    │       │       - Theme (Light/Dark/System)
    │       │       - Biometric lock toggle
    │       ├── Notifications → Notification settings
    │       │       - Push notification toggle
    │       │       - Email notification toggle
    │       │       - Per-event toggles
    │       ├── About App → App version, links
    │       └── Logout → Confirm → Clear token → Login screen
    │
    └── [Danger Zone]
            - Delete Account (with confirmation)
```

---

## 9. Notification Flow

```
[Push Notification Received]
    │
    ├── App in foreground → Show in-app banner
    │       - Tap → Navigate to relevant screen
    │
    └── App in background → System notification
            - Tap → Open app → Navigate to relevant screen

[Notification Types]
    ├── Expense added in group → Navigate to group expenses
    ├── Added to a group → Navigate to group detail
    ├── Settlement requested → Navigate to settlements
    ├── Settlement completed → Navigate to settlements
    └── Weekly summary → Navigate to dashboard
```

---

## 10. Offline Mode Flow

```
[No Internet Detected]
    │
    ▼
[Show "Offline" banner at top of screen]
    │
    ├── Read operations → Show cached data (last synced)
    │
    ├── Write operations → Queue locally
    │       - "Expense saved offline. Will sync when online."
    │       - Show pending sync indicator on queued items
    │
    └── [Internet Restored]
            │
            ▼
        [Auto-sync queued items]
            │
            ▼
        [Hide "Offline" banner]
        [Show "Synced" toast notification]
```

---

## 11. Deep Linking

| Link Pattern | Opens |
|-------------|-------|
| `jodtod://dashboard` | Dashboard |
| `jodtod://expenses` | Expense list |
| `jodtod://groups/{id}` | Group detail |
| `jodtod://join/{invite_code}` | Join group screen |
| `https://jodtod.com/join/{invite_code}` | Join group (universal link) |
