import type { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import type { TipScreen } from '../constants/tips';
import HelpButton from './tips/HelpButton';
import TipAnchor from './tips/TipAnchor';

interface HeaderAddButtonProps {
  onPress: () => void;
  label?: string;
  color?: string;
  visible?: boolean;
  // Optional extra header action rendered to the left of the Add button.
  leadingAction?: ReactNode;
  // Shows the "?" tips button for this screen.
  helpScreen?: TipScreen;
  // Lets a tip bubble point at the Add button.
  tipId?: string;
}

// Places a labeled "+ Add" action on the right side of the current screen's header.
export default function HeaderAddButton({ onPress, label = 'Add', color = Colors.primary, visible = true, leadingAction, helpScreen, tipId }: HeaderAddButtonProps) {
  const button = (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: color,
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <Ionicons name="add" size={18} color="#fff" />
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff', marginLeft: 2 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Stack.Screen
      options={{
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {helpScreen && <HelpButton screen={helpScreen} />}
            {leadingAction}
            {visible && (
              <View style={{ marginLeft: leadingAction ? 8 : 0 }}>
                {tipId ? <TipAnchor id={tipId}>{button}</TipAnchor> : button}
              </View>
            )}
          </View>
        ),
      }}
    />
  );
}
