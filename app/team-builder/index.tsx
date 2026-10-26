import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/colors';
import { PROSPECT_STATUSES, PROSPECT_STATUS_META, TEAM_BUILDER_COLOR } from '../../constants/teamBuilder';
import { teamBuilderService } from '../../services/teamBuilder';
import { useAuthStore } from '../../stores/authStore';
import HeaderAddButton from '../../components/HeaderAddButton';
import EmptyState from '../../components/EmptyState';
import type { TeamBuilderDashboard } from '../../types/teamBuilder';

function StatTile({ label, value, icon, color }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={{ width: '31%', flexGrow: 1, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 10 }}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: Colors.textSecondary }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginTop: 20, marginBottom: 8 }}>{children}</Text>;
}

export default function TeamBuilderDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<TeamBuilderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const response = await teamBuilderService.getDashboard();
      setData(response.data.data);
    } catch {
      // Keep the last data; pull to refresh retries.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={TEAM_BUILDER_COLOR} />
      </View>
    );
  }

  const openFollowUps = () => router.push('/team-builder/follow-ups');
  const week = data?.week;
  const followUps = data?.follow_ups;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[TEAM_BUILDER_COLOR]} />}
    >
      <HeaderAddButton label="Prospect" color={TEAM_BUILDER_COLOR} onPress={() => router.push('/tb-prospect-form')} />

      <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.text }}>Hi, {user?.name?.split(' ')[0]}!</Text>
      <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>Your network work at a glance</Text>

      {/* Follow-up alerts */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <TouchableOpacity onPress={openFollowUps} activeOpacity={0.8} style={{ flex: 1, backgroundColor: '#fee2e2', borderRadius: 12, padding: 14 }}>
          <Text style={{ fontSize: 12, color: '#991b1b' }}>Overdue follow-ups</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.error, marginTop: 2 }}>{followUps?.overdue ?? 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openFollowUps} activeOpacity={0.8} style={{ flex: 1, backgroundColor: '#fef3c7', borderRadius: 12, padding: 14 }}>
          <Text style={{ fontSize: 12, color: '#92400e' }}>Due today</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: TEAM_BUILDER_COLOR, marginTop: 2 }}>{followUps?.today ?? 0}</Text>
        </TouchableOpacity>
      </View>

      <SectionTitle>THIS WEEK</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <StatTile label="Plans shown" value={week?.plans_shown ?? 0} icon="easel-outline" color="#7c3aed" />
        <StatTile label="Follow-ups" value={week?.follow_ups ?? 0} icon="repeat-outline" color={TEAM_BUILDER_COLOR} />
        <StatTile label="Calls" value={week?.calls ?? 0} icon="call-outline" color="#2563eb" />
        <StatTile label="New prospects" value={week?.new_prospects ?? 0} icon="person-add-outline" color="#0891b2" />
        <StatTile label="Meetings" value={week?.meetings ?? 0} icon="people-outline" color="#db2777" />
        <StatTile label="Joined" value={week?.joined ?? 0} icon="checkmark-circle-outline" color="#16a34a" />
      </View>

      <SectionTitle>MY PROSPECTS</SectionTitle>
      <View style={{ backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border }}>
        {PROSPECT_STATUSES.map((status, index) => (
          <TouchableOpacity
            key={status}
            onPress={() => router.push({ pathname: '/team-builder/prospects', params: { status } })}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: index > 0 ? 1 : 0, borderTopColor: Colors.border }}
          >
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PROSPECT_STATUS_META[status].color }} />
            <Text style={{ flex: 1, fontSize: 14, color: Colors.text, marginLeft: 10 }}>{PROSPECT_STATUS_META[status].label}</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text, marginRight: 4 }}>{data?.pipeline[status] ?? 0}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <SectionTitle>MY TEAMS</SectionTitle>
      {data?.teams.length ? (
        data.teams.map((team) => (
          <TouchableOpacity
            key={team.id}
            onPress={() => router.push({ pathname: '/tb-team-detail', params: { id: String(team.id) } })}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 8 }}
          >
            <Ionicons name="git-network-outline" size={20} color={TEAM_BUILDER_COLOR} />
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text, marginLeft: 10 }}>{team.name}</Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary, marginRight: 4 }}>{team.downline_count} in downline</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))
      ) : (
        <EmptyState
          icon="git-network-outline"
          title="You are not in a team yet"
          text="Create your own team, or join your sponsor's team with their invite code."
          iconColor={TEAM_BUILDER_COLOR}
          iconBg="#fef3c7"
          actionLabel="Go to Team"
          actionColor={TEAM_BUILDER_COLOR}
          onAction={() => router.push('/team-builder/team')}
        />
      )}
    </ScrollView>
  );
}
