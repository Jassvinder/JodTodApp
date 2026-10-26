import { useState } from 'react';
import { TextInput } from 'react-native';
import { Colors } from '../../constants/colors';
import { TEAM_BUILDER_COLOR } from '../../constants/teamBuilder';
import FormCard, { formInputStyle } from '../FormCard';
import type { TeamData } from '../../services/teamBuilder';

interface TeamFormProps {
  title: string;
  submitLabel: string;
  initial?: TeamData;
  saving: boolean;
  onSubmit: (values: TeamData) => void;
  onCancel: () => void;
}

// Create or rename a team.
export default function TeamForm({ title, submitLabel, initial, saving, onSubmit, onCancel }: TeamFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [companyName, setCompanyName] = useState(initial?.company_name ?? '');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Team name is required.');
      return;
    }
    onSubmit({ name: name.trim(), company_name: companyName.trim() || null });
  };

  return (
    <FormCard title={title} submitLabel={submitLabel} submitColor={TEAM_BUILDER_COLOR} saving={saving} error={error} onSubmit={handleSubmit} onCancel={onCancel}>
      <TextInput
        value={name}
        onChangeText={(text) => { setName(text); setError(''); }}
        placeholder="Team name, e.g. Rising Stars"
        placeholderTextColor={Colors.textMuted}
        maxLength={100}
        autoFocus
        style={formInputStyle}
      />
      <TextInput
        value={companyName}
        onChangeText={setCompanyName}
        placeholder="Company name (optional)"
        placeholderTextColor={Colors.textMuted}
        maxLength={100}
        style={formInputStyle}
      />
    </FormCard>
  );
}
