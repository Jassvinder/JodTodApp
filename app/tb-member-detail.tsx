import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { MEMBER_FLAG_META, TEAM_BUILDER_COLOR } from '../constants/teamBuilder';
import { teamBuilderService, type TargetData } from '../services/teamBuilder';
import TargetForm from '../components/teamBuilder/TargetForm';
import TargetProgress from '../components/teamBuilder/TargetProgress';
import { formatDateTime } from '../utils/format';
import UserAvatar from '../components/UserAvatar';
import BottomNav from '../components/BottomNav';
import ContactActions from '../components/teamBuilder/ContactActions';
import ProspectListItem from '../components/teamBuilder/ProspectListItem';
import { useToast } from '../components/Toast';
import type { TeamMemberDetail } from '../types/teamBuilder';

function Stat({ label, value, color = Colors.text }: { label: string; value: number; color?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: Colors.textSecondary, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

// Upline view of one team member: their flag, this week's work and their prospects (names, statuses, dates only).
export default function TeamMemberDetailScreen() {
  const { teamId, userId } = useLocalSearchParams<{ teamId: string; userId: string }>();
  const toast = useToast();
  const [member, setMember] = useState<TeamMemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);

  const handleSaveTarget = async (values: TargetData) => {
    setSavingTarget(true);
    try {
      const response = await teamBuilderService.setMemberTarget(Number(teamId), Number(userId), values);
      setMember((current) => (current ? { ...current, ...response.data.data } : current));
      setEditingTarget(false);
      toast.show(response.data.message, 'success');
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to save target.', 'error');
    } finally {
      setSavingTarget(false);
    }
  };

  const fetchMember = async () => {
    try {
      const response = await teamBuilderService.getTeamMember(Number(teamId), Number(userId));
      setMember(response.data.data);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMember();
    }, [teamId, userId]),
  );

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={TEAM_BUILDER_COLOR} />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Text style={{ fontSize: 15, color: Colors.textSecondary }}>Not found.</Text>
      </View>
    );
  }

  const flag = member.flag ? MEMBER_FLAG_META[member.flag] : null;

  const renderHeader = () => (
    <View>
      <View style={{ backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <UserAvatar name={member.name} avatarUrl={member.avatar_url} size={48} color={TEAM_BUILDER_COLOR} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text }}>{member.name}</Text>
            {!member.is_direct && !!member.sponsor_name && (
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Under {member.sponsor_name}</Text>
            )}
            <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
              {member.last_active_at ? `Last active ${formatDateTime(member.last_active_at)}` : 'No activity logged yet'}
            </Text>
          </View>
          <ContactActions phone={member.phone} size={22} />
        </View>

        <View style={{ flexDirection: 'row', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }}>
          <Stat label="Plans this week" value={member.plans_week} />
          <Stat label="Follow-ups this week" value={member.follow_ups_week} />
          <Stat label="Joined this week" value={member.joined_week} color="#16a34a" />
          <Stat label="Overdue follow-ups" value={member.overdue_follow_ups} color={member.overdue_follow_ups > 0 ? Colors.error : Colors.text} />
        </View>
      </View>

      <View style={{ backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>WEEKLY TARGET</Text>
        {member.target && (member.target.plans_per_week > 0 || member.target.follow_ups_per_week > 0) ? (
          <TargetProgress target={member.target} plans={member.plans_week} followUps={member.follow_ups_week} />
        ) : (
          <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 6 }}>No target yet.</Text>
        )}
        <TouchableOpacity onPress={() => setEditingTarget(true)} style={{ alignSelf: 'flex-start', marginTop: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: TEAM_BUILDER_COLOR }}>
            {member.target ? 'Change target' : `Set a target for ${member.name.split(' ')[0]}`}
          </Text>
        </TouchableOpacity>
      </View>

      {flag && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: flag.bg, borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <Ionicons name={flag.icon} size={20} color={flag.color} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: flag.color }}>{flag.label}</Text>
            <Text style={{ fontSize: 13, color: Colors.text, marginTop: 2 }}>{flag.text}</Text>
          </View>
        </View>
      )}

      {member.prospects.length > 0 && (
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8 }}>
          PROSPECTS ({member.prospects.length})
        </Text>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Stack.Screen options={{ title: member.name }} />
      {editingTarget && (
        <TargetForm
          title={`Weekly target for ${member.name}`}
          initial={member.target}
          saving={savingTarget}
          onSubmit={handleSaveTarget}
          onCancel={() => setEditingTarget(false)}
        />
      )}
      <FlatList
        data={member.prospects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ProspectListItem prospect={item} />}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
            {member.name} has not added any prospects to this team yet.
          </Text>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMember(); }} colors={[TEAM_BUILDER_COLOR]} />}
      />
      <BottomNav />
    </View>
  );
}
