import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import {
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_META,
  OPEN_PROSPECT_STATUSES,
  PROSPECT_STATUSES,
  PROSPECT_STATUS_META,
  TEAM_BUILDER_COLOR,
} from '../../constants/teamBuilder';
import { toApiDateTime } from '../../utils/format';
import FormCard, { formInputStyle } from '../FormCard';
import ChipSelect from '../ChipSelect';
import DatePickerField from '../DatePickerField';
import type { ProspectActivityData } from '../../services/teamBuilder';
import type { ProspectActivityType, ProspectStatus } from '../../types/teamBuilder';

interface ActivityFormProps {
  prospectName: string;
  currentStatus: ProspectStatus;
  saving: boolean;
  onSubmit: (values: ProspectActivityData) => void;
  onCancel: () => void;
}

function Label({ children }: { children: string }) {
  return <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>{children}</Text>;
}

// Log what was done with a prospect, move their status and plan the next follow-up in one step.
export default function ActivityForm({ prospectName, currentStatus, saving, onSubmit, onCancel }: ActivityFormProps) {
  const [type, setType] = useState<ProspectActivityType>('follow_up');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<ProspectStatus>(currentStatus);
  const [followUpAt, setFollowUpAt] = useState('');
  const canFollowUp = OPEN_PROSPECT_STATUSES.includes(status);

  const handleTypeChange = (value: ProspectActivityType) => {
    setType(value);
    // Showing the plan to a new prospect moves them to "Plan Shown".
    if (value === 'plan_shown' && status === 'new') setStatus('plan_shown');
  };

  const handleSubmit = () => {
    onSubmit({
      type,
      note: note.trim() || null,
      status,
      // Empty means no follow-up is planned, so the old (done) follow-up is cleared.
      next_follow_up_at: canFollowUp ? toApiDateTime(followUpAt) : null,
    });
  };

  return (
    <FormCard title={`Log activity with ${prospectName}`} submitLabel="Save" submitColor={TEAM_BUILDER_COLOR} saving={saving} onSubmit={handleSubmit} onCancel={onCancel}>
      <Label>What did you do?</Label>
      <ChipSelect
        options={ACTIVITY_TYPES.map((key) => ({ key, label: ACTIVITY_TYPE_META[key].label, color: TEAM_BUILDER_COLOR }))}
        value={type}
        onChange={handleTypeChange}
      />
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Note (optional), e.g. asked to call after salary"
        placeholderTextColor={Colors.textMuted}
        maxLength={500}
        multiline
        style={{ ...formInputStyle, marginTop: 4, minHeight: 60, textAlignVertical: 'top' }}
      />

      <Label>Status</Label>
      <ChipSelect
        options={PROSPECT_STATUSES.map((key) => ({ key, label: PROSPECT_STATUS_META[key].label, color: PROSPECT_STATUS_META[key].color }))}
        value={status}
        onChange={setStatus}
      />

      {canFollowUp && (
        <View style={{ marginTop: 4 }}>
          <DatePickerField label="Next follow-up (leave empty if none)" mode="datetime" value={followUpAt} onChange={setFollowUpAt} minDate={new Date()} />
          {!!followUpAt && (
            <TouchableOpacity onPress={() => setFollowUpAt('')} style={{ alignSelf: 'flex-start', marginTop: -12, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: Colors.error }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </FormCard>
  );
}
