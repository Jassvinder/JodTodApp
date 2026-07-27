# JodTod Mobile App - Offline Support & Data Sync

---

## Overview

The app works **offline-first** — user can add expenses, incomes, and view cached data even without internet. When the connection is restored, all offline data automatically syncs with the server.

```
┌─────────────────────────────────────────────────────────┐
│                    USER ACTIONS                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌──────────┐    ┌──────────────┐    ┌──────────────┐ │
│   │  ONLINE  │───▶│  API Call     │───▶│ Server DB    │ │
│   │          │    │  (immediate)  │    │ (MySQL)      │ │
│   └──────────┘    └──────────────┘    └──────────────┘ │
│                                                         │
│   ┌──────────┐    ┌──────────────┐    ┌──────────────┐ │
│   │  OFFLINE │───▶│  Save to     │───▶│ Local Queue  │ │
│   │          │    │  Local Store  │    │ (SQLite/     │ │
│   └──────────┘    └──────────────┘    │  AsyncStorage)│ │
│                                        └──────┬───────┘ │
│                                               │         │
│   ┌──────────┐    ┌──────────────┐           │         │
│   │  BACK    │───▶│  Sync Engine │◀──────────┘         │
│   │  ONLINE  │    │  (auto-push) │                     │
│   └──────────┘    └──────┬───────┘                     │
│                          │                              │
│                          ▼                              │
│                   ┌──────────────┐                      │
│                   │ Server DB    │                      │
│                   │ (merged)     │                      │
│                   └──────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack for Offline

| Technology | Purpose |
|------------|---------|
| **TanStack Query v5** | Server state caching + mutation queue + retry logic |
| **@tanstack/query-async-storage-persister** | Persist query cache to device storage |
| **expo-sqlite** | Local database for offline mutation queue |
| **@react-native-community/netinfo** | Detect online/offline status in real-time |
| **AsyncStorage** | Simple key-value storage for app preferences |

---

## How It Works — Step by Step

### 1. Reading Data (GET requests)

```
User opens Expense List
        │
        ▼
TanStack Query checks cache
        │
        ├── Cache exists + fresh → Show cached data (instant)
        │
        ├── Cache exists + stale → Show cached data + fetch fresh in background
        │       │
        │       ▼
        │   API call succeeds → Update cache silently
        │   API call fails (offline) → Keep showing cached data
        │
        └── No cache + offline → Show "No data available offline" message
```

**Key point**: User always sees data instantly from cache. Fresh data loads in background.

#### Cache Configuration

```typescript
// hooks/useExpenses.ts
import { useQuery } from '@tanstack/react-query';
import { getExpenses } from '../services/expenses';

export function useExpenses(filters) {
    return useQuery({
        queryKey: ['expenses', filters],
        queryFn: () => getExpenses(filters),
        staleTime: 5 * 60 * 1000,     // Data considered fresh for 5 minutes
        gcTime: 24 * 60 * 60 * 1000,  // Keep in cache for 24 hours
        retry: 3,                       // Retry failed requests 3 times
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    });
}
```

#### Persisting Cache to Device Storage

```typescript
// app/_layout.tsx (root layout)
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 24 * 60 * 60 * 1000, // 24 hours
            staleTime: 5 * 60 * 1000,     // 5 minutes
        },
    },
});

const persister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: 'jodtod-query-cache',
});

// Wrap app with PersistQueryClientProvider
<PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }}
>
    <App />
</PersistQueryClientProvider>
```

**What this does**: When app closes, the entire query cache (expenses, groups, dashboard data) is saved to device storage. When app reopens, cached data loads instantly — even before any API call.

---

### 2. Writing Data (POST/PUT/DELETE — The Core Offline Feature)

This is the main feature — **user adds an expense offline, and it syncs automatically when back online**.

```
User adds expense (offline)
        │
        ▼
Save to local mutation queue (SQLite)
        │
        ▼
Show in UI immediately (optimistic update)
        │
        ▼
Mark with "pending sync" indicator (🔄 icon)
        │
        ▼
[... time passes, user goes online ...]
        │
        ▼
NetInfo detects internet restored
        │
        ▼
Sync Engine processes mutation queue (FIFO order)
        │
        ├── Each mutation: POST/PUT/DELETE to API
        │       │
        │       ├── Success → Remove from queue, update cache with server response
        │       │               (server assigns real ID, timestamps)
        │       │
        │       └── Fail (validation error) → Mark as failed, notify user
        │
        ▼
All synced → Remove "pending sync" indicators
Show "Data synced" toast notification
```

#### Mutation Queue Implementation

```typescript
// services/offlineQueue.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('jodtod_offline.db');

// Initialize queue table
export function initOfflineQueue() {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS mutation_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            method TEXT NOT NULL,
            payload TEXT NOT NULL,
            temp_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            retry_count INTEGER DEFAULT 0,
            error TEXT
        )
    `);
}

// Add mutation to queue
export function queueMutation(mutation: {
    type: string;        // 'expense' | 'income' | 'group_expense'
    endpoint: string;    // '/expenses'
    method: string;      // 'POST' | 'PUT' | 'DELETE'
    payload: object;     // Request body
    tempId: string;      // Temporary local ID (UUID)
}) {
    db.runSync(
        `INSERT INTO mutation_queue (type, endpoint, method, payload, temp_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            mutation.type,
            mutation.endpoint,
            mutation.method,
            JSON.stringify(mutation.payload),
            mutation.tempId,
            new Date().toISOString(),
        ]
    );
}

// Get all pending mutations (FIFO order)
export function getPendingMutations() {
    return db.getAllSync(
        `SELECT * FROM mutation_queue WHERE status = 'pending' ORDER BY id ASC`
    );
}

// Mark mutation as completed
export function completeMutation(id: number) {
    db.runSync(`DELETE FROM mutation_queue WHERE id = ?`, [id]);
}

// Mark mutation as failed
export function failMutation(id: number, error: string) {
    db.runSync(
        `UPDATE mutation_queue SET status = 'failed', error = ? WHERE id = ?`,
        [error, id]
    );
}
```

#### Optimistic Updates (Show data instantly in UI)

```typescript
// hooks/useAddExpense.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import { createExpense } from '../services/expenses';
import { queueMutation } from '../services/offlineQueue';
import uuid from 'react-native-uuid';

export function useAddExpense() {
    const queryClient = useQueryClient();
    const netInfo = useNetInfo();

    return useMutation({
        mutationFn: async (newExpense) => {
            if (netInfo.isConnected) {
                // Online: send to server directly
                return await createExpense(newExpense);
            } else {
                // Offline: queue for later
                const tempId = uuid.v4();
                queueMutation({
                    type: 'expense',
                    endpoint: '/expenses',
                    method: 'POST',
                    payload: newExpense,
                    tempId,
                });
                // Return a local version with temp ID
                return {
                    ...newExpense,
                    id: tempId,
                    _isOffline: true,
                    created_at: new Date().toISOString(),
                };
            }
        },

        // Optimistic update: add to list BEFORE server confirms
        onMutate: async (newExpense) => {
            // Cancel ongoing refetches so they don't overwrite optimistic update
            await queryClient.cancelQueries({ queryKey: ['expenses'] });

            // Snapshot current data (for rollback if needed)
            const previousExpenses = queryClient.getQueryData(['expenses']);

            // Optimistically add to the list
            queryClient.setQueryData(['expenses'], (old) => {
                const tempExpense = {
                    ...newExpense,
                    id: `temp-${Date.now()}`,
                    _isOffline: true,
                };
                return old ? [tempExpense, ...old] : [tempExpense];
            });

            return { previousExpenses };
        },

        // If mutation fails, rollback to previous data
        onError: (err, newExpense, context) => {
            queryClient.setQueryData(['expenses'], context.previousExpenses);
        },

        // After success (online) or queue (offline), refetch to stay in sync
        onSettled: () => {
            if (netInfo.isConnected) {
                queryClient.invalidateQueries({ queryKey: ['expenses'] });
            }
        },
    });
}
```

---

### 3. Sync Engine (Auto-sync when back online)

```typescript
// services/syncEngine.ts
import NetInfo from '@react-native-community/netinfo';
import { getPendingMutations, completeMutation, failMutation } from './offlineQueue';
import api from './api';

let isSyncing = false;

export function startSyncEngine() {
    // Listen for connectivity changes
    NetInfo.addEventListener((state) => {
        if (state.isConnected && !isSyncing) {
            syncPendingMutations();
        }
    });
}

async function syncPendingMutations() {
    isSyncing = true;

    const mutations = getPendingMutations();

    if (mutations.length === 0) {
        isSyncing = false;
        return;
    }

    console.log(`Syncing ${mutations.length} offline mutations...`);

    for (const mutation of mutations) {
        try {
            const payload = JSON.parse(mutation.payload);

            // Execute the API call
            let response;
            switch (mutation.method) {
                case 'POST':
                    response = await api.post(mutation.endpoint, payload);
                    break;
                case 'PUT':
                    response = await api.put(mutation.endpoint, payload);
                    break;
                case 'DELETE':
                    response = await api.delete(mutation.endpoint);
                    break;
            }

            // Success: remove from queue
            completeMutation(mutation.id);

            console.log(`Synced: ${mutation.type} ${mutation.method} ${mutation.endpoint}`);

        } catch (error) {
            if (error.response?.status >= 400 && error.response?.status < 500) {
                // Client error (validation, 404, etc.) — don't retry
                failMutation(mutation.id, error.response?.data?.message || 'Validation error');
            } else {
                // Server error or network error — will retry next time
                console.log(`Sync failed for mutation ${mutation.id}, will retry`);
                break; // Stop processing queue, try again later
            }
        }
    }

    isSyncing = false;

    // Show notification to user
    const remaining = getPendingMutations();
    if (remaining.length === 0) {
        // All synced — show success toast
        showToast('All data synced successfully!');
    }
}
```

---

## What Works Offline vs What Doesn't

### Works Offline (Cached + Queued)

| Action | How |
|--------|-----|
| View expense list | Served from TanStack Query cache |
| View dashboard summary | Served from cache |
| View groups list | Served from cache |
| View group detail + expenses | Served from cache |
| View income list | Served from cache |
| **Add new expense** | **Queued in SQLite, optimistic UI update** |
| **Edit expense** | **Queued in SQLite, optimistic UI update** |
| **Delete expense** | **Queued in SQLite, optimistic UI update** |
| **Add new income** | **Queued in SQLite, optimistic UI update** |

### Does NOT Work Offline

| Action | Why |
|--------|-----|
| Login / Register | Auth requires server verification |
| Create / Join group | Needs server to generate invite code |
| Settle up | Settlement calculation needs server (multi-user) |
| Change password | Security-sensitive, requires server |
| Push notifications | Needs internet by definition |
| Invite members | Needs server to send invites |

---

## Conflict Resolution Strategy

### Problem: What if user edits an expense offline, but someone else also changes it?

### Solution: **Last-Write-Wins (LWW)**

```
User A (offline): Edits expense #42 amount to ₹500 at 10:05 AM
User B (online):  Edits expense #42 amount to ₹600 at 10:10 AM

User A comes online at 10:15 AM:
    │
    ▼
Sync engine sends: PUT /expenses/42 { amount: 500 }
    │
    ▼
Server receives at 10:15 AM → Overwrites with ₹500 (last write wins)
```

### Why LWW is acceptable for JodTod:
1. **Personal expenses**: Only one user edits them — no conflicts possible
2. **Group expenses**: Edits are rare and usually by the creator
3. **Settlements**: Not allowed offline — no conflict risk
4. **Simplicity**: Complex merge strategies (CRDTs, vector clocks) are overkill for an expense app

### Enhanced LWW with Timestamps (Future improvement):

```typescript
// Each mutation includes a client timestamp
{
    amount: 500,
    description: "Lunch",
    _client_updated_at: "2026-03-18T10:05:00Z"
}

// Server compares: if server's updated_at > client's _client_updated_at
// → Reject with 409 Conflict, ask user to resolve
```

---

## UI Indicators for Offline State

### 1. Global Offline Banner

```
┌─────────────────────────────────────────┐
│  ⚠️  You are offline. Changes will      │
│     sync when connection is restored.   │
└─────────────────────────────────────────┘
│                                         │
│  [Normal app content below]             │
```

### 2. Per-Item Sync Status

```
┌─────────────────────────────────────┐
│  🍔 Lunch at cafe                   │
│  ₹350 · Today                  🔄  │  ← Pending sync icon
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🚕 Uber ride                       │
│  ₹250 · Today                  ❌  │  ← Sync failed icon (tap to retry)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🛒 Groceries                       │
│  ₹1200 · Yesterday             ✅  │  ← Synced (normal, no icon needed)
└─────────────────────────────────────┘
```

### 3. Sync Status Component

```typescript
// components/ui/SyncStatus.tsx

interface SyncStatusProps {
    isOffline: boolean;      // from _isOffline flag
    isFailed: boolean;       // from failed mutation queue
    onRetry?: () => void;    // retry failed sync
}

// Shows:
// - Nothing if synced (normal state)
// - 🔄 spinning icon if pending sync
// - ❌ with "Tap to retry" if failed
```

### 4. Sync Progress on Reconnect

```
┌─────────────────────────────────────────┐
│  🔄 Syncing 3 items...  [████░░] 2/3   │
└─────────────────────────────────────────┘

// After completion:
┌─────────────────────────────────────────┐
│  ✅ All changes synced!                  │  ← Auto-dismisses after 3 seconds
└─────────────────────────────────────────┘
```

---

## Data Storage Summary

```
┌────────────────────────────────────────────────────────┐
│                    Device Storage                       │
├──────────────────┬─────────────────────────────────────┤
│                  │                                     │
│  expo-secure-    │  • JWT auth token                   │
│  store           │  • Sensitive credentials            │
│  (encrypted)     │                                     │
│                  │                                     │
├──────────────────┼─────────────────────────────────────┤
│                  │                                     │
│  AsyncStorage    │  • TanStack Query cache             │
│  (key-value)     │    (expenses, groups, dashboard)    │
│                  │  • App preferences (theme,          │
│                  │    currency, language)               │
│                  │                                     │
├──────────────────┼─────────────────────────────────────┤
│                  │                                     │
│  expo-sqlite     │  • Offline mutation queue           │
│  (database)      │    (pending POST/PUT/DELETE)        │
│                  │  • Structured, queryable            │
│                  │  • FIFO processing order            │
│                  │                                     │
└──────────────────┴─────────────────────────────────────┘
```

---

## Testing Offline Sync

### How to test during development:

1. **Android Emulator**: Settings → Network → Turn off WiFi + Mobile data
2. **iOS Simulator**: Use Network Link Conditioner (Xcode tools)
3. **Physical device**: Enable Airplane mode
4. **Expo Dev Menu**: No built-in network toggle, use device settings

### Test scenarios:

| # | Scenario | Expected Result |
|---|----------|----------------|
| 1 | Add expense offline → go online | Expense appears on server with correct data |
| 2 | Add 5 expenses offline → go online | All 5 sync in order (FIFO) |
| 3 | Edit expense offline → go online | Server reflects updated data |
| 4 | Delete expense offline → go online | Expense deleted from server |
| 5 | Add expense offline → close app → reopen → go online | Still syncs (queue persisted in SQLite) |
| 6 | Add expense with invalid data offline → go online | Sync fails, user notified, can fix and retry |
| 7 | Kill app mid-sync → reopen | Resumes sync from where it left off |
| 8 | Intermittent connection during sync | Pauses and resumes automatically |
