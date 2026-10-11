import { useEffect, useRef, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useNavigation } from 'expo-router';
import { activeTip, useTipsStore } from '../../stores/tipsStore';

interface TipAnchorProps {
  id: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Marks an element that a tip bubble can point at. It measures itself only while its tip is showing.
export default function TipAnchor({ id, children, style }: TipAnchorProps) {
  const ref = useRef<View>(null);
  const navigation = useNavigation();
  const isActive = useTipsStore((s) => activeTip(s)?.anchor === id);
  const setAnchorRect = useTipsStore((s) => s.setAnchorRect);

  useEffect(() => {
    // The same anchor id can exist on a screen that is mounted but not visible.
    if (!isActive || !navigation.isFocused()) return;
    const timer = setTimeout(() => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) setAnchorRect(id, { x, y, width, height });
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [isActive, id, navigation, setAnchorRect]);

  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}
