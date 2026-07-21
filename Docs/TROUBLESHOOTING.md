# JodTod Mobile App - Troubleshooting Guide

Common issues encountered during development and their fixes.

---

## 1. App stuck on splash/logo screen (won't navigate to login)

**Cause:** `.env` file has wrong IP address. Mobile phone can't reach the Laravel API server.

**Fix:**

1. Run `ipconfig` in terminal to get your PC's current WiFi IPv4 address
2. Update `D:\Development\Projects\JodTodApp\.env`:
   ```
   EXPO_PUBLIC_API_URL=http://<YOUR_PC_IP>:8001
   ```
3. Restart expo: `npx expo start --clear`

**Note:** IP changes when you switch WiFi networks. Always verify with `ipconfig`.

---

## 2. "Unable to resolve module react-dom/client"

**Cause:** Expo 55's `@expo/log-box` internally imports `react-dom` even on native platforms.

**Fix:**

```bash
cd D:\Development\Projects\JodTodApp
npm install react-dom --legacy-peer-deps
npx expo start --clear
```

One-time fix. Won't happen again after installing.

---

## 3. "Unable to resolve module expo-clipboard" (or any expo-\* module)

**Cause:** A screen uses an Expo package that isn't installed.

**Fix:**

```bash
cd D:\Development\Projects\JodTodApp
npm install expo-clipboard --legacy-peer-deps
npx expo start --clear
```

Always restart with `--clear` after installing new packages.

---

## 4. Windows Firewall blocks mobile from reaching Laravel API

**Cause:** Windows Firewall blocks incoming connections on port 8001 by default. PC can access it locally but mobile phone on same WiFi can't.

**Fix:** Run this in **PowerShell (Run as Administrator)** — one time only:

```powershell
netsh advfirewall firewall add rule name="Laravel Dev Server" dir=in action=allow protocol=TCP localport=8001
```

---

## 5. Expo "Port XXXX is being used by another process"

**Cause:** Previous expo server wasn't stopped properly.

**Fix:** Either:

- Press `Y` to use alternate port (won't affect anything)
- Or kill the port: `npx kill-port 8081`
- Or find and close the previous terminal running expo

---

## 6. Changes not reflecting after npm install

**Cause:** Metro bundler caches old dependency tree.

**Fix:** Always restart with cache clear after installing packages:

```bash
npx expo start --clear
```

If still stuck:

```bash
rm -rf node_modules/.cache
npx expo start --clear
```

Nuclear option (rarely needed):

```bash
rm -rf node_modules
npm install --legacy-peer-deps
npx expo start --clear
```

---

## 7. "Push notifications not available (Expo Go or missing package)"

**Cause:** This is expected when testing an Android app through Expo Go with Expo SDK 53 or later. Expo Go no longer supports remote push notifications. It is not caused by a missing `expo-notifications` package. Local notifications can still be tested in Expo Go.

**Fix:** Test remote push notifications in the app's preview development build instead.

1. Confirm the project packages and config plugin are installed. This repository already has `expo-notifications`, `expo-constants`, the `expo-notifications` plugin, and an EAS `projectId` configured.
2. Configure Android FCM V1 credentials for the `com.jodtod.app` application in Firebase. Download `google-services.json`, add its path as `expo.android.googleServicesFile` in `app.json`, and upload the Firebase service-account JSON to EAS with `eas credentials`. Never commit the private service-account JSON.
3. Sign in to Expo and create the existing preview profile build:
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build --platform android --profile preview
   ```
4. Install the generated APK on a physical Android device, then run `npx expo start` and open the project in that development build. Do not open it in Expo Go.
5. Sign in to the app, allow notification permission, and verify that the backend receives the generated `ExpoPushToken` at `POST /api/v1/device-token`.
6. Send a test notification using the Expo push notification tool or the Expo Push API. Inspect the returned push ticket and receipt if delivery fails.

**Note:** A new native build is required after changing `app.json`, notification credentials, or `google-services.json` settings. A Metro restart alone cannot apply those native changes.

---

## Dev Setup Checklist (for new machine / fresh start)

1. `cd D:\Development\Projects\JodTodApp && npm install --legacy-peer-deps`
2. Get PC IP: `ipconfig` → find IPv4 address
3. Update `.env`: `EXPO_PUBLIC_API_URL=http://<IP>:8001`
4. Add firewall rule (admin PowerShell): `netsh advfirewall firewall add rule name="Laravel Dev Server" dir=in action=allow protocol=TCP localport=8001`
5. Start Laravel: `php artisan serve --host=0.0.0.0 --port=8001` (from `D:\Development\Projects\JodTod`)
6. Start Expo: `npx expo start --clear` (from `D:\Development\Projects\JodTodApp`)
7. Scan QR code from Expo Go app on phone (same WiFi)

---

## Important Notes

- **`--legacy-peer-deps`** is needed for most npm installs because Expo 55 + React 19 has peer dep conflicts
- **`.env` changes** require expo restart with `--clear` to take effect
- **Phone and PC must be on same WiFi** for development
- **Port 8001** = Laravel backend (API), **Port 8081/8082** = Expo dev server (app code)
