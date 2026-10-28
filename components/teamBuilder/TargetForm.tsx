import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { TEAM_BUILDER_COLOR } from '../../constants/teamBuilder';
import FormCard, { formInputStyle } from '../FormCard';
import type { TargetData } from '../../services/teamBuilder';
import type { WeeklyTarget } from '../../types/teamBuilder';

interface TargetFormProps {
  title: string;
  initial: WeeklyTarget | null;
  saving: boolean;
  onSubmit: (values: TargetData) => void;
  onCancel: () => void;
}

const toNumber = (value: string) => Math.min(500, parseInt(value.replace(/\D/g, '') || '0', 10));

// Weekly plans / follow-ups target, set by the user or by their upline.
export default function TargetForm({ title, initial, saving, onSubmit, onCancel }: TargetFormProps) {
  const [plans, setPlans] = useState(String(initial?.plans_per_week ?? 10));
  const [followUps, setFollowUps] = useState(String(initial?.follow_ups_per_week ?? 20));

  const field = (label: string, value: string, onChange: (text: string) => void) => (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={3}
        style={{ ...formInputStyle, fontSize: 18, fontWeight: '700', textAlign: 'center' }}
      />
    </View>
  );

  return (
    <FormCard
      title={title}
      submitLabel="Save"
      submitColor={TEAM_BUILDER_COLOR}
      saving={saving}
      onSubmit={() => onSubmit({ plans_per_week: toNumber(plans), follow_ups_per_week: toNumber(followUps) })}
      onCancel={onCancel}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {field('Plans per week', plans, setPlans)}
        {field('Follow-ups per week', followUps, setFollowUps)}
      </View>
      <Text style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 12 }}>Use 0 for no target.</Text>
    </FormCard>
  );
}
