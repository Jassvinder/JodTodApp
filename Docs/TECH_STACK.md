# JodTod Mobile App - Technology Stack

---

## Chosen Stack: React Native + Expo (SDK 53+)

### Why React Native + Expo?

| Factor | React Native + Expo | Flutter | Kotlin/Swift (Native) |
|--------|---------------------|---------|----------------------|
| Cross-platform | Yes (Android + iOS) | Yes (Android + iOS) | No (separate codebases) |
| Language | TypeScript | Dart | Kotlin / Swift |
| Learning curve | Low (JS/TS ecosystem) | Medium (new language) | High (2 languages) |
| Community & ecosystem | Largest | Growing fast | Platform-specific |
| OTA updates | Yes (EAS Update) | No | No |
| Backend alignment | Same JS/TS as web frontend | Different language | Different language |
| Dev speed | Fastest | Fast | Slowest (2x work) |
| Performance | Near-native | Near-native | Native |
| App size | ~15-25 MB | ~15-25 MB | ~5-10 MB |
| Hot reload | Yes | Yes | Limited |
| Expo ecosystem | Full (camera, notifications, auth, etc.) | N/A | N/A |

### Why NOT Flutter?
- Dart is a completely new language to learn
- JodTod web frontend already uses JavaScript/TypeScript (Vue.js) - staying in the same ecosystem reduces context switching
- React Native has a larger hiring pool and more third-party libraries
- Expo provides managed workflow which massively simplifies builds, deployments, and OTA updates

### Why NOT Native (Kotlin + Swift)?
- Maintaining 2 separate codebases doubles the development and maintenance effort
- For a finance/expense tracking app, native performance gains are negligible
- Single developer = cross-platform is the only practical choice

---

## Core Technology Decisions

### Framework & Runtime
| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.79+ (New Architecture) | Cross-platform mobile framework |
| Expo | SDK 53+ | Managed workflow, build system, OTA updates |
| TypeScript | 5.x | Type safety, better DX |
| Node.js | 22 LTS | Development runtime |

### Navigation
| Technology | Purpose |
|------------|---------|
| Expo Router (v4+) | File-based routing (like Next.js) - screens defined by folder structure |

**Why Expo Router?**
- File-based routing is the modern standard (similar to Next.js, Nuxt.js)
- Deep linking support out of the box
- Type-safe routes with TypeScript
- Built-in tab navigation, stack navigation, modal support

### State Management
| Technology | Purpose |
|------------|---------|
| Zustand | Global state (auth, user preferences) |
| TanStack Query (React Query) v5 | Server state (API data fetching, caching, sync) |

**Why this combination?**
- Zustand: Lightweight, no boilerplate, perfect for auth tokens and UI state
- TanStack Query: Handles API caching, background refetching, optimistic updates, offline support - exactly what an expense app needs

### UI & Styling
| Technology | Purpose |
|------------|---------|
| NativeWind v4 | Tailwind CSS for React Native - consistent with web app styling |
| React Native Reanimated v3 | Smooth 60fps animations |
| React Native Gesture Handler | Swipe-to-delete, pull-to-refresh |

**Why NativeWind?**
- JodTod web app already uses Tailwind CSS
- Same utility class names work in mobile - consistent design language
- Faster styling than StyleSheet.create()

### Forms & Validation
| Technology | Purpose |
|------------|---------|
| React Hook Form | Form state management |
| Zod | Schema validation (same schemas can be shared with backend types) |

### Charts
| Technology | Purpose |
|------------|---------|
| Victory Native | Pie charts, bar charts for expense breakdown |

### Storage & Auth
| Technology | Purpose |
|------------|---------|
| expo-secure-store | Secure token storage (JWT) |
| AsyncStorage | Non-sensitive app preferences |
| expo-local-authentication | Biometric auth (fingerprint/face) |

### Notifications
| Technology | Purpose |
|------------|---------|
| expo-notifications | Push notifications (FCM for Android, APNs for iOS) |

### Build & Deployment
| Technology | Purpose |
|------------|---------|
| EAS Build | Cloud builds for Android (APK/AAB) and iOS (IPA) |
| EAS Submit | Submit to Google Play Store and Apple App Store |
| EAS Update | Over-the-air JS updates without app store review |

---

## Minimum Platform Targets

| Platform | Minimum Version |
|----------|----------------|
| Android | API 24 (Android 7.0) |
| iOS | 16.0 |

---

## Key Architectural Principles

1. **Offline-first**: Cache expense data locally, sync when online
2. **JWT authentication**: Stateless auth via Laravel Sanctum API tokens
3. **Shared API**: Same Laravel backend serves both web (Inertia) and mobile (JSON API)
4. **Consistent design**: NativeWind ensures mobile and web share the same Tailwind-based design language
5. **Type safety**: TypeScript end-to-end with shared API response types
