# JodTod Mobile App - System Requirements

---

## Development Machine Requirements

### Hardware (Minimum)
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 8 GB | 16 GB |
| Storage | 30 GB free | 50 GB free (Android SDK + iOS tools are large) |
| CPU | Any modern quad-core | 8+ cores for faster builds |
| OS | Windows 10/11, macOS 13+, Ubuntu 22+ | macOS 14+ (required for iOS builds) |

### Important Note on iOS Development
- **iOS builds REQUIRE macOS** - there is no way around this
- **Android builds work on Windows, macOS, or Linux**
- **Option for Windows users**: Use EAS Build (Expo's cloud build service) to build iOS apps without a Mac
- **Recommended**: Use EAS Build for both platforms to avoid local setup complexity

---

## Software Requirements

### 1. Node.js & Package Manager

```bash
# Install Node.js 22 LTS (required)
# Download from: https://nodejs.org/
node --version   # Should be v22.x.x

# npm comes with Node.js (v10+)
npm --version    # Should be v10.x.x
```

### 2. Expo CLI

```bash
# No global install needed - Expo CLI is bundled with the project
# Just use npx:
npx create-expo-app@latest
```

### 3. Git

```bash
git --version    # Any recent version (2.40+)
```

### 4. Code Editor

| Editor | Required Extensions |
|--------|-------------------|
| VS Code (recommended) | ESLint, Prettier, TypeScript, React Native Tools, Tailwind CSS IntelliSense |

---

## Platform-Specific Setup

### Android Development

#### Option A: Physical Device (Recommended for starting)
1. Enable **Developer Options** on your Android phone
   - Go to Settings > About Phone > Tap "Build Number" 7 times
2. Enable **USB Debugging** in Developer Options
3. Connect phone via USB
4. Run `npx expo start` and press `a` to run on Android

#### Option B: Android Emulator
1. Install **Android Studio** (latest stable)
   - Download: https://developer.android.com/studio
2. During installation, ensure these are checked:
   - Android SDK
   - Android SDK Platform-Tools
   - Android Emulator
   - Android SDK Build-Tools (latest)
3. Install an Android SDK platform:
   - Open Android Studio > SDK Manager
   - Install **Android 15 (API 35)** SDK
4. Create a Virtual Device:
   - Open Android Studio > Device Manager
   - Create device: Pixel 8, API 35, x86_64 image
5. Set environment variables:

```bash
# Add to ~/.bashrc or ~/.zshrc (macOS/Linux)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Windows: Add to System Environment Variables
# ANDROID_HOME = C:\Users\<username>\AppData\Local\Android\Sdk
# Add to PATH: %ANDROID_HOME%\emulator and %ANDROID_HOME%\platform-tools
```

#### Option C: Expo Go App (Quickest start)
1. Install **Expo Go** from Google Play Store on your phone
2. Run `npx expo start` on your machine
3. Scan the QR code with Expo Go
4. **Limitation**: Does not support custom native modules

### iOS Development (macOS only)

#### Option A: Physical Device
1. Install **Xcode** from Mac App Store (latest version, currently 16.x)
2. Open Xcode > Settings > Platforms > Install iOS 18 Simulator
3. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
4. Install CocoaPods:
   ```bash
   sudo gem install cocoapods
   ```
5. Connect iPhone via USB, trust the computer
6. Run `npx expo start` and press `i`

#### Option B: iOS Simulator
1. Same Xcode setup as above
2. Simulator launches automatically when you press `i` in Expo dev server

#### Option C: EAS Build (No Mac needed)
1. Build iOS apps in the cloud using EAS Build
2. Requires an Apple Developer Account ($99/year)
3. Install via TestFlight on your iPhone

---

## Expo Account Setup

```bash
# Create a free Expo account at https://expo.dev/signup

# Login from CLI
npx expo login
```

### EAS Build Setup (for app store builds)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure
```

---

## App Store Accounts (Required for Publishing)

| Store | Cost | URL |
|-------|------|-----|
| Google Play Console | $25 one-time | https://play.google.com/console |
| Apple Developer Program | $99/year | https://developer.apple.com/programs |

**Note**: You can develop and test without these accounts. They're only needed when you want to publish to the stores.

---

## Backend Requirements (Already in place)

The Laravel backend needs API routes that return JSON responses. Currently, the web app uses Inertia.js which returns rendered pages. For mobile:

1. **Laravel Sanctum** must be set up for API token authentication
2. API routes must be created under `/api/v1/*` prefix
3. All existing Inertia controllers need corresponding API controllers (or dual-purpose controllers)
4. CORS must be configured to allow requests from the mobile app

See [API_INTEGRATION.md](API_INTEGRATION.md) for full details.

---

## Environment Verification Checklist

Run these commands to verify your setup:

```bash
# Node.js
node --version          # v22.x.x

# npm
npm --version           # v10.x.x

# Git
git --version           # 2.40+

# Android (if using emulator)
adb --version           # Android Debug Bridge version 1.x.x
emulator -list-avds     # Should list your virtual device

# iOS (macOS only)
xcodebuild -version     # Xcode 16.x
pod --version           # 1.x.x

# Expo
npx expo --version      # Latest
```

---

## Quick Start After Setup

```bash
# 1. Create the project
npx create-expo-app@latest JodTodApp --template tabs

# 2. Navigate into project
cd JodTodApp

# 3. Install dependencies
npm install

# 4. Start development server
npx expo start

# 5. Press 'a' for Android, 'i' for iOS, or scan QR with Expo Go
```
