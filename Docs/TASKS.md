# JodTod - Mobile App Task Tracker

**Task Movement Rules**

- When a task is completed, move it to the Completed section.
- Mark completed tasks with `[X]`.
- Add completion date in `DD-MM-YYYY` format.
- Keep completed tasks in descending task number order.
- Example: `- [X] Task title (21-05-2026)`
- If a task is completed from Current Tasks, add a new empty task with the next number in Current Tasks.
- If you're asked to check a screenshot for any task, look for it in the following directory:
  D:\Development\Projects\JodTodApp\Docs\Screenshots

## Pending Tasks

### Active

- [] **Task 1508**
  Task #1507 completly done hai recheck karo or btao. kyunki beech me he limit khatam ho gai thi?

  option to login with google on mobile.

- [] **Task 1512**

- [] **Task 1513**

### Testing / Bug Fixes

- [] **Task 1200**
  1. Add login/continue with googl option in mobile app as well. (already implemented on webapp) — not started; needs Google Cloud OAuth client IDs (Android/iOS/Web) and a backend `/api/v1/auth/google` endpoint before implementation can start. Same feature as Task 1508/M-110. Please share the OAuth client credentials (or confirm the Google Cloud project to use) so this can proceed.
  2. [x] Logo not showing in yopmail. fine in gmail. (17-09-2026) — root cause: the verification/notification email template embedded `logo.webp`, and WebP image support is inconsistent across email clients (Gmail renders it, Yopmail's viewer does not). Switched `resources/views/emails/notifications/default.blade.php` to the existing `logo.png` asset, which all email clients support.
  3. [x] Fixed logout on the Verify Your Email screen. Added Change Email, with both actions clearing authentication state before redirecting. (03-08-2026)
  4. Resend verification email showing "unauthenticated". — investigated but not reproduced: the mobile Resend button posts through the same authenticated `api` client used elsewhere in the app, the token is written to SecureStore before the auth store flips to authenticated, and there's no shared Sanctum/session middleware that would explain a failure isolated to this one endpoint. Need a repro (does it happen right after registering, or after the app has been backgrounded/reopened? does "I've Verified My Email" also fail at the same time?) or a fresh screenshot in `Docs/Screenshots/` to pin down the exact trigger.

  Implement the following tasks. Keep changes minimal and limited to the specified behavior. Reuse existing patterns/components where possible.

### Roadmap (legacy phase plan)

> Original phase-by-phase build plan. Phases 3–11 are fully shipped (see Completed → Roadmap below). A full checkbox audit against the actual code ran on 18-09-2026 (previously several of these were wrongly assumed done or wrongly assumed pending — see Task 18's note about M-205/M-206). Remaining gaps: **M-110 (Google OAuth)** (tracked as Task 1508/1200), **M-203's currency/language selection** (view-only today), and **M-207 (change password)**, none of which have mobile UI yet.

### Phase 1: Project Setup & Auth (API: Partially Done)

> Auth API controllers already exist (AuthController, OtpController). Need React Native screens.

- [x] **M-101** - React Native + Expo project setup (folder structure, navigation, theme, dark mode support)
- [x] **M-102** - API client setup (Axios instance, base URL, token interceptor, 401 auto-logout, refresh handling)
- [x] **M-103** - Secure token storage (expo-secure-store for Sanctum tokens)
- [x] **M-104** - Login screen (email/password) - API: POST /api/v1/login (DONE)
- [x] **M-105** - OTP Login screen (phone input → OTP verify, tab on Login screen) - API: POST /api/v1/otp/send, /api/v1/otp/verify (DONE)
- [x] **M-106** - Registration screen - API: POST /api/v1/register (DONE)
- [x] **M-107** - Forgot Password screen - API: POST /api/v1/forgot-password (DONE)
- [x] **M-108** - Email verification screen/flow - API: POST /api/v1/email/verification-notification (DONE)
- [x] **M-109** - Auth navigation flow (splash → auth check → login/home)
- [ ] **M-110** - Google OAuth login (Expo AuthSession / expo-google-sign-in) - API: Need endpoint. Blocked on Google Cloud OAuth client credentials — see Task 1508/1200.

### Phase 2: Dashboard & Profile

> Dashboard and Profile controllers already have wantsJson() support (dual-purpose).

- [x] **M-201** - Bottom tab navigation (Home, Expenses, Groups, Notifications, Profile)
- [x] **M-202** - Dashboard/Home screen - API: GET /api/v1/dashboard
  - Summary cards (Expenses, Income, Savings, You Owe, Owed to You)
  - Income vs Expense bar chart (6 months)
  - Groups overview with balance badges
  - Pending settlements alert
  - Recent activity feed
  - Tasks widget (pending/overdue count)
  - Quick action buttons (Add Expense, Group Expense)
- [ ] **M-203** - Profile screen - API: GET /api/v1/user (DONE)
  - [x] View profile info (name, email, phone, avatar)
  - [ ] Currency & language selection — currency is shown read-only, language isn't shown at all; neither is changeable yet
  - [x] Notification preferences (email/push shown as On/Off status; no in-app toggle to change them)
- [x] **M-204** - Edit profile (name only, email/phone are verified fields) - API: PATCH /api/v1/profile (DONE)
- [x] **M-205** - Avatar upload with crop (17-09-2026) — see Task 18 in Completed
- [x] **M-206** - Phone verification (OTP flow) (17-09-2026) — see Task 18 in Completed
- [ ] **M-207** - Change password - backend `PUT /api/v1/password` exists; no mobile UI yet
- [x] **M-208** - Delete account - API: DELETE /api/v1/profile (DONE)
- [x] **M-209** - Logout - API: POST /api/v1/logout (DONE)

### Release

- [ ] Manual testing of all features
- [ ] Android build (EAS Build)
- [ ] iOS build (EAS Build)
- [ ] App store submission

## Completed

### Roadmap (legacy phase plan) — Phases 3–11

### Phase 3: Personal Expenses

> API Controller: DONE

- [x] **M-301** - **[API]** Create ExpenseController with: index (paginated + filters), store, show, update, destroy (2026-03-19)
- [x] **M-302** - **[API]** Expense description autocomplete endpoint (2026-03-19)
- [x] **M-303** - **[API]** Categories list endpoint (GET /api/v1/categories) (2026-03-19)
- [x] **M-304** - Expense list screen (paginated, pull-to-refresh) (2026-03-19)
- [x] **M-305** - Expense filters (category dropdown, search) (2026-03-19)
- [x] **M-306** - Add expense screen (amount, category, description with autocomplete, date picker) (2026-03-19)
- [x] **M-307** - Edit expense screen (same form, pre-filled) (2026-03-19)
- [x] **M-308** - Delete expense (long press → confirm) (2026-03-19)
- [x] **M-309** - Image upload for expense (2 max, camera + gallery, preview, remove) (2026-03-19)
- [x] **M-310** - Expense summary/charts (category breakdown pie chart, monthly trends) (2026-03-23)

### Phase 4: Income Tracking

> API Controller: DONE

- [x] **M-401** - **[API]** Create IncomeController with: index (paginated), store, update, destroy, summary (2026-03-19)
- [x] **M-402** - **[API]** Income source autocomplete endpoint (2026-03-19)
- [x] **M-403** - Income list screen (paginated, search, pull-to-refresh) (2026-03-19)
- [x] **M-404** - Add/Edit income (amount, source with autocomplete, description, date) (2026-03-19)
- [x] **M-405** - Delete income (long press → confirm) (2026-03-19)
- [x] **M-406** - Income summary cards (this month income, savings/loss) (2026-03-19)
- [x] **M-407** - Income vs Expense chart (6-month trend) (2026-03-23)

### Phase 5: Todos/Tasks

> API Controller: DONE

- [x] **M-501** - **[API]** Create TodoController with: index (filters + stats), store, update, destroy, toggle (2026-03-19)
- [x] **M-502** - **[API]** Create TodoCategoryController with: index, store, update, destroy (2026-03-19)
- [x] **M-503** - Todo list screen (filters: All, Pending, Completed, Assigned to me/by me, priority, category) (2026-03-19)
- [x] **M-504** - Add/Edit todo (title, priority, due date, category, assign to contact, reminder) (2026-03-19)
- [x] **M-505** - Toggle complete (tap checkbox, strikethrough) (2026-03-19)
- [x] **M-506** - Delete todo (long press → confirm) (2026-03-19)
- [x] **M-507** - Todo categories management screen (CRUD with 10 preset color circles) (2026-03-19)
- [x] **M-508** - Reminder notifications (local push notifications using expo-notifications) — shipped via Task 1203 (task reminders schedule/cancel local notifications)
- [x] **M-509** - Overdue visual indicators (red date highlight) (2026-03-19)

### Phase 6: Contacts

> API Controller: DONE

- [x] **M-601** - **[API]** Create ContactController with: index, search, store, destroy (2026-03-19)
- [x] **M-602** - Contacts list screen (search, paginated, pull-to-refresh, FAB to add) (2026-03-19)
- [x] **M-603** - Search & add JodTod users screen (debounced search, add button per result) (2026-03-19)
- [x] **M-604** - Remove contact (long press → confirm) (2026-03-19)

### Phase 7: Group Management

> API Controller: DONE

- [x] **M-701** - **[API]** Create GroupController with: index, store, show, update, destroy, join, leave, addMember, removeMember, reactivateMember (2026-03-19)
- [x] **M-702** - Groups list screen (my groups with member count, balance badge, FAB, join button) (2026-03-19)
- [x] **M-703** - Create group screen (name, description) (2026-03-19)
- [x] **M-704** - Group detail screen (members, expenses preview, balances, invite code, admin actions) (2026-03-19)
- [x] **M-705** - Join group (invite code input) (2026-03-19)
- [x] **M-706** - Edit group (admin only) (2026-03-19)
- [x] **M-707** - Add member from contacts (admin only) (2026-03-19)
- [x] **M-708** - Remove/Deactivate member (admin only, correct labels) (2026-03-19)
- [x] **M-709** - Reactivate member (admin only) (2026-03-19)
- [x] **M-710** - Leave group (deactivate if unsettled) (2026-03-19)
- [x] **M-711** - Delete group (blocked if unsettled) (2026-03-19)
- [x] **M-712** - Invite code copy (expo-clipboard) (2026-03-19)

### Phase 8: Group Expenses

> API Controller: DONE

- [x] **M-801** - **[API]** Create GroupExpenseController with: index, store, show, update, destroy, balances (2026-03-19)
- [x] **M-802** - Group expense list screen (paginated, category filter, search, FAB) (2026-03-19)
- [x] **M-803** - Add group expense (amount, category, description, date, paid by, split types: equal/custom/percentage with validation) (2026-03-19)
- [x] **M-804** - Edit group expense (pre-filled with existing splits) (2026-03-19)
- [x] **M-805** - Delete group expense (long press → confirm) (2026-03-19)
- [x] **M-806** - Member-wise balance display on group detail (2026-03-19)

### Phase 9: Settlements

> API Controller: DONE

- [x] **M-901** - **[API]** Create SettlementController with: index, settle, markCompleted, settleAll (exact min-transfers algorithm) (2026-03-19)
- [x] **M-902** - Settlement screen (balance cards, suggested transactions, history) (2026-03-19)
- [x] **M-903** - Settle Up button (admin only, disabled if pending exist, confirm) (2026-03-19)
- [x] **M-904** - Mark as Paid button (from_user/to_user/admin) (2026-03-19)
- [x] **M-905** - Settle All button (admin only, confirm) (2026-03-19)

### Phase 10: Notifications

> API Controller: DONE

- [x] **M-1001** - **[API]** Create NotificationController with: index, recent (10 + unread count), markRead, markAllRead (2026-03-19)
- [x] **M-1002** - Notifications list screen (paginated, pull-to-refresh, type-based icons) (2026-03-19)
- [x] **M-1003** - Mark as read (tap) / Mark all as read button (2026-03-19)
- [x] **M-1004** - Unread count badge on dashboard bell icon (2026-03-19)
- [x] **M-1005** - Push notifications setup (expo-notifications, device token registration) (2026-03-23)
- [x] **M-1006** - **[API]** Device token storage endpoint (POST /api/v1/device-token) (2026-03-23)
- [x] **M-1007** - Notification tap → deep link to relevant screen (group, settlement, todo etc.) (2026-03-20)

### Phase 11: Polish & UX

- [x] **M-1101** - Dark mode support (system preference + manual toggle, persist in AsyncStorage) (2026-03-23)
- [x] **M-1102** - Pull-to-refresh on all list screens (2026-03-23)
- [x] **M-1103** - Empty states with helpful messages on all screens (2026-03-23)
- [x] **M-1104** - Loading skeletons/spinners (2026-03-23)
- [x] **M-1105** - Confirm dialogs for all destructive actions (delete, leave, ban etc.) (2026-03-23)
- [x] **M-1106** - Toast/snackbar for success/error messages (use API response messages, never hardcode) (2026-03-23)
- [x] **M-1107** - Offline indicator banner (2026-03-23)
- [x] **M-1108** - Deep linking setup (expo-linking: /join/{code}, notification taps) (2026-03-23)
- [x] **M-1109** - App icon + splash screen (JodTod branding) (2026-03-23)
- [x] **M-1110** - Currency formatting (INR with ₹ symbol, Indian number format) (2026-03-23)

### Numbered Tasks

- [x] **Task 1207 — Top space** (21-08-2026)
  1. Login, Register, and Forgot Password now use one safe-area-aware auth form container that keeps logo and header content below the status bar while the keyboard is visible.
  2. Android keyboard layout is configured to resize the content area instead of panning the full screen upward.
  3. Register now scrolls Confirm Password above the keyboard when the field is focused.

- [x] **Task 1206 — Screen State Reset** (17-09-2026)
  1. Expenses already reset filters and search on every focus; audited and left unchanged.
  2. Income screen now clears search text/query and reloads unfiltered data every time it gains focus (previously it kept the last search across visits).
  3. Profile screen now resets edit mode, the name field, field errors, and the delete-account panel/password every time it gains focus (previously it had no reset logic at all).

- [x] **Task 1205 — Contacts** (21-08-2026)
  1. Moved the contact-search processing indicator into the input field so results no longer shift while searching.
  2. Contact search now uses a minimum three-character name query and exposes only name and avatar; email and phone remain private until approval.
  3. Adding a contact now sends a request. The recipient can approve or decline it from Contact Requests, and only approved contacts appear in the group Add Member flow.

- [x] **Task 1204 — Group** (21-08-2026)
  1. Members, Member Shares, and Expenses now reset collapsed on every Group screen visit.
  2. Added Cancel to Group Edit and header actions for Add Member and Add Expense.
  3. Category and form taps now persist while the keyboard is open across all form scroll views.
  4. Group Expense edit/update flow is available from the group detail preview and expense list. Edit and delete controls remain visible to all members, but only the Group Admin can use them; other members see an admin-only alert.
  5. Settlement navigation now requires a confirmation alert.

- [x] **Task 1203 — Todos** (19-08-2026)

      1. Tasks now reset their filters, search, and dropdown state and reload unfiltered data on every visit.
      2. Home and Market are server-created default categories, shown in task forms and protected from deletion.
      3. Task reminders now schedule local notifications on create/update and cancel when a task is completed.
      4. Newly created categories refresh and auto-select when returning to Add Task.
      5. Added an edit chevron to every task and visible Edit/Delete controls to Task Categories.
      6. Status, Priority, and Category selectors now use inline Expenses-style dropdown panels instead of popups.
      7. The Manage Categories action is visibly highlighted.

- [x] **Task 1202 — Expenses** (15-08-2026)
      A. Reset Category to All Categories, cleared search text, and closed the category picker every time the Expenses screen receives focus before loading the unfiltered list.
      B. Added date-and-time selection to personal expense add and edit forms. New timestamps are sent in local date-time format, while existing date-only records are normalized to midnight when edited.
      C. Verified that the existing Laravel expenses migration and Expense model already persist `expense_date` as a datetime value.
- [x] **Task 1201 — Home** (14-08-2026)
      A. Removed the native Home title and retained safe-area spacing for the custom dashboard header, so it stays below the status bar and scrolls with Home content.
      B. Added recent income entries to the mobile activity feed, merged chronologically with dashboard activities and rendered with a distinct positive treatment.
      C. Changed dashboard section defaults so only Summary is expanded; pending payments, tasks, groups, category breakdown, and recent activity start collapsed.

- [x] **Task 1511 — Floating task filters** (19-08-2026)
  1. Status, Priority, and Category task filters now open as floating overlays.
  2. The dropdown no longer shifts the task list and uses a native top-level overlay for reliable Android layering.

- [x] **Task 1510 — Task category dropdown** (19-08-2026)
  1. Replaced the category chip list with a reusable dropdown on Add and Edit Task.
  2. Dropdown options overlay the form and show the category color before its name.
  3. Darkened the Manage Categories button.

- [x] **Task 1509 — Tasks list filters and indicators** (19-08-2026)
  1. Filter options now expand above the task list instead of being covered by task cards.
  2. Tasks with a configured reminder show a bell icon in their metadata.
  3. Incomplete overdue tasks have a light red card treatment and an Overdue badge.

- [x] **Task 1507** (27-07-2026)
      A. Standardized Income search with a stable header, explicit Search button, clear action, and cancellable requests.
      B. Added backend-wired search to both Tasks listing entry points. The existing Todo API `search` parameter filters task titles and now receives the submitted query.
      C. Audited the remaining search screens and aligned Group Expenses with the same submit, clear, keyboard, and stale-request behavior. Contact add-user search remains intentionally real-time with its existing debounce.
      D. Added the reusable `ListSearchBar` component for consistent search controls.

- [x] **Task 1506** (27-07-2026)
      A. Reviewed `Docs/Screenshots/4.jpeg` and traced the income edit failure to the missing `GET /api/v1/incomes/{income}` Laravel route.
      B. Added the authenticated income show endpoint and ownership authorization so the mobile edit form can load its record before updating it.

- [x] **Task 1505** (27-07-2026)
      A. Fixed the shared collapsible section implementation that could leave dashboard content at zero height after toggling My Tasks.
      B. Dashboard sections now conditionally render their content instead of relying on a hidden duplicate measurer and animated fixed height, so Expenses remain visible after collapse, expand, and refresh.

- [x] **Task 1504** (27-07-2026)
      A. Fixed Contacts search input focus loss by replacing the inline FlatList header with a stable component.
      B. Added a visible Search button and kept the contact list mounted while a search runs.
      C. Added cancellable Contacts requests so a new search, clear action, or unmount cancels the preceding request and prevents stale responses from changing the list state.

- [x] **Task 1503** (25-07-2026)
      A. Fixed the Expenses search input focus loss. The inline FlatList header was recreated on every text state update, which remounted the TextInput and dismissed the keyboard. The header is now a stable component.
      B. Added a visible Search icon button that performs the same action as the keyboard search key.
      C. Added cancellable expense requests with AbortController. Starting a new search, clearing the search, changing the category, or leaving the screen cancels the previous request and prevents stale responses from changing state.
      D. Clearing restores the unfiltered list immediately without replacing the screen with a blocking loader.

- [x] **Task 1502** (21-07-2026)
      A. Reviewed `Docs/Screenshots/1.jpeg` and identified two separate native notification issues: an invalid custom `default` sound setting and an uninitialized Firebase Android application.
      B. Removed the custom sound setting from the Android notification channel so the system default sound is used.
      C. Confirmed the Firebase package name matches `com.jodtod.app`, then ran `npx expo prebuild --platform android` to synchronize native configuration. The generated Android project now includes the Google Services Gradle plugin and `android/app/google-services.json`.
      D. Documented the required fresh-build and device retest procedure. A previous APK must be replaced with a new build after the native configuration change.

- [x] **Task 1501** (21-07-2026)
      A. Root cause identified: Expo SDK 53+ does not support Android remote push notifications in Expo Go. The fallback log was expected and did not indicate a missing package.
      B. Verified Expo 55-compatible `expo-notifications`, `expo-device`, and `expo-constants` dependencies, the notification config plugin, and the configured EAS project ID.
      C. Updated push setup to provide an accurate Expo Go message, create the Android channel before requesting permission, and resolve the EAS project ID in both development and production builds.
      D. Added the preview development-build, Android FCM V1 credential, token-registration, and delivery-verification procedure to the troubleshooting guide.

- [x] **Task 1500** (20-07-2026)
      A. Updated active Node.js from 20.18.0 (unsupported by Expo tooling) to 24.18.0. `expo-doctor` now passes all 19 checks.
      B. Verified compatible Expo SDK 55.0.28, React 19.2.0, React Native 0.83.6, Expo Router 55.0.17, and Expo Notifications 55.0.25 dependencies.
      C. Configured `ANDROID_HOME`, `ANDROID_SDK_ROOT`, and user PATH for Android SDK platform-tools 37.0.0 / ADB 1.0.41. The connected phone is detected as a USB composite device, but is not exposed as an authorized ADB device; USB debugging and the OEM ADB driver must be enabled on the phone/Windows before Expo Go can use USB.

- [x] **Task 1205A** (18-09-2026)
  1. Added `ContactRequestReceived` notification (database + Expo push, matching the existing `GroupJoinRequest` pattern) dispatched from both the API and web `ContactController::store()`, so the recipient of a contact request gets a push notification and an in-app notification. Notification tap and the in-app notifications list now deep-link to Contact Requests.
  2. Removed the phone number from the mobile Contacts list, contact-add search results, and Contact Requests screen (email is shown instead); the web Contacts page never showed phone in the approved-contacts list either way, and its search results no longer request phone/email either.
  3. Added a `friend_code` column to `users` (backend `JodTod` repo) — a random 3-letter + 3-digit code (e.g. `KRM459`) generated on user creation. `User::performInsert()` retries generation on a unique-constraint collision, so uniqueness holds even under concurrent registrations; existing users were backfilled by the migration. The code is now returned by contact search/list/request API responses and shown next to the name on both mobile (Contacts, Add Contact, Contact Requests) and web (Contacts, new Contact Requests page).
  4. Rebuilt the web `ContactController` and `Contacts/Index.vue` to match the mobile app's request → approve/decline flow (it previously added contacts directly with no approval step), and added a new `Contacts/Requests.vue` page with `contacts.requests` / `contacts.approve` / `contacts.reject` routes.

- [x] **Task 18 — Profile** (17-09-2026)
  A. Photo upload: added camera/gallery picker (1:1 crop, base64 upload to the existing `POST /profile/avatar` endpoint), a "Change Photo" link below the avatar, and a red X button on the avatar to remove it via `DELETE /profile/avatar`. This closes M-205, which — despite being logged as done under old Task 15/16 — had no actual mobile UI.
  B. Phone number add/update: added an inline "Add/Change Phone Number" panel on the Profile screen (enter 10-digit number → Send OTP → enter 6-digit code → Verify, dev OTP shown when the API returns one) plus a Remove action, wired to the existing `/profile/phone/send-otp`, `/profile/phone/verify`, and `/profile/phone` endpoints. This closes M-206, which had the same gap as M-205.

- [x] **Task 17** (2026-03-23)
      A. Group expense edit: Split section wrapped in CollapsibleSection (defaultOpen=false) matching add page. Title "Split Between" with branch icon, same as add page.
      B. Notifications dark mode: Unread notification background changed from hardcoded #f0f0ff to dark-aware color (#1e1b4b in dark, #f0f0ff in light). Unread items now clearly visible in dark mode.
- [x] **Task 16** (2026-03-23)
      A. Password error message fixed - backend now returns "Current password is incorrect" instead of generic message.
      B. Eye icon toggle added to all 3 password fields (current/new/confirm) for show/hide password.
      C. Avatar: photo not tappable anymore. "Change Photo" is a separate link below. Red cross button (X) on top-right corner of avatar for remove.
      D. Notification section: removed "Coming soon" from Push Notifications, now shows On/Off status. Added note about production build requirement.
- [x] **Task 15** (2026-03-23)
      A. Avatar upload - tap profile photo to pick from gallery (1:1 crop), base64 upload to API, remove option. Backend routes added for POST/DELETE /profile/avatar.
      B. Change Password - expandable section with current/new/confirm fields. Backend PasswordController updated with wantsJson() support for API.
      C. Phone Verification - OTP flow: enter 10-digit number → Send OTP → enter 6-digit code → Verify. Debug OTP shown in dev. Remove phone option. Backend routes added for phone send-otp/verify/remove.
- [x] **Task 14** (2026-03-23)
      A. CollapsibleSection rewritten - replaced flaky animated height measurement with LayoutAnimation + simple show/hide. Dashboard tasks section no longer disappears on collapse/expand.
      B. Ownership badges on todo items: blue "To me" badge (arrow-down) for tasks assigned to current user by others, amber "By me" badge (arrow-up) for tasks assigned by current user to others. Applied to both tab and standalone todo screens.
      C. Category filter now includes categories from assigned tasks too. Backend API updated to merge user's own categories with categories from tasks assigned to user by others.
- [x] **Task 13** (2026-03-23)
      A. Dark mode implemented - Zustand themeStore with 3 modes (Light/Dark/System), AsyncStorage persistence, system preference detection. useColors() hook added to all 43 files. Toggle on Profile page + DrawerMenu.
      B. Category breakdown pie chart added to Expenses screen (react-native-chart-kit PieChart, top 6 categories). Charts wrapped in CollapsibleSection, default closed for simpler UX.
      C. Income vs Expense 6-month bar chart added to Income screen (BarChart with green/red, legend, ₹ labels). Also collapsible, default closed.
      D. Offline indicator banner - amber "No Internet" banner slides in/out using NetInfo listener.
      E. Deep linking - jodtod://join/{code} opens Join Group screen with code pre-filled. intentFilters added to app.json for Android.
      F. App icon + splash screen already configured. Updated userInterfaceStyle to "automatic" for dark mode support.
      G. Phase 11 Polish tasks (M-1102 to M-1110) all verified/completed - pull-to-refresh, empty states, loading spinners, confirm dialogs, toasts, currency formatting were already implemented.
- [x] **Task 12** Push notification log silenced - removed console.log for expected Expo Go limitation. (2026-03-23)
- [x] **Task 11** Push notification log silenced (same as 12, was duplicate entry). (2026-03-23)
- [x] **Task 10** (2026-03-21)
      A. Reminder field now uses DatePickerField with datetime mode (date picker → time picker flow). No more manual typing.
      B. Clear filter button styled as red pill button with close icon (was plain text).
      C. Created reusable BottomNav component - added to ALL 16 sub-pages (contacts, todos, groups, settlements, notifications). Footer nav now visible everywhere.
      D. DatePickerField updated: chevron-down → calendar icon. Added maxDate to expense/income pickers (no future dates). Reminder/due date allow future dates.
      E. My contacts also has footer nav (included in the 16 pages).
- [x] **Task 9** Todo category form keyboard closing bug fixed. Root cause: TextInput was inside FlatList's ListHeaderComponent - typing triggered re-render which unmounted/remounted the TextInput, dismissing keyboard. Fix: moved form outside FlatList as a separate View. (2026-03-21)
- [x] **Task 8** (2026-03-21)
      A. Income tab restored as 6th footer icon (was hidden).
      B. Groups/Profile headings fixed - show "Groups"/"Profile" instead of "Index".
      C. Sub-page footer nav hiding is standard mobile UX (Instagram/WhatsApp behavior) - kept as is.
      D. Web 507/508 changes applied: stats summary bar on group detail, Member Shares purple section (all-time), "Settlement" button text, "All Settled" badge with tick on groups list, Member Shares hidden after settled on settlement page, isAllSettled flag added to API.
      E. CollapsibleSection component rewritten with smooth animated height transition (no more jerky LayoutAnimation).
- [x] **Task 7C** Smart 4-step settle flow implemented on both mobile and web: (1) "Settle Up" when unsettled expenses exist, (2) "Mark All as Paid" when pending settlements exist, (3) "All Settled!" green message when everything is done. Button auto-changes based on state. (2026-03-20)
- [x] **Task 7** (A) Standardized image upload to 1 image across both personal and group expense add. Personal expense reduced from 2 to 1. Group expense add now supports image upload via FormData. (B) Group delete now checks unsettled expenses upfront - shows "Cannot Delete" message directly in confirm dialog instead of making API call first. ConfirmDialog updated to support single-button mode. (2026-03-20)
- [x] **Task 6** "Add Expense" button moved out of Recent Expenses collapsible section. Now in a row with "Settle Up" button - both always visible regardless of section collapse state. (2026-03-20)
- [x] **Task 5** (2026-03-20)
      A. Calendar date picker added to ALL date fields (expenses, incomes, todos, group expenses - both add and edit). Uses @react-native-community/datetimepicker with native calendar UI.
      B. Group expense "Split Between" section now collapsible, default closed. Users expand when needed.
      C. All listing sections made collapsible with reusable CollapsibleSection component. Applied to Dashboard (6 sections), Group Detail (3 sections), Settlements (3 sections). Animated arrow, clickable headers, defaultOpen=true. Component supports custom colors/icons.
      D. Member Shares section added to settlements screen (was missing from mobile). Shows total unsettled amount + each member's share in compact list format (not cards). API updated with calculateMemberShares method.
- [x] **Task 4** Group photo upload added to both Create Group and Edit Group screens. Photo shows in group list and group detail. Backend supports upload/change/remove on both web and API. (2026-03-20)
- [x] **Task 3** Added header with hamburger menu (left) + user avatar (right) on dashboard. Hamburger drawer has all web navigation links. Footer nav: replaced Income tab with Tasks tab. Income accessible from drawer menu. (2026-03-20)
- [x] **Task 2** Group join by invite code now requires admin approval. Join creates pending request, admin gets notification, can approve/reject from group detail. Implemented on both web and mobile. (2026-03-20)
- [x] **Task 1** Notification tap now navigates to relevant screen: todo notifications → tasks, group expense → group expenses, settlement → settlements, group → group detail. (2026-03-20)
