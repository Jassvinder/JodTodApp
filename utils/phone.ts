import { Linking, Share } from 'react-native';

// wa.me needs the number with country code and digits only; 10-digit numbers are treated as Indian.
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits.length > 10 ? digits : null;
}

export function callPhone(phone: string): Promise<void> {
  return Linking.openURL(`tel:${phone}`);
}

// Opens the person's WhatsApp chat (with the message typed in) when the phone is usable,
// otherwise the share sheet with the message.
export async function openWhatsApp(phone: string | null | undefined, message = ''): Promise<void> {
  const number = toWhatsAppNumber(phone);
  if (number) {
    try {
      await Linking.openURL(`https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ''}`);
      return;
    } catch {
      // Fall back to the share sheet below.
    }
  }
  if (message) {
    await Share.share({ message });
  }
}
