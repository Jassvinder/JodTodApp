// Google Sign-In returns to the app via `<scheme>:/oauthredirect`. That URL is consumed by
// expo-auth-session's own listener, so keep Expo Router from treating it as a route.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (path.includes('oauthredirect')) {
    return null;
  }
  return path;
}
