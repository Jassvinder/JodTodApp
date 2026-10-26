import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/colors';
import { TEAM_BOTTOM_TABS, TEAM_BUILDER_LABEL } from '../../constants/navigation';
import { TEAM_BUILDER_COLOR } from '../../constants/teamBuilder';

export default function TeamBuilderLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: TEAM_BUILDER_COLOR,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          borderTopColor: Colors.border,
          backgroundColor: Colors.surface,
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: Colors.surface },
        headerTitleStyle: { fontWeight: '600', color: Colors.text },
        headerShadowVisible: false,
        headerRightContainerStyle: { paddingRight: 12 },
      }}
    >
      {TEAM_BOTTOM_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.screen}
          name={tab.screen}
          options={{
            title: tab.screen === 'index' ? TEAM_BUILDER_LABEL : tab.label,
            tabBarLabel: tab.label,
            tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
