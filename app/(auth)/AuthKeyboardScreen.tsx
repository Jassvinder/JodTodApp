import type { ReactNode, RefObject } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

interface AuthKeyboardScreenProps {
  children: ReactNode;
  contentStyle?: ViewStyle;
  scrollViewRef?: RefObject<ScrollView | null>;
}

export default function AuthKeyboardScreen({
  children,
  contentStyle,
  scrollViewRef,
}: AuthKeyboardScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ height: insets.top, backgroundColor: Colors.background }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 24,
            paddingBottom: Math.max(insets.bottom + 24, 32),
            ...contentStyle,
          }}
          keyboardShouldPersistTaps="always"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
