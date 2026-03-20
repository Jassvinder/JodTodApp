import { API_BASE_URL } from '../constants/config';

/**
 * Resolve a URL from API response to be accessible from mobile.
 * Replaces localhost/127.0.0.1 URLs with the actual API base URL.
 */
export function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // If already a full URL with the correct host, return as-is
  if (url.startsWith(API_BASE_URL)) return url;
  // If relative path (starts with /), prepend API base URL
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  // Replace localhost/127.0.0.1 URLs with API base URL
  return url.replace(/https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/, API_BASE_URL);
}

/**
 * Format amount in Indian currency style (₹1,23,456)
 */
export function formatCurrency(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const sign = amount < 0 ? '-' : '';
  return `${sign}₹${formatted}`;
}

/**
 * Format date relative to today
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Calculate percentage change between two values
 */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
