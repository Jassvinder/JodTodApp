import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import DatePickerField from './DatePickerField';
import { Colors } from '../constants/colors';
import { formatLocalDateTime } from '../utils/format';

export interface RememberFormValues {
  name: string;
  note: string;
  done_on: string;
}

interface RememberFormProps {
  title: string;
  submitLabel: string;
  // Item forms show the name field; entry forms only need a date and note.
  showName?: boolean;
  showDate?: boolean;
  dateLabel?: string;
  initialName?: string;
  initialNote?: string;
  saving: boolean;
  onSubmit: (values: RememberFormValues) => void;
  onCancel: () => void;
}

const inputStyle = {
  backgroundColor: Colors.background,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 10,
  padding: 12,
  fontSize: 15,
  color: Colors.text,
  marginBottom: 12,
};

// Shared add/edit form for Remember items and their dated entries.
export default function RememberForm({
  title,
  submitLabel,
  showName = true,
  showDate = true,
  dateLabel = 'Done on',
  initialName = '',
  initialNote = '',
  saving,
  onSubmit,
  onCancel,
}: RememberFormProps) {
  const [name, setName] = useState(initialName);
  const [note, setNote] = useState(initialNote);
  const [doneOn, setDoneOn] = useState(formatLocalDateTime().split('T')[0]);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (showName && !name.trim()) {
      setError('Please enter a name.');
      return;
    }
    setError('');
    onSubmit({ name: name.trim(), note: note.trim(), done_on: doneOn });
  };

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

      {showName && (
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Gas Cylinder, Remote Battery"
          placeholderTextColor={Colors.textMuted}
          maxLength={100}
          autoFocus
          style={inputStyle}
        />
      )}

      {showDate && (
        <DatePickerField label={dateLabel} value={doneOn} onChange={setDoneOn} maxDate={new Date()} />
      )}

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Note (optional)"
        placeholderTextColor={Colors.textMuted}
        maxLength={255}
        style={inputStyle}
      />

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
          onPress={handleSubmit}
          disabled={saving}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 10,
            backgroundColor: Colors.primary, alignItems: 'center',
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#fff' }}>{submitLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
