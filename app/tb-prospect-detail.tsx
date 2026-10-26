import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { ACTIVITY_TYPE_META, OPEN_PROSPECT_STATUSES, TEAM_BUILDER_COLOR } from '../constants/teamBuilder';
import { teamBuilderService, type ProspectActivityData } from '../services/teamBuilder';
import { cancelFollowUpReminder, syncFollowUpReminder } from '../services/prospectReminders';
import { formatDateTime } from '../utils/format';
import UserAvatar from '../components/UserAvatar';
import BottomNav from '../components/BottomNav';
import ActivityForm from '../components/teamBuilder/ActivityForm';
import ContactActions from '../components/teamBuilder/ContactActions';
import ProspectStatusBadge from '../components/teamBuilder/ProspectStatusBadge';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import type { Prospect, ProspectActivity } from '../types/teamBuilder';

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
      <Ionicons name={icon} size={15} color={Colors.textSecondary} style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, fontSize: 13, color: Colors.textSecondary, marginLeft: 8 }}>{text}</Text>
    </View>
  );
}

export default function ProspectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const prospectId = Number(id);
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProspect = async () => {
    try {
      const response = await teamBuilderService.getProspect(prospectId);
      setProspect(response.data.data);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load prospect.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProspect();
    }, [prospectId]),
  );

  const handleLogActivity = async (values: ProspectActivityData) => {
    setSaving(true);
    try {
      const response = await teamBuilderService.addActivity(prospectId, values);
      setProspect(response.data.data);
      await syncFollowUpReminder(response.data.data);
      setShowForm(false);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to save activity.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = (activity: ProspectActivity) => {
    confirm.show({
      title: 'Delete Activity',
      message: `Delete "${ACTIVITY_TYPE_META[activity.type].label}" on ${formatDateTime(activity.done_at)}?`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          const response = await teamBuilderService.deleteActivity(prospectId, activity.id);
          setProspect(response.data.data);
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Failed to delete activity.', 'error');
        }
      },
    });
  };

  const handleDelete = () => {
    if (!prospect) return;
    confirm.show({
      title: 'Delete Prospect',
      message: `Delete ${prospect.name} and all their activity? This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await teamBuilderService.deleteProspect(prospectId);
          await cancelFollowUpReminder(prospectId);
          router.back();
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Failed to delete prospect.', 'error');
        }
      },
    });
  };

  const headerRight = () => prospect ? (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity onPress={() => router.push({ pathname: '/tb-prospect-form', params: { id: String(prospectId) } })} style={{ padding: 6 }} accessibilityLabel="Edit prospect">
        <Ionicons name="create-outline" size={20} color={TEAM_BUILDER_COLOR} />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDelete} style={{ padding: 6 }} accessibilityLabel="Delete prospect">
        <Ionicons name="trash-outline" size={20} color={Colors.error} />
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

  if (!prospect) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Text style={{ fontSize: 15, color: Colors.textSecondary }}>Prospect not found.</Text>
      </View>
    );
  }

  const isOpen = OPEN_PROSPECT_STATUSES.includes(prospect.status);
  const overdue = !!prospect.next_follow_up_at && new Date(prospect.next_follow_up_at).getTime() < Date.now();

  const renderHeader = () => (
    <View>
      <View style={{ backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <UserAvatar name={prospect.name} size={48} color={TEAM_BUILDER_COLOR} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text }}>{prospect.name}</Text>
            <View style={{ marginTop: 4 }}><ProspectStatusBadge status={prospect.status} /></View>
          </View>
          <ContactActions phone={prospect.phone} size={22} />
        </View>
        {!!prospect.phone && <InfoRow icon="call-outline" text={prospect.phone} />}
        {!!prospect.team_name && <InfoRow icon="git-network-outline" text={prospect.team_name} />}
        {!!prospect.source && <InfoRow icon="location-outline" text={`Met: ${prospect.source}`} />}
        {!!prospect.joined_at && <InfoRow icon="checkmark-circle-outline" text={`Joined on ${formatDateTime(prospect.joined_at)}`} />}
        {!!prospect.note && <InfoRow icon="document-text-outline" text={prospect.note} />}
      </View>

      {isOpen && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 12,
          backgroundColor: overdue ? '#fee2e2' : '#fef3c7',
        }}>
          <Ionicons name="alarm-outline" size={20} color={overdue ? Colors.error : TEAM_BUILDER_COLOR} />
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', marginLeft: 8, color: overdue ? '#991b1b' : '#92400e' }}>
            {prospect.next_follow_up_at
              ? `${overdue ? 'Follow-up overdue since' : 'Next follow-up:'} ${formatDateTime(prospect.next_follow_up_at)}`
              : 'No follow-up planned'}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => setShowForm(true)}
        style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: TEAM_BUILDER_COLOR, borderRadius: 12, paddingVertical: 13, marginBottom: 16 }}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', marginLeft: 6 }}>Log Activity</Text>
      </TouchableOpacity>

      {(prospect.activities?.length ?? 0) > 0 && (
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8 }}>
          HISTORY ({prospect.activities!.length})
        </Text>
      )}
    </View>
  );

  const renderActivity = ({ item }: { item: ProspectActivity }) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 8 }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={ACTIVITY_TYPE_META[item.type].icon} size={16} color={TEAM_BUILDER_COLOR} />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>{ACTIVITY_TYPE_META[item.type].label}</Text>
        <Text style={{ fontSize: 12, color: Colors.textMuted }}>{formatDateTime(item.done_at)}</Text>
        {!!item.note && <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>{item.note}</Text>}
      </View>
      <TouchableOpacity onPress={() => handleDeleteActivity(item)} hitSlop={8} style={{ padding: 4 }} accessibilityLabel="Delete activity">
        <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Stack.Screen options={{ title: prospect.name, headerRight }} />
      {/* The form is tall, so it gets its own scroll view instead of sitting above the list. */}
      {showForm ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
          <ActivityForm
            prospectName={prospect.name}
            currentStatus={prospect.status}
            saving={saving}
            onSubmit={handleLogActivity}
            onCancel={() => setShowForm(false)}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={prospect.activities ?? []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderActivity}
          ListHeaderComponent={renderHeader()}
          ListEmptyComponent={
            <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
              No activity yet. Tap "Log Activity" after you call, show the plan or follow up.
            </Text>
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProspect(); }} colors={[TEAM_BUILDER_COLOR]} />}
        />
      )}
      <BottomNav />
    </View>
  );
}
