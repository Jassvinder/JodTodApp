import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { TEAM_BUILDER_LABEL, homeRouteFor } from '../constants/navigation';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/Toast';
import type { AppMode } from '../types/models';

const modes: {
  mode: AppMode;
  title: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}[] = [
  {
    mode: 'personal',
    title: 'Personal',
    text: 'Expenses, income, group splits, tasks, Remember and Give & Take.',
    icon: 'wallet-outline',
    color: Colors.primary,
    bg: '#eef2ff',
  },
  {
    mode: 'team_builder',
    title: TEAM_BUILDER_LABEL,
    text: 'For network marketing: prospects you showed the plan to, follow-ups, and your upline and downline team.',
    icon: 'git-network-outline',
    color: '#d97706',
    bg: '#fef3c7',
  },
];

// Asked once after the first login, and opened again from More / the drawer to switch.
export default function ModeSelectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { user, setAppMode } = useAuthStore();
  const [saving, setSaving] = useState<AppMode | null>(null);
  const currentMode = user?.app_mode ?? null;

  const choose = async (mode: AppMode) => {
    setSaving(mode);
    try {
      if (mode !== currentMode) {
        await setAppMode(mode);
      }
      router.replace(homeRouteFor(mode) as any);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Could not switch. Please try again.', 'error');
    } finally {
      setSaving(null);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }}
    >
      {currentMode && (
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start', padding: 4, marginBottom: 12 }} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
      )}
      <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.text }}>
        {currentMode ? 'Switch mode' : `Welcome, ${user?.name?.split(' ')[0] ?? ''}!`}
      </Text>
      <Text style={{ fontSize: 15, color: Colors.textSecondary, marginTop: 6, marginBottom: 24 }}>
        How do you want to use JodTod? You can switch anytime from More.
      </Text>

      {modes.map((item) => {
        const isCurrent = item.mode === currentMode;
        return (
          <TouchableOpacity
            key={item.mode}
            onPress={() => choose(item.mode)}
            disabled={saving !== null}
            activeOpacity={0.8}
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: isCurrent ? item.color : Colors.border,
              padding: 18,
              marginBottom: 14,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: item.bg, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={item.icon} size={26} color={item.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.text }}>{item.title}</Text>
                {isCurrent && (
                  <Text style={{ fontSize: 11, fontWeight: '700', color: item.color, marginLeft: 8 }}>CURRENT</Text>
                )}
              </View>
              <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>{item.text}</Text>
            </View>
            {saving === item.mode ? (
              <ActivityIndicator color={item.color} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
