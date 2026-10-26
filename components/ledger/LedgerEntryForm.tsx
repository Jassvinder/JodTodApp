import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { formatLocalDateTime } from '../../utils/format';
import DatePickerField from '../DatePickerField';
import { LEDGER_GET_COLOR, LEDGER_GIVE_COLOR } from './LedgerUi';
import FormCard, { formInputStyle } from '../FormCard';
import type { LedgerEntryData } from '../../services/ledger';
import type { LedgerEntryType } from '../../types/models';

interface LedgerEntryFormProps {
  personName: string;
  initial?: Partial<LedgerEntryData> & { type: LedgerEntryType };
  isEdit?: boolean;
  saving: boolean;
  onSubmit: (values: LedgerEntryData) => void;
  onCancel: () => void;
}

// Add/edit form for one "You gave" / "You got" entry.
export default function LedgerEntryForm({ personName, initial, isEdit = false, saving, onSubmit, onCancel }: LedgerEntryFormProps) {
  const [type, setType] = useState<LedgerEntryType>(initial?.type ?? 'gave');
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '');
  const [entryDate, setEntryDate] = useState(initial?.entry_date ?? formatLocalDateTime().split('T')[0]);
  const [note, setNote] = useState(initial?.note ?? '');
  const [error, setError] = useState('');

  const color = type === 'gave' ? LEDGER_GIVE_COLOR : LEDGER_GET_COLOR;

  const handleSubmit = () => {
    const value = parseFloat(amount);
    if (!amount.trim() || isNaN(value) || value <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    setError('');
    onSubmit({ type, amount: value, entry_date: entryDate, note: note.trim() || null });
  };

  const typeOption = (value: LedgerEntryType, label: string, optionColor: string) => (
    <TouchableOpacity
      onPress={() => setType(value)}
      style={{
        flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1,
        backgroundColor: type === value ? optionColor : Colors.background,
        borderColor: type === value ? optionColor : Colors.border,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '600', color: type === value ? '#fff' : optionColor }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <FormCard
      title={isEdit ? 'Edit Entry' : `New entry with ${personName}`}
      submitLabel={isEdit ? 'Save' : type === 'gave' ? 'Save "You Gave"' : 'Save "You Got"'}
      submitColor={color}
      saving={saving}
      error={error}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
        {typeOption('gave', 'You Gave', LEDGER_GIVE_COLOR)}
        {typeOption('got', 'You Got', LEDGER_GET_COLOR)}
      </View>
      <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 12 }}>
        {type === 'gave' ? `You gave money to ${personName} (or paid for them).` : `${personName} gave money to you (or paid you back).`}
      </Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="Amount (₹)"
        placeholderTextColor={Colors.textMuted}
        keyboardType="decimal-pad"
        autoFocus={!isEdit}
        style={{ ...formInputStyle, fontSize: 18, fontWeight: '600', color }}
      />
      <DatePickerField label="Date" value={entryDate} onChange={setEntryDate} maxDate={new Date()} />
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Note (optional), e.g. for rent, returned in cash"
        placeholderTextColor={Colors.textMuted}
        maxLength={255}
        style={formInputStyle}
      />
    </FormCard>
  );
}
