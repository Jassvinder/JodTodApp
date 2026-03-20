import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { Colors } from '../constants/colors';
import { resolveUrl } from '../utils/format';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

const menuItems: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}[] = [
  { label: 'Dashboard', icon: 'home-outline', route: '/(tabs)' },
  { label: 'Expenses', icon: 'wallet-outline', route: '/(tabs)/expenses' },
  { label: 'Income', icon: 'trending-up-outline', route: '/(tabs)/incomes' },
  { label: 'My Tasks', icon: 'checkbox-outline', route: '/todos' },
  { label: 'Contacts', icon: 'people-outline', route: '/contacts' },
  { label: 'Groups', icon: 'people-circle-outline', route: '/(tabs)/groups' },
  { label: 'Notifications', icon: 'notifications-outline', route: '/notifications' },
  { label: 'Profile', icon: 'person-outline', route: '/(tabs)/profile' },
];

export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 100);
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
      {/* Overlay */}
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: DRAWER_WIDTH,
          backgroundColor: Colors.surface,
          transform: [{ translateX: slideAnim }],
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
        }}
      >
        <ScrollView style={{ flex: 1 }} bounces={false}>
          {/* User Profile Header */}
          <View style={{ padding: 20, paddingTop: 50, backgroundColor: Colors.primary }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {user?.avatar_url ? (
                <Image source={{ uri: resolveUrl(user.avatar_url)! }} style={{ width: 48, height: 48, borderRadius: 24 }} />
              ) : (
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>
                    {getInitials(user?.name || '')}
                  </Text>
                </View>
              )}
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }} numberOfLines={1}>
                  {user?.name || 'User'}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }} numberOfLines={1}>
                  {user?.email || ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View style={{ paddingVertical: 8 }}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => handleNavigate(item.route)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                }}
              >
                <Ionicons name={item.icon} size={22} color={Colors.textSecondary} />
                <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.text, marginLeft: 16 }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
