import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/colors';
import { PROSPECT_STATUSES, PROSPECT_STATUS_META, TEAM_BUILDER_COLOR } from '../../constants/teamBuilder';
import { teamBuilderService } from '../../services/teamBuilder';
import HeaderAddButton from '../../components/HeaderAddButton';
import EmptyState from '../../components/EmptyState';
import ChipSelect, { type ChipOption } from '../../components/ChipSelect';
import ProspectListItem from '../../components/teamBuilder/ProspectListItem';
import { useToast } from '../../components/Toast';
import type { Prospect, ProspectStatus, ProspectStatusCounts } from '../../types/teamBuilder';

type StatusFilter = ProspectStatus | 'all';

export default function ProspectsScreen() {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ status?: ProspectStatus }>();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [counts, setCounts] = useState<ProspectStatusCounts | null>(null);
  const [filter, setFilter] = useState<StatusFilter>(params.status ?? 'all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // The dashboard opens this tab with a status; the tab stays mounted, so follow param changes.
  useEffect(() => {
    if (params.status) setFilter(params.status);
  }, [params.status]);

  const fetchProspects = async () => {
    try {
      const response = await teamBuilderService.getProspects();
      setProspects(response.data.data.prospects);
      setCounts(response.data.data.status_counts);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load prospects.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProspects();
    }, []),
  );

  const total = counts ? Object.values(counts).reduce((sum, value) => sum + value, 0) : 0;
  const filterOptions: ChipOption<StatusFilter>[] = [
    { key: 'all', label: 'All', count: total, color: TEAM_BUILDER_COLOR },
    ...PROSPECT_STATUSES.map((status) => ({
      key: status,
      label: PROSPECT_STATUS_META[status].label,
      count: counts?.[status] ?? 0,
      color: PROSPECT_STATUS_META[status].color,
    })),
  ];

  const query = search.trim().toLowerCase();
  const visible = prospects.filter((prospect) =>
    (filter === 'all' || prospect.status === filter)
    && (!query || prospect.name.toLowerCase().includes(query) || (prospect.phone ?? '').includes(query)),
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={TEAM_BUILDER_COLOR} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <HeaderAddButton label="Add" color={TEAM_BUILDER_COLOR} onPress={() => router.push('/tb-prospect-form')} />

      <View style={{ padding: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 10, marginBottom: 10 }}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or phone"
            placeholderTextColor={Colors.textMuted}
            style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 15, color: Colors.text }}
            accessibilityLabel="Search prospects"
          />
          {!!search && <Ionicons name="close-circle" size={18} color={Colors.textMuted} onPress={() => setSearch('')} />}
        </View>
        <ChipSelect options={filterOptions} value={filter} onChange={setFilter} scroll />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProspectListItem prospect={item} onPress={() => router.push({ pathname: '/tb-prospect-detail', params: { id: String(item.id) } })} />
        )}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProspects(); }} colors={[TEAM_BUILDER_COLOR]} />}
        ListEmptyComponent={
          total === 0 ? (
            <EmptyState
              icon="person-add-outline"
              title="Add the people you show the plan to"
              text="Keep each prospect's status, notes and next follow-up in one place, and get a reminder when it is time to call."
              iconColor={TEAM_BUILDER_COLOR}
              iconBg="#fef3c7"
              actionLabel="Add First Prospect"
              actionColor={TEAM_BUILDER_COLOR}
              onAction={() => router.push('/tb-prospect-form')}
            />
          ) : (
            <EmptyState icon="search-outline" title="No prospects match" text="Try another name or status." />
          )
        }
      />
    </View>
  );
}
