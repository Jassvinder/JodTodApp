import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { TEAM_BUILDER_COLOR } from '../constants/teamBuilder';
import { teamBuilderService, type TeamData } from '../services/teamBuilder';
import { formatShortDate } from '../utils/format';
import UserAvatar from '../components/UserAvatar';
import BottomNav from '../components/BottomNav';
import TeamCard from '../components/teamBuilder/TeamCard';
import TeamForm from '../components/teamBuilder/TeamForm';
import ContactActions from '../components/teamBuilder/ContactActions';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import type { TeamDetail, TeamDirectMember } from '../types/teamBuilder';

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Number(id);
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTeam = async () => {
    try {
      const response = await teamBuilderService.getTeam(teamId);
      setTeam(response.data.data);
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
      await teamBuilderService.updateTeam(teamId, values);
      setEditing(false);
      fetchTeam();
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

  const renderMember = ({ item }: { item: TeamDirectMember }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 8 }}>
      <UserAvatar name={item.name} avatarUrl={item.avatar_url} size={40} color={TEAM_BUILDER_COLOR} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text }} numberOfLines={1}>{item.name}</Text>
        <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>
          Joined {formatShortDate(item.joined_at.slice(0, 10))} · {item.direct_count} direct · {item.downline_count} total
        </Text>
      </View>
      <ContactActions phone={item.phone} />
    </View>
  );

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
        data={team.direct_members}
        keyExtractor={(item) => item.user_id.toString()}
        renderItem={renderMember}
        ListHeaderComponent={
          <View>
            <TeamCard team={team} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8 }}>
              MY DIRECT TEAM ({team.direct_members.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
            Nobody has joined with your invite code yet. Tap Invite to share it.
          </Text>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTeam(); }} colors={[TEAM_BUILDER_COLOR]} />}
      />
      <BottomNav />
    </View>
  );
}
