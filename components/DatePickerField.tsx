import { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD or YYYY-MM-DDTHH:MM
  onChange: (date: string) => void;
  error?: string;
  mode?: 'date' | 'datetime';
  maxDate?: Date;
  minDate?: Date;
}

export default function DatePickerField({ label, value, onChange, error, mode = 'date', maxDate, minDate }: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const parseDate = () => {
    if (!value) return new Date();
    if (value.includes('T')) return new Date(value);
    return new Date(value + 'T00:00:00');
  };

  const dateObj = parseDate();

  const formatDisplay = () => {
    if (!value) return mode === 'datetime' ? 'Select date & time' : 'Select date';
    const d = parseDate();
    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    if (mode === 'datetime') {
      const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${dateStr}, ${timeStr}`;
    }
    return dateStr;
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      if (mode === 'datetime' && pickerMode === 'date') {
        // After selecting date, show time picker (Android only)
        if (Platform.OS === 'android') {
          // Store selected date temporarily, open time picker
          const yyyy = selectedDate.getFullYear();
          const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const dd = String(selectedDate.getDate()).padStart(2, '0');
          // Use existing time or default 08:00
          const existingTime = value?.includes('T') ? value.split('T')[1] : '08:00';
          onChange(`${yyyy}-${mm}-${dd}T${existingTime}`);
          setTimeout(() => {
            setPickerMode('time');
            setShowPicker(true);
          }, 300);
          return;
        }
      }

      if (mode === 'datetime') {
        const yyyy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        const hh = String(selectedDate.getHours()).padStart(2, '0');
        const min = String(selectedDate.getMinutes()).padStart(2, '0');
        onChange(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
      } else {
        const yyyy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        onChange(`${yyyy}-${mm}-${dd}`);
      }
    }
  };

  const openPicker = () => {
    setPickerMode('date');
    setShowPicker(true);
  };

  const icon = mode === 'datetime' ? 'alarm-outline' : 'calendar-outline';

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>{label}</Text>
      <TouchableOpacity
        onPress={openPicker}
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
        <Ionicons name={icon} size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 15, color: value ? Colors.text : Colors.textMuted, flex: 1 }}>
          {formatDisplay()}
        </Text>
        <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
      {error && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{error}</Text>}

      {showPicker && (
        <>
          <DateTimePicker
            value={dateObj}
            mode={pickerMode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            maximumDate={maxDate}
            minimumDate={minDate}
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
