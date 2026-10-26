import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, type TextStyle } from 'react-native';
import { Colors } from '../constants/colors';

export const formInputStyle: TextStyle = {
  backgroundColor: Colors.background,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 10,
  padding: 12,
  fontSize: 15,
  color: Colors.text,
  marginBottom: 12,
};

interface FormCardProps {
  title: string;
  submitLabel: string;
  submitColor?: string;
  saving: boolean;
  error?: string;
  onSubmit: () => void;
  onCancel: () => void;
  children: ReactNode;
}

// Card wrapper with Cancel / Save buttons for inline add/edit forms.
export default function FormCard({ title, submitLabel, submitColor = Colors.primary, saving, error, onSubmit, onCancel, children }: FormCardProps) {
  return (
    <View style={{
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      marginBottom: 0,
      borderWidth: 1,
      borderColor: Colors.border,
    }}>
      <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 12 }}>{title}</Text>
      {children}
      {!!error && <Text style={{ color: Colors.error, fontSize: 12, marginBottom: 12 }}>{error}</Text>}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={onCancel}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 10,
            backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSubmit}
          disabled={saving}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: submitColor, alignItems: 'center' }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{submitLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
