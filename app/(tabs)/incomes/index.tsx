import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { incomeService, type IncomeListParams } from '../../../services/incomes';
import { formatCurrency, formatRelativeDate, percentChange } from '../../../utils/format';
import { Colors } from '../../../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useToast } from '../../../components/Toast';
import { useConfirm } from '../../../components/ConfirmDialog';
import ListSearchBar from '../../../components/ListSearchBar';
import type { Income, IncomeSummary } from '../../../types/models';

interface IncomeListHeaderProps {
  summary: IncomeSummary | null;
  searchText: string;
  searching: boolean;
  onSearchTextChange: (text: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
}

function IncomeListHeader({ summary, searchText, searching, onSearchTextChange, onSearch, onClearSearch }: IncomeListHeaderProps) {
  const pct = percentChange(summary?.this_month_income || 0, summary?.last_month_income || 0);

  return (
    <View>
      {summary && (
        <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 4 }}>This Month Income</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.success }}>{formatCurrency(summary.this_month_income)}</Text>
          {summary.last_month_income > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name={pct > 0 ? 'trending-up' : pct < 0 ? 'trending-down' : 'remove-outline'} size={16} color={pct > 0 ? Colors.success : pct < 0 ? Colors.error : Colors.textMuted} />
              <Text style={{ fontSize: 13, color: pct > 0 ? Colors.success : pct < 0 ? Colors.error : Colors.textMuted, marginLeft: 4 }}>
                {pct !== 0 ? `${Math.abs(pct)}% ${pct > 0 ? 'more' : 'less'} than last month` : 'Same as last month'}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border }}>
            <Ionicons name={summary.this_month_savings >= 0 ? 'wallet-outline' : 'warning-outline'} size={16} color={summary.this_month_savings >= 0 ? Colors.success : Colors.error} />
            <Text style={{ fontSize: 13, color: summary.this_month_savings >= 0 ? Colors.success : Colors.error, marginLeft: 4 }}>
              {summary.this_month_savings >= 0 ? `Savings: ${formatCurrency(summary.this_month_savings)}` : `Loss: ${formatCurrency(Math.abs(summary.this_month_savings))}`}
            </Text>
          </View>
        </View>
      )}
      <ListSearchBar value={searchText} placeholder="Search by source..." searching={searching} color={Colors.success} accessibilityLabel="Search incomes" onChangeText={onSearchTextChange} onSearch={onSearch} onClear={onClearSearch} />
    </View>
  );
}

export default function IncomesScreen() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [summary, setSummary] = useState<IncomeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const requestControllerRef = useRef<AbortController | null>(null);
  const searchQueryRef = useRef(searchQuery);

  const fetchIncomes = useCallback(async (pageNum: number = 1, append: boolean = false, search = searchQueryRef.current) => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    try {
      const params: IncomeListParams = { page: pageNum };
      if (search.trim()) params.search = search.trim();

      const response = await incomeService.getIncomes(params, controller.signal);
      if (controller.signal.aborted) return;
      const { data, meta, summary: summaryData } = response.data;

      if (append) {
        setIncomes((prev) => [...prev, ...data]);
      } else {
        setIncomes(data);
      }
      setSummary(summaryData);
      setPage(meta.current_page);
      setLastPage(meta.last_page);
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
        toast.show(message || 'Failed to load incomes.', 'error');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        setSearching(false);
      }
    }
  }, [toast]);

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  // Reset filters and refetch on focus (when coming back from add/edit)
  useFocusEffect(
    useCallback(() => {
      searchQueryRef.current = '';
      setSearchText('');
      setSearchQuery('');
      setSearching(false);
      setLoading(true);
      setPage(1);
      fetchIncomes(1, false, '');
    }, [fetchIncomes])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchIncomes(1);
  }, [fetchIncomes]);

  const loadMore = () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    fetchIncomes(page + 1, true);
  };

  const handleSearch = () => {
    const nextSearchQuery = searchText.trim();
    searchQueryRef.current = nextSearchQuery;
    setSearchQuery(nextSearchQuery);
    setSearching(true);
    setPage(1);
    fetchIncomes(1, false, nextSearchQuery);
  };

  const handleClearSearch = () => {
    searchQueryRef.current = '';
    setSearchText('');
    setSearchQuery('');
    setSearching(false);
    setPage(1);
    fetchIncomes(1, false, '');
  };

  const handleDelete = (income: Income) => {
    confirm.show({
      title: 'Delete Income',
      message: `Are you sure you want to delete this income of ${formatCurrency(income.amount)}?`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await incomeService.deleteIncome(income.id);
          setIncomes((prev) => prev.filter((i) => i.id !== income.id));
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Failed to delete income.', 'error');
        }
      },
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.success} />
      </View>
    );
  }

  const renderIncomeItem = ({ item }: { item: Income }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/(tabs)/incomes/edit', params: { id: item.id } })}
      onLongPress={() => handleDelete(item)}
      style={{
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Source Icon */}
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#dcfce7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
      }}>
        <Ionicons name="cash-outline" size={20} color={Colors.success} />
      </View>

      {/* Source & Description */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.text }} numberOfLines={1}>
          {item.source}
        </Text>
        <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }} numberOfLines={1}>
          {item.description ? `${item.description} · ` : ''}{formatRelativeDate(item.income_date)}
        </Text>
      </View>

      {/* Amount */}
      <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.success, marginLeft: 8 }}>
        +{formatCurrency(item.amount)}
      </Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
      <Ionicons name="trending-up-outline" size={48} color={Colors.textMuted} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 }}>No income yet</Text>
      <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
        {searchQuery ? 'Try changing your search' : 'Tap + to add your first income'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 16 }}>
        <ActivityIndicator size="small" color={Colors.success} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <FlatList
        data={incomes}
        renderItem={renderIncomeItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={<IncomeListHeader summary={summary} searchText={searchText} searching={searching} onSearchTextChange={setSearchText} onSearch={handleSearch} onClearSearch={handleClearSearch} />}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.success]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
      />

      {/* FAB - Add Income */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/incomes/add')}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: Colors.success,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
