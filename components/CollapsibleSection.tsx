import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
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
  style,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState(0);
  const [measured, setMeasured] = useState(false);
  const animValue = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isOpen ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const rotation = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const heightAnim = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });

  const opacityAnim = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

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
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons name="chevron-up" size={18} color={Colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {/* Hidden measurer */}
      {!measured && (
        <View
          style={{ position: 'absolute', opacity: 0, zIndex: -1 }}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) {
              setContentHeight(h);
              setMeasured(true);
            }
          }}
        >
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            {children}
          </View>
        </View>
      )}

      <Animated.View style={{
        height: measured ? heightAnim : (isOpen ? undefined : 0),
        opacity: measured ? opacityAnim : (isOpen ? 1 : 0),
        overflow: 'hidden',
      }}>
        <View
          style={{ paddingHorizontal: 14, paddingBottom: 14 }}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && h !== contentHeight) {
              setContentHeight(h);
              setMeasured(true);
            }
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
}
