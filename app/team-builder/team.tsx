import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/colors';
import { TEAM_BUILDER_COLOR } from '../../constants/teamBuilder';
import { teamBuilderService, type TeamData } from '../../services/teamBuilder';
import EmptyState from '../../components/EmptyState';
import FormCard, { formInputStyle } from '../../components/FormCard';
import TeamCard from '../../components/teamBuilder/TeamCard';
import TeamForm from '../../components/teamBuilder/TeamForm';
import { useToast } from '../../components/Toast';
import type { TeamSummary } from '../../types/teamBuilder';

type FormMode = 'none' | 'create' | 'join';

export default function TeamScreen() {
  const router = useRouter();
  const toast = useToast();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState<FormMode>('none');
  const [inviteCode, setInviteCode] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTeams = async () => {
    try {
      const response = await teamBuilderService.getTeams();
      setTeams(response.data.data);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load teams.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTeams();
    }, []),
  );

  const openTeam = (team: TeamSummary) => router.push({ pathname: '/tb-team-detail', params: { id: String(team.id) } });

  const runSave = async (request: () => Promise<{ data: { data: TeamSummary; message: string } }>) => {
    setSaving(true);
    try {
      const response = await request();
      setForm('none');
      setInviteCode('');
      toast.show(response.data.message, 'success');
      fetchTeams();
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = (values: TeamData) => runSave(() => teamBuilderService.createTeam(values));

  const handleJoin = () => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 8) {
      toast.show('The invite code has 8 letters and numbers.', 'error');
      return;
    }
    runSave(() => teamBuilderService.joinTeam(code));
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={TEAM_BUILDER_COLOR} />
      </View>
    );
  }

  const actionButton = (label: string, icon: keyof typeof Ionicons.glyphMap, mode: FormMode, filled: boolean) => (
    <TouchableOpacity
      onPress={() => setForm(mode)}
      style={{
        flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 12,
        backgroundColor: filled ? TEAM_BUILDER_COLOR : Colors.surface, borderWidth: 1, borderColor: TEAM_BUILDER_COLOR,
      }}
    >
      <Ionicons name={icon} size={18} color={filled ? '#fff' : TEAM_BUILDER_COLOR} />
      <Text style={{ fontSize: 14, fontWeight: '700', color: filled ? '#fff' : TEAM_BUILDER_COLOR, marginLeft: 6 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Forms stay outside FlatList to prevent keyboard dismiss on re-render */}
      {form === 'create' && (
        <TeamForm title="Create Team" submitLabel="Create" saving={saving} onSubmit={handleCreate} onCancel={() => setForm('none')} />
      )}
      {form === 'join' && (
        <FormCard title="Join a Team" submitLabel="Join" submitColor={TEAM_BUILDER_COLOR} saving={saving} onSubmit={handleJoin} onCancel={() => setForm('none')}>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 10 }}>
            Enter your sponsor's invite code. They become your upline in this team.
          </Text>
          <TextInput
            value={inviteCode}
            onChangeText={(text) => setInviteCode(text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
            placeholder="e.g. AB12CD34"
            placeholderTextColor={Colors.textMuted}
            maxLength={8}
            autoCapitalize="characters"
            autoFocus
            style={{ ...formInputStyle, fontSize: 18, fontWeight: '700', letterSpacing: 2 }}
          />
        </FormCard>
      )}

      <FlatList
        data={teams}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TeamCard team={item} onPress={() => openTeam(item)} />}
        ListHeaderComponent={
          form === 'none' ? (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {actionButton('Join Team', 'enter-outline', 'join', true)}
              {actionButton('Create Team', 'add-circle-outline', 'create', false)}
            </View>
          ) : null
        }
        ListEmptyComponent={
          form === 'none' ? (
            <EmptyState
              icon="git-network-outline"
              title="Build your team here"
              text="Got an invite code from your sponsor? Tap Join Team. Starting your own team? Tap Create Team, then share your invite code. Everyone who joins with your code comes under you."
              iconColor={TEAM_BUILDER_COLOR}
              iconBg="#fef3c7"
            />
          ) : null
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTeams(); }} colors={[TEAM_BUILDER_COLOR]} />}
      />
    </View>
  );
}
