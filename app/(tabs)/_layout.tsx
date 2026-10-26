import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import DrawerMenu from '../../components/DrawerMenu';
import { BOTTOM_TABS, HIDDEN_TAB_SCREENS } from '../../constants/navigation';
import { useDrawerStore } from '../../stores/drawerStore';
import { useAuthStore } from '../../stores/authStore';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom;
  const { isOpen, close } = useDrawerStore();
  const appMode = useAuthStore((state) => state.user?.app_mode);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: {
            borderTopColor: Colors.border,
            backgroundColor: Colors.surface,
            height: 60 + bottomPadding,
            paddingBottom: bottomPadding,
            paddingTop: 4,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTitleStyle: {
            fontWeight: '600',
            color: Colors.text,
          },
          headerShadowVisible: false,
        }}
      >
        {BOTTOM_TABS.map((tab) => (
          <Tabs.Screen
            key={tab.screen}
            name={tab.screen}
            options={{
              title: tab.label,
              headerShown: false,
              tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} size={size} color={color} />,
            }}
          />
        ))}
        {HIDDEN_TAB_SCREENS.map((tab) => (
          <Tabs.Screen
            key={tab.screen}
            name={tab.screen}
            // Team Builder opens Profile too; hide the personal tab bar there.
            options={{ title: tab.title, headerShown: false, href: null, ...(appMode === 'team_builder' ? { tabBarStyle: { display: 'none' } } : {}) }}
          />
        ))}
      </Tabs>

      <DrawerMenu visible={isOpen} onClose={close} />
    </View>
  );
}
