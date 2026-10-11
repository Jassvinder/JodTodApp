import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';

type IconName = keyof typeof Ionicons.glyphMap;

interface EmptyStateProps {
  icon: IconName;
  title: string;
  text: string;
  iconColor?: string;
  iconBg?: string;
  actionLabel?: string;
  actionIcon?: IconName;
  actionColor?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

// Empty list placeholder that explains the feature and offers the first action.
export default function EmptyState({
  icon,
  title,
  text,
  iconColor = Colors.primary,
  iconBg = '#eef2ff',
  actionLabel,
  actionIcon = 'add',
  actionColor = Colors.primary,
  onAction,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 16 }}>
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: iconBg, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={icon} size={40} color={iconColor} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 21 }}>{text}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: actionColor, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12, marginTop: 20 }}
        >
          <Ionicons name={actionIcon} size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 8 }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
      {secondaryLabel && onSecondary && (
        <TouchableOpacity onPress={onSecondary} style={{ paddingVertical: 10, marginTop: 6 }}>
          <Text style={{ color: actionColor, fontSize: 14, fontWeight: '600' }}>{secondaryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
