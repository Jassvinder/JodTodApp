import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';

const tabs: {
  name: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: 'Home', route: '/(tabs)', icon: 'home-outline', activeIcon: 'home' },
  { name: 'Expenses', route: '/(tabs)/expenses', icon: 'wallet-outline', activeIcon: 'wallet' },
  { name: 'Groups', route: '/(tabs)/groups', icon: 'people-outline', activeIcon: 'people' },
  { name: 'Tasks', route: '/(tabs)/todos', icon: 'checkbox-outline', activeIcon: 'checkbox' },
  { name: 'Income', route: '/(tabs)/incomes', icon: 'trending-up-outline', activeIcon: 'trending-up' },
  { name: 'Profile', route: '/(tabs)/profile', icon: 'person-outline', activeIcon: 'person' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
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
      {tabs.map((tab) => {
        const isActive = pathname === tab.route || pathname.startsWith(tab.route + '/');

        return (
          <TouchableOpacity
            key={tab.name}
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
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
