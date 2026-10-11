if (!process.env.EXPO_PUBLIC_API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is not set. Add it to the .env file and rebuild the app.');
}

// Trailing slashes are stripped so paths like `${API_BASE_URL}/api/v1` never contain "//".
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
export const API_URL = `${API_BASE_URL}/api/v1`;

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
