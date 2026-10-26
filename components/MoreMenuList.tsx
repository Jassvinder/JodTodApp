import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import type { NavItem } from '../constants/navigation';

// Full-screen list of links used by the "More" tab in both app modes.
export default function MoreMenuList({ items }: { items: NavItem[] }) {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: 16 }}>
      <View
        style={{
          backgroundColor: Colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: Colors.border,
          overflow: 'hidden',
        }}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderTopWidth: index > 0 ? 1 : 0,
              borderTopColor: Colors.border,
            }}
          >
            <Ionicons name={item.icon} size={22} color={Colors.primary} />
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text, marginLeft: 14 }}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
