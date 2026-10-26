import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { PROSPECT_STATUSES, PROSPECT_STATUS_META, OPEN_PROSPECT_STATUSES, TEAM_BUILDER_COLOR } from '../constants/teamBuilder';
import { teamBuilderService } from '../services/teamBuilder';
import { syncFollowUpReminder } from '../services/prospectReminders';
import { formatLocalDateTime, toApiDateTime } from '../utils/format';
import { formInputStyle } from '../components/FormCard';
import ChipSelect from '../components/ChipSelect';
import DatePickerField from '../components/DatePickerField';
import { useToast } from '../components/Toast';
import type { ProspectStatus, TeamSummary } from '../types/teamBuilder';

const NO_TEAM = 'none';

function FieldLabel({ children }: { children: string }) {
  return <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>{children}</Text>;
}

// Add a prospect, or edit one when opened with ?id=.
export default function ProspectFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const prospectId = id ? Number(id) : null;
  const router = useRouter();
  const toast = useToast();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(!!prospectId);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [teamKey, setTeamKey] = useState<string>(NO_TEAM);
  const [status, setStatus] = useState<ProspectStatus>('new');
  const [followUpAt, setFollowUpAt] = useState('');
  const [note, setNote] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    teamBuilderService.getTeams()
      .then((response) => {
        setTeams(response.data.data);
        // New prospects go to the only team by default.
        if (!prospectId && response.data.data.length === 1) setTeamKey(String(response.data.data[0].id));
      })
      .catch(() => {});

    if (!prospectId) return;
    teamBuilderService.getProspect(prospectId)
      .then((response) => {
        const prospect = response.data.data;
        setName(prospect.name);
        setPhone(prospect.phone ?? '');
        setSource(prospect.source ?? '');
        setTeamKey(prospect.team_id ? String(prospect.team_id) : NO_TEAM);
        setStatus(prospect.status);
        setFollowUpAt(prospect.next_follow_up_at ? formatLocalDateTime(new Date(prospect.next_follow_up_at)) : '');
        setNote(prospect.note ?? '');
      })
      .catch((error: any) => toast.show(error.response?.data?.message || 'Failed to load prospect.', 'error'))
      .finally(() => setLoading(false));
  }, [prospectId]);

  const canFollowUp = OPEN_PROSPECT_STATUSES.includes(status);

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError('Name is required.');
      return;
    }
    setSaving(true);
    const data = {
      name: name.trim(),
      phone: phone.trim() || null,
      source: source.trim() || null,
      team_id: teamKey === NO_TEAM ? null : Number(teamKey),
      status,
      next_follow_up_at: canFollowUp ? toApiDateTime(followUpAt) : null,
      note: note.trim() || null,
    };
    try {
      const response = prospectId
        ? await teamBuilderService.updateProspect(prospectId, data)
        : await teamBuilderService.createProspect(data);
      await syncFollowUpReminder(response.data.data);
      if (prospectId) {
        router.back();
      } else {
        router.replace({ pathname: '/tb-prospect-detail', params: { id: String(response.data.data.id) } });
      }
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to save prospect.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={TEAM_BUILDER_COLOR} />
      </View>
    );
  }

  const inputStyle = { ...formInputStyle, backgroundColor: Colors.surface, marginBottom: 16 };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: prospectId ? 'Edit Prospect' : 'Add Prospect' }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <FieldLabel>Name *</FieldLabel>
        <TextInput
          value={name}
          onChangeText={(text) => { setName(text); setNameError(''); }}
          placeholder="e.g. Rahul Sharma"
          placeholderTextColor={Colors.textMuted}
          maxLength={100}
          style={{ ...inputStyle, marginBottom: nameError ? 4 : 16, borderColor: nameError ? Colors.error : Colors.border }}
        />
        {!!nameError && <Text style={{ color: Colors.error, fontSize: 12, marginBottom: 12 }}>{nameError}</Text>}

        <FieldLabel>Phone</FieldLabel>
        <TextInput value={phone} onChangeText={setPhone} placeholder="For call and WhatsApp" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" maxLength={20} style={inputStyle} />

        <FieldLabel>Where you met</FieldLabel>
        <TextInput value={source} onChangeText={setSource} placeholder="e.g. College friend, Facebook, referral" placeholderTextColor={Colors.textMuted} maxLength={100} style={inputStyle} />

        {teams.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <FieldLabel>Team</FieldLabel>
            <ChipSelect
              options={[{ key: NO_TEAM, label: 'No team' }, ...teams.map((team) => ({ key: String(team.id), label: team.name, color: TEAM_BUILDER_COLOR }))]}
              value={teamKey}
              onChange={setTeamKey}
            />
          </View>
        )}

        <View style={{ marginBottom: 8 }}>
          <FieldLabel>Status</FieldLabel>
          <ChipSelect
            options={PROSPECT_STATUSES.map((key) => ({ key, label: PROSPECT_STATUS_META[key].label, color: PROSPECT_STATUS_META[key].color }))}
            value={status}
            onChange={setStatus}
          />
        </View>

        {canFollowUp && (
          <DatePickerField label="Next follow-up" mode="datetime" value={followUpAt} onChange={setFollowUpAt} minDate={new Date()} />
        )}
        {canFollowUp && !!followUpAt && (
          <TouchableOpacity onPress={() => setFollowUpAt('')} style={{ alignSelf: 'flex-start', marginTop: -12, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: Colors.error }}>Clear follow-up</Text>
          </TouchableOpacity>
        )}

        <FieldLabel>Note</FieldLabel>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Anything to remember about this person"
          placeholderTextColor={Colors.textMuted}
          maxLength={500}
          multiline
          style={{ ...inputStyle, minHeight: 80, textAlignVertical: 'top' }}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ backgroundColor: TEAM_BUILDER_COLOR, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 }}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{prospectId ? 'Save' : 'Add Prospect'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
