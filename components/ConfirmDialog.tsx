import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { create } from 'zustand';

interface ConfirmState {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  show: (opts: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  hide: () => void;
}

export const useConfirm = create<ConfirmState>((set) => ({
  visible: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  danger: false,
  onConfirm: null,
  onCancel: null,
  show: (opts) => set({
    visible: true,
    title: opts.title,
    message: opts.message,
    confirmText: opts.confirmText || 'Confirm',
    cancelText: opts.cancelText || 'Cancel',
    danger: opts.danger ?? false,
    onConfirm: opts.onConfirm,
    onCancel: opts.onCancel || null,
  }),
  hide: () => set({ visible: false, onConfirm: null, onCancel: null }),
}));

export default function ConfirmDialog() {
  const { visible, title, message, confirmText, cancelText, danger, onConfirm, onCancel, hide } = useConfirm();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleCancel = () => {
    onCancel?.();
    hide();
  };

  const handleConfirm = () => {
    onConfirm?.();
    hide();
  };

  const confirmColor = danger ? Colors.error : Colors.primary;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        opacity: opacityAnim,
      }}>
        <Animated.View style={{
          backgroundColor: Colors.surface,
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 340,
          transform: [{ scale: scaleAnim }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 24,
          elevation: 10,
        }}>
          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: danger ? '#fee2e2' : '#eef2ff',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons
                name={danger ? 'warning' : 'help-circle'}
                size={28}
                color={confirmColor}
              />
            </View>
          </View>

          {/* Title */}
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: Colors.text,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            {title}
          </Text>

          {/* Message */}
          <Text style={{
            fontSize: 14,
            color: Colors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 24,
          }}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {cancelText ? (
              <TouchableOpacity
                onPress={handleCancel}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: Colors.background,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textSecondary }}>{cancelText}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={handleConfirm}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: confirmColor,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
