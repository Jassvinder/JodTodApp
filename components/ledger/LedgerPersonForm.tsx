import { useState } from 'react';
import { TextInput } from 'react-native';
import { Colors } from '../../constants/colors';
import { LedgerFormCard, ledgerInputStyle } from './LedgerUi';
import type { LedgerPersonData } from '../../services/ledger';

interface LedgerPersonFormProps {
  title: string;
  submitLabel: string;
  initial?: LedgerPersonData;
  saving: boolean;
  onSubmit: (values: LedgerPersonData) => void;
  onCancel: () => void;
}

// Add/edit form for a Lend & Borrow person.
export default function LedgerPersonForm({ title, submitLabel, initial, saving, onSubmit, onCancel }: LedgerPersonFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter a name.');
      return;
    }
    setError('');
    onSubmit({ name: name.trim(), phone: phone.trim() || null, note: note.trim() || null });
  };

  return (
    <LedgerFormCard title={title} submitLabel={submitLabel} saving={saving} error={error} onSubmit={handleSubmit} onCancel={onCancel}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Name, e.g. Raju, Sharma Ji"
        placeholderTextColor={Colors.textMuted}
        maxLength={100}
        autoFocus
        style={ledgerInputStyle}
      />
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone (optional)"
        placeholderTextColor={Colors.textMuted}
        keyboardType="phone-pad"
        maxLength={20}
        style={ledgerInputStyle}
      />
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Note (optional)"
        placeholderTextColor={Colors.textMuted}
        maxLength={255}
        style={ledgerInputStyle}
      />
    </LedgerFormCard>
  );
}
