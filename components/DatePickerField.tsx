import { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  error?: string;
}

export default function DatePickerField({ label, value, onChange, error }: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const dateObj = value ? new Date(value + 'T00:00:00') : new Date();

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select date';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${yyyy}-${mm}-${dd}`);
    }
  };

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>{label}</Text>
      <TouchableOpacity
        onPress={() => { setPickerMode('date'); setShowPicker(true); }}
        style={{
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: error ? Colors.error : Colors.border,
          borderRadius: 10,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 15, color: value ? Colors.text : Colors.textMuted, flex: 1 }}>
          {formatDisplayDate(value)}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
      {error && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{error}</Text>}

      {showPicker && (
        <>
          <DateTimePicker
            value={dateObj}
            mode={pickerMode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            maximumDate={new Date()}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              onPress={() => setShowPicker(false)}
              style={{ alignItems: 'center', paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.primary }}>Done</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}
