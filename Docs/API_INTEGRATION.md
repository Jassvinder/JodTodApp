# JodTod Mobile App - API Integration Guide

---

## Overview

The mobile app communicates with the same Laravel backend as the web app, but through dedicated JSON API endpoints instead of Inertia.js responses.

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Mobile App  │ ──────▶ │  Laravel API │ ──────▶ │    MySQL     │
│  (React      │  HTTPS  │  /api/v1/*   │         │   Database   │
│   Native)    │ ◀────── │  (JSON)      │ ◀────── │              │
└──────────────┘         └──────────────┘         └──────────────┘
```

---

## Authentication: Laravel Sanctum (API Tokens)

The web app uses session-based auth (Inertia). The mobile app uses **Laravel Sanctum API tokens** (stateless JWT-like tokens).

### How it works:

1. **Login**: Mobile sends email + password to `/api/v1/login`
2. **Server**: Creates a Sanctum personal access token
3. **Response**: Returns the token string
4. **Mobile**: Stores token in `expo-secure-store`
5. **Subsequent requests**: Send token in `Authorization: Bearer {token}` header

### Backend Setup Required

```php
// Install Sanctum (if not already)
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate

// In User model - add HasApiTokens trait
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}

// In config/sanctum.php - set token expiration
'expiration' => 60 * 24 * 30, // 30 days
```

---

## API Route Structure

All mobile API routes should be under `/api/v1/` prefix.

### routes/api.php

```php
Route::prefix('v1')->group(function () {

    // Public routes (no auth)
    Route::post('/register', [ApiAuthController::class, 'register']);
    Route::post('/login', [ApiAuthController::class, 'login']);
    Route::post('/forgot-password', [ApiAuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [ApiAuthController::class, 'resetPassword']);
    Route::post('/otp/send', [ApiOtpController::class, 'send']);
    Route::post('/otp/verify', [ApiOtpController::class, 'verify']);
    Route::post('/auth/google', [ApiAuthController::class, 'googleLogin']);

    // Protected routes (require auth token)
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::post('/logout', [ApiAuthController::class, 'logout']);
        Route::get('/user', [ApiAuthController::class, 'user']);

        // Dashboard
        Route::get('/dashboard', [ApiDashboardController::class, 'index']);

        // Personal Expenses
        Route::apiResource('/expenses', ApiExpenseController::class);
        Route::get('/expenses/summary', [ApiExpenseController::class, 'summary']);

        // Groups
        Route::apiResource('/groups', ApiGroupController::class);
        Route::post('/groups/{group}/invite', [ApiGroupController::class, 'refreshInvite']);
        Route::post('/groups/join', [ApiGroupController::class, 'join']);
        Route::post('/groups/{group}/leave', [ApiGroupController::class, 'leave']);
        Route::delete('/groups/{group}/members/{user}', [ApiGroupController::class, 'removeMember']);

        // Group Expenses
        Route::apiResource('/groups/{group}/expenses', ApiGroupExpenseController::class);
        Route::get('/groups/{group}/balances', [ApiGroupExpenseController::class, 'balances']);

        // Settlements
        Route::get('/groups/{group}/settlements', [ApiSettlementController::class, 'index']);
        Route::post('/groups/{group}/settle', [ApiSettlementController::class, 'calculate']);
        Route::put('/groups/{group}/settlements/{settlement}', [ApiSettlementController::class, 'markCompleted']);
        Route::post('/groups/{group}/settle-all', [ApiSettlementController::class, 'settleAll']);

        // Incomes
        Route::apiResource('/incomes', ApiIncomeController::class);

        // Todos
        Route::apiResource('/todos', ApiTodoController::class);

        // Profile
        Route::get('/profile', [ApiProfileController::class, 'show']);
        Route::put('/profile', [ApiProfileController::class, 'update']);
        Route::put('/profile/password', [ApiProfileController::class, 'updatePassword']);
        Route::delete('/profile', [ApiProfileController::class, 'destroy']);

        // Notifications
        Route::get('/notifications', [ApiNotificationController::class, 'index']);
        Route::put('/notifications/{id}/read', [ApiNotificationController::class, 'markRead']);
        Route::put('/notifications/read-all', [ApiNotificationController::class, 'markAllRead']);

        // Categories (read-only for mobile)
        Route::get('/categories', [ApiCategoryController::class, 'index']);
    });
});
```

---

## API Response Format (Standard)

All API responses should follow a consistent JSON format:

### Success Response
```json
{
    "success": true,
    "data": { ... },
    "message": "Expense created successfully"
}
```

### Error Response
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "amount": ["The amount field is required."],
        "category_id": ["The selected category is invalid."]
    }
}
```

### Paginated Response
```json
{
    "success": true,
    "data": [ ... ],
    "meta": {
        "current_page": 1,
        "last_page": 5,
        "per_page": 20,
        "total": 98
    }
}
```

---

## API Endpoints - Request/Response Details

### POST /api/v1/login
**Request:**
```json
{
    "email": "user@example.com",
    "password": "password123",
    "device_name": "Pixel 8 Pro"
}
```
**Response:**
```json
{
    "success": true,
    "data": {
        "token": "1|abc123def456...",
        "user": {
            "id": 1,
            "name": "Amit Kumar",
            "email": "user@example.com",
            "avatar": "https://...",
            "role": "user",
            "currency": "INR",
            "email_verified_at": "2026-03-15T10:00:00Z"
        }
    }
}
```

### POST /api/v1/register
**Request:**
```json
{
    "name": "Amit Kumar",
    "email": "amit@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "device_name": "Pixel 8 Pro"
}
```

### GET /api/v1/dashboard
**Response:**
```json
{
    "success": true,
    "data": {
        "personal_summary": {
            "this_month_total": 15000.00,
            "last_month_total": 12000.00,
            "this_month_income": 50000.00,
            "category_breakdown": [
                {"category_id": 1, "name": "Food", "icon": "🍔", "total": 5000.00},
                {"category_id": 2, "name": "Travel", "icon": "✈️", "total": 3000.00}
            ]
        },
        "groups_summary": {
            "total_you_owe": 1500.00,
            "total_owed_to_you": 2300.00,
            "groups": [
                {"id": 1, "name": "Goa Trip", "your_balance": -500.00, "member_count": 4},
                {"id": 2, "name": "Flat Expenses", "your_balance": 800.00, "member_count": 3}
            ]
        },
        "recent_activity": [
            {
                "id": 45,
                "type": "personal",
                "description": "Lunch at cafe",
                "amount": 350.00,
                "category": "Food",
                "date": "2026-03-18",
                "group_name": null
            }
        ]
    }
}
```

---

## Mobile-Side API Client Setup

### Axios Instance (services/api.ts)

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://jodtod.com';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request interceptor - attach auth token
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - handle 401 (token expired)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await SecureStore.deleteItemAsync('auth_token');
            // Navigate to login screen
        }
        return Promise.reject(error);
    }
);

export default api;
```

---

## CORS Configuration (Backend)

The Laravel backend must allow requests from the mobile app.

```php
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'],  // In production, restrict to your domain
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,  // false for token-based auth
];
```

---

## Push Notifications Setup

### Backend (Laravel)
```bash
composer require laravel/notification-channels
```

Store device push tokens in a `device_tokens` table:

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | PK |
| user_id | BIGINT | FK → users |
| token | VARCHAR(255) | Expo push token |
| platform | ENUM('android', 'ios') | Device platform |
| created_at | TIMESTAMP | |

### Mobile → Backend Flow
1. App requests notification permissions
2. Gets Expo push token from `expo-notifications`
3. Sends token to `POST /api/v1/device-tokens`
4. Backend stores token
5. When event occurs, backend sends push via Expo's push service

---

## API Controller Approach

### Option 1: Separate API Controllers (Recommended)
Create new controllers under `app/Http/Controllers/Api/V1/` that return JSON. This keeps web (Inertia) and mobile (API) logic cleanly separated.

### Option 2: Dual-Purpose Controllers
Add `wantsJson()` checks to existing controllers:
```php
if ($request->wantsJson()) {
    return response()->json(['success' => true, 'data' => $expenses]);
}
return Inertia::render('Expenses/Index', ['expenses' => $expenses]);
```

**Recommendation**: Use Option 1 for clean separation. Extract shared business logic into Service classes that both web and API controllers can use.

```
app/Http/Controllers/
    ├── ExpenseController.php           # Web (Inertia)
    └── Api/V1/
        ├── AuthController.php          # API auth
        ├── DashboardController.php     # API dashboard
        ├── ExpenseController.php       # API expenses
        ├── GroupController.php         # API groups
        ├── GroupExpenseController.php   # API group expenses
        ├── SettlementController.php    # API settlements
        ├── IncomeController.php        # API incomes
        ├── ProfileController.php       # API profile
        ├── NotificationController.php  # API notifications
        └── CategoryController.php      # API categories

app/Services/
    ├── ExpenseService.php              # Shared business logic
    ├── GroupService.php
    ├── SettlementService.php
    └── DashboardService.php
```
