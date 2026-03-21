import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { incomeService, type IncomeListParams } from '../../../services/incomes';
import { formatCurrency, formatRelativeDate, percentChange } from '../../../utils/format';
import { Colors } from '../../../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useToast } from '../../../components/Toast';
import { useConfirm } from '../../../components/ConfirmDialog';
import type { Income, IncomeSummary } from '../../../types/models';

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

  const fetchIncomes = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const params: IncomeListParams = { page: pageNum };
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await incomeService.getIncomes(params);
      const { data, meta, summary: summaryData } = response.data;

      if (append) {
        setIncomes((prev) => [...prev, ...data]);
      } else {
        setIncomes(data);
      }
      setSummary(summaryData);
      setPage(meta.current_page);
      setLastPage(meta.last_page);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load incomes.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Refetch on focus (when coming back from add/edit)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setPage(1);
      fetchIncomes(1);
    }, [searchQuery])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchIncomes(1);
  }, [searchQuery]);

  const loadMore = () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    fetchIncomes(page + 1, true);
  };

  const handleSearch = () => {
    setSearchQuery(searchText);
    setLoading(true);
    setPage(1);
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

  const pct = percentChange(summary?.this_month_income || 0, summary?.last_month_income || 0);

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.success} />
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      {/* Monthly Summary Card */}
      {summary && (
        <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 4 }}>This Month Income</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.success }}>{formatCurrency(summary.this_month_income)}</Text>
          {summary.last_month_income > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons
                name={pct > 0 ? 'trending-up' : pct < 0 ? 'trending-down' : 'remove-outline'}
                size={16}
                color={pct > 0 ? Colors.success : pct < 0 ? Colors.error : Colors.textMuted}
              />
              <Text style={{ fontSize: 13, color: pct > 0 ? Colors.success : pct < 0 ? Colors.error : Colors.textMuted, marginLeft: 4 }}>
                {pct !== 0 ? `${Math.abs(pct)}% ${pct > 0 ? 'more' : 'less'} than last month` : 'Same as last month'}
              </Text>
            </View>
          )}
          {/* Savings indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border }}>
            <Ionicons
              name={summary.this_month_savings >= 0 ? 'wallet-outline' : 'warning-outline'}
              size={16}
              color={summary.this_month_savings >= 0 ? Colors.success : Colors.error}
            />
            <Text style={{ fontSize: 13, color: summary.this_month_savings >= 0 ? Colors.success : Colors.error, marginLeft: 4 }}>
              {summary.this_month_savings >= 0
                ? `Savings: ${formatCurrency(summary.this_month_savings)}`
                : `Loss: ${formatCurrency(Math.abs(summary.this_month_savings))}`}
            </Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 12,
      }}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          placeholder="Search by source..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          style={{ flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 10, paddingHorizontal: 8 }}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchText(''); setSearchQuery(''); setLoading(true); setPage(1); }}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

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
        ListHeaderComponent={renderHeader}
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
