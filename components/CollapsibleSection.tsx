import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  borderColor?: string;
  backgroundColor?: string;
  titleColor?: string;
  headerAction?: React.ReactNode;
  style?: any;
}

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  count,
  icon,
  iconColor,
  iconBg,
  borderColor = Colors.border,
  backgroundColor = Colors.surface,
  titleColor = Colors.text,
  headerAction,
  style,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <View style={[{
      backgroundColor,
      borderRadius: 12,
      borderWidth: 1,
      borderColor,
      marginBottom: 12,
      overflow: 'hidden',
    }, style]}>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 14,
        }}
      >
        {icon && (
          <View style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            backgroundColor: iconBg || '#eef2ff',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
          }}>
            <Ionicons name={icon} size={16} color={iconColor || Colors.primary} />
          </View>
        )}
        <Text style={{ fontSize: 15, fontWeight: '600', color: titleColor, flex: 1 }}>
          {title}
          {count !== undefined && (
            <Text style={{ fontSize: 13, fontWeight: '400', color: Colors.textSecondary }}> ({count})</Text>
          )}
        </Text>
        {headerAction}
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      {isOpen && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          {children}
        </View>
      )}
    </View>
  );
}
