import { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/colors';
import type { TipScreen } from '../../constants/tips';
import { useTipsStore } from '../../stores/tipsStore';

interface HelpButtonProps {
  screen: TipScreen;
  color?: string;
}

// "?" button that replays a screen's tips. It also shows them automatically on the first visit.
export default function HelpButton({ screen, color = Colors.textSecondary }: HelpButtonProps) {
  const startTips = useTipsStore((s) => s.startTips);
  const ready = useTipsStore((s) => s.loaded && s.introSeen && !s.seenScreens.includes(screen));

  useFocusEffect(
    useCallback(() => {
      if (!ready) return;
      // Wait for the screen to lay out before pointing at its elements.
      const timer = setTimeout(() => {
        if (!useTipsStore.getState().active) startTips(screen);
      }, 800);
      return () => {
        clearTimeout(timer);
        const { active, cancel } = useTipsStore.getState();
        if (active?.screen === screen) cancel();
      };
    }, [ready, screen, startTips])
  );

  return (
    <TouchableOpacity
      onPress={() => startTips(screen)}
      accessibilityRole="button"
      accessibilityLabel="Show tips for this screen"
      hitSlop={8}
      style={{ padding: 4, marginRight: 6 }}
    >
      <Ionicons name="help-circle-outline" size={24} color={color} />
    </TouchableOpacity>
  );
}
