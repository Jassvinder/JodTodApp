import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { MEMBER_FLAG_META, TEAM_BUILDER_COLOR } from '../constants/teamBuilder';
import { teamBuilderService, type TeamData } from '../services/teamBuilder';
import BottomNav from '../components/BottomNav';
import ChipSelect, { type ChipOption } from '../components/ChipSelect';
import TeamCard from '../components/teamBuilder/TeamCard';
import TeamForm from '../components/teamBuilder/TeamForm';
import TeamMemberListItem from '../components/teamBuilder/TeamMemberListItem';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import type { TeamMemberFlag, TeamMembersResponse, TeamSummary } from '../types/teamBuilder';

type MemberFilter = TeamMemberFlag | 'all';

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Number(id);
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [members, setMembers] = useState<TeamMembersResponse | null>(null);
  const [filter, setFilter] = useState<MemberFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTeam = async () => {
    try {
      const [teamResponse, membersResponse] = await Promise.all([
        teamBuilderService.getTeam(teamId),
        teamBuilderService.getTeamMembers(teamId),
      ]);
      setTeam(teamResponse.data.data);
      setMembers(membersResponse.data.data);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load team.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTeam();
    }, [teamId]),
  );

  const handleSave = async (values: TeamData) => {
    setSaving(true);
    try {
      const response = await teamBuilderService.updateTeam(teamId, values);
      setTeam(response.data.data);
      setEditing(false);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    if (!team) return;
    const owner = team.is_owner;
    confirm.show({
      title: owner ? 'Delete Team' : 'Leave Team',
      message: owner ? `Delete "${team.name}"? This cannot be undone.` : `Leave "${team.name}"? You can join again with an invite code.`,
      confirmText: owner ? 'Delete' : 'Leave',
      danger: true,
      onConfirm: async () => {
        try {
          if (owner) await teamBuilderService.deleteTeam(teamId);
          else await teamBuilderService.leaveTeam(teamId);
          router.back();
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Something went wrong.', 'error');
        }
      },
    });
  };

  const headerRight = () => team ? (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {team.is_owner && (
        <TouchableOpacity onPress={() => setEditing(true)} style={{ padding: 6 }} accessibilityLabel="Edit team">
          <Ionicons name="create-outline" size={20} color={TEAM_BUILDER_COLOR} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={handleRemove} style={{ padding: 6 }} accessibilityLabel={team.is_owner ? 'Delete team' : 'Leave team'}>
        <Ionicons name={team.is_owner ? 'trash-outline' : 'exit-outline'} size={20} color={Colors.error} />
      </TouchableOpacity>
    </View>
  ) : null;

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={TEAM_BUILDER_COLOR} />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Text style={{ fontSize: 15, color: Colors.textSecondary }}>Team not found.</Text>
      </View>
    );
  }

  const counts = members?.counts;
  const filterOptions: ChipOption<MemberFilter>[] = [
    { key: 'all', label: 'Everyone', count: counts?.total ?? 0, color: TEAM_BUILDER_COLOR },
    { key: 'push', label: MEMBER_FLAG_META.push.label, count: counts?.push ?? 0, color: MEMBER_FLAG_META.push.color },
    { key: 'training', label: MEMBER_FLAG_META.training.label, count: counts?.training ?? 0, color: MEMBER_FLAG_META.training.color },
  ];
  const visible = (members?.members ?? []).filter((member) => filter === 'all' || member.flag === filter);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Stack.Screen options={{ title: team.name, headerRight }} />
      {editing && (
        <TeamForm
          title="Edit Team"
          submitLabel="Save"
          initial={{ name: team.name, company_name: team.company_name }}
          saving={saving}
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
        />
      )}
      <FlatList
        data={visible}
        keyExtractor={(item) => item.user_id.toString()}
        renderItem={({ item }) => (
          <TeamMemberListItem
            member={item}
            onPress={() => router.push({ pathname: '/tb-member-detail', params: { teamId: String(teamId), userId: String(item.user_id) } })}
          />
        )}
        ListHeaderComponent={
          <View>
            <TeamCard team={team} />
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/tb-announcements', params: { teamId: String(teamId) } })}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 12 }}
            >
              <Ionicons name="megaphone-outline" size={20} color={TEAM_BUILDER_COLOR} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text, marginLeft: 10 }}>Announcements</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
            {(counts?.total ?? 0) > 0 && (
              <View style={{ marginBottom: 12 }}>
                <ChipSelect options={filterOptions} value={filter} onChange={setFilter} scroll />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
            {(counts?.total ?? 0) === 0
              ? 'Nobody has joined under you yet. Tap Invite to share your code.'
              : 'Nobody here right now.'}
          </Text>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTeam(); }} colors={[TEAM_BUILDER_COLOR]} />}
      />
      <BottomNav />
    </View>
  );
}
