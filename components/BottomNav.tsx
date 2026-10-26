import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { bottomTabsFor, isTabActive } from '../constants/navigation';
import { useAuthStore } from '../stores/authStore';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const appMode = useAuthStore((state) => state.user?.app_mode);
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom;

  return (
    <View style={{
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      backgroundColor: Colors.surface,
      paddingBottom: bottomPadding,
      paddingTop: 6,
    }}>
      {bottomTabsFor(appMode).map((tab) => {
        const isActive = isTabActive(tab, pathname);

        return (
          <TouchableOpacity
            key={tab.screen}
            onPress={() => router.push(tab.route as any)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={22}
              color={isActive ? Colors.primary : Colors.textMuted}
            />
            <Text style={{
              fontSize: 10,
              fontWeight: '600',
              color: isActive ? Colors.primary : Colors.textMuted,
              marginTop: 2,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
