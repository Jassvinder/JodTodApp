import { View, Text, Image } from 'react-native';
import { Colors } from '../constants/colors';
import { resolveUrl } from '../utils/format';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  color?: string;
}

export function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

export default function UserAvatar({ name, avatarUrl, size = 36, color = Colors.primary }: UserAvatarProps) {
  const uri = resolveUrl(avatarUrl);
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: Math.round(size * 0.38), fontWeight: '700', color: '#fff' }}>{getInitials(name)}</Text>
    </View>
  );
}
