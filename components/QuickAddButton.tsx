import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { LEDGER_LABEL } from '../constants/navigation';

const actions: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}[] = [
  { label: 'Expense', icon: 'wallet-outline', color: Colors.primary, route: '/(tabs)/expenses/add' },
  { label: 'Income', icon: 'trending-up-outline', color: Colors.success, route: '/(tabs)/incomes/add' },
  { label: 'Task', icon: 'checkbox-outline', color: '#8b5cf6', route: '/todos-add' },
  { label: LEDGER_LABEL, icon: 'swap-horizontal-outline', color: '#d97706', route: '/ledger' },
];

// Floating "+" on Home that opens the add screens without visiting each list first.
export default function QuickAddButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleAction = (route: string) => {
    setOpen(false);
    router.push(route as any);
  };

  return (
    <>
      {open && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setOpen(false)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }}
        />
      )}

      <View style={{ position: 'absolute', right: 16, bottom: 16, alignItems: 'flex-end' }}>
        {open && actions.map((action) => (
          <TouchableOpacity
            key={action.label}
            onPress={() => handleAction(action.route)}
            activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
          >
            <View style={{ backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginRight: 10, elevation: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>{action.label}</Text>
            </View>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', elevation: 3 }}>
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => setOpen((value) => !value)}
          activeOpacity={0.8}
          accessibilityLabel={open ? 'Close quick add' : 'Quick add'}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: Colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}
        >
          <Ionicons name={open ? 'close' : 'add'} size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  );
}
