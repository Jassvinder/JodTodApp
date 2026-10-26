import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { TEAM_BUILDER_COLOR } from '../../constants/teamBuilder';
import { teamBuilderService } from '../../services/teamBuilder';
import EmptyState from '../../components/EmptyState';
import ProspectListItem from '../../components/teamBuilder/ProspectListItem';
import { useToast } from '../../components/Toast';
import type { FollowUpsResponse, Prospect } from '../../types/teamBuilder';

const SECTIONS: { key: keyof FollowUpsResponse; title: string; color: string }[] = [
  { key: 'overdue', title: 'OVERDUE', color: Colors.error },
  { key: 'today', title: 'TODAY', color: TEAM_BUILDER_COLOR },
  { key: 'upcoming', title: 'UPCOMING', color: Colors.textSecondary },
];

export default function FollowUpsScreen() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<FollowUpsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFollowUps = async () => {
    try {
      const response = await teamBuilderService.getFollowUps();
      setData(response.data.data);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load follow-ups.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFollowUps();
    }, []),
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={TEAM_BUILDER_COLOR} />
      </View>
    );
  }

  const sections = SECTIONS
    .map((section) => ({ ...section, data: data?.[section.key] ?? [] }))
    .filter((section) => section.data.length > 0);

  return (
    <SectionList<Prospect, (typeof sections)[number]>
      style={{ flex: 1, backgroundColor: Colors.background }}
      sections={sections}
      keyExtractor={(item) => item.id.toString()}
      renderSectionHeader={({ section }) => (
        <Text style={{ fontSize: 13, fontWeight: '700', color: section.color, marginTop: 12, marginBottom: 8 }}>
          {section.title} ({section.data.length})
        </Text>
      )}
      renderItem={({ item }) => (
        <ProspectListItem prospect={item} onPress={() => router.push({ pathname: '/tb-prospect-detail', params: { id: String(item.id) } })} />
      )}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFollowUps(); }} colors={[TEAM_BUILDER_COLOR]} />}
      ListEmptyComponent={
        <EmptyState
          icon="alarm-outline"
          title="No follow-ups planned"
          text="Open a prospect and set the next follow-up date. It shows up here, and your phone reminds you on time."
          iconColor={TEAM_BUILDER_COLOR}
          iconBg="#fef3c7"
          actionLabel="Open Prospects"
          actionColor={TEAM_BUILDER_COLOR}
          onAction={() => router.push('/team-builder/prospects')}
        />
      }
    />
  );
}
