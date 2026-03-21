import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { expenseService, type ExpenseListParams } from '../../../services/expenses';
import { formatCurrency, formatRelativeDate, percentChange } from '../../../utils/format';
import { Colors } from '../../../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useToast } from '../../../components/Toast';
import { useConfirm } from '../../../components/ConfirmDialog';
import type { Expense, Category, ExpenseSummary } from '../../../types/models';

export default function ExpensesScreen() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await expenseService.getCategories();
      setCategories(response.data.data);
    } catch {
      // Silent fail
    }
  };

  const fetchExpenses = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const params: ExpenseListParams = { page: pageNum };
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await expenseService.getExpenses(params);
      const { data, meta, summary: summaryData } = response.data;

      if (append) {
        setExpenses((prev) => [...prev, ...data]);
      } else {
        setExpenses(data);
      }
      setSummary(summaryData);
      setPage(meta.current_page);
      setLastPage(meta.last_page);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load expenses.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Refetch on focus (when coming back from add/edit)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setPage(1);
      fetchExpenses(1);
    }, [selectedCategory, searchQuery])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchExpenses(1);
  }, [selectedCategory, searchQuery]);

  const loadMore = () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    fetchExpenses(page + 1, true);
  };

  const handleSearch = () => {
    setSearchQuery(searchText);
    setLoading(true);
    setPage(1);
  };

  const handleCategorySelect = (catId: number | undefined) => {
    setSelectedCategory(catId);
    setShowCategoryPicker(false);
    setLoading(true);
    setPage(1);
  };

  const handleDelete = (expense: Expense) => {
    confirm.show({
      title: 'Delete Expense',
      message: `Are you sure you want to delete this expense of ${formatCurrency(expense.amount)}?`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await expenseService.deleteExpense(expense.id);
          setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Failed to delete expense.', 'error');
        }
      },
    });
  };

  const selectedCategoryName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name || 'Category'
    : 'All Categories';

  const pct = percentChange(summary?.monthly_total || 0, summary?.last_month_total || 0);

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      {/* Monthly Summary Card */}
      {summary && (
        <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 4 }}>This Month</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.text }}>{formatCurrency(summary.monthly_total)}</Text>
          {summary.last_month_total > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons
                name={pct > 0 ? 'trending-up' : pct < 0 ? 'trending-down' : 'remove-outline'}
                size={16}
                color={pct > 0 ? Colors.error : pct < 0 ? Colors.success : Colors.textMuted}
              />
              <Text style={{ fontSize: 13, color: pct > 0 ? Colors.error : pct < 0 ? Colors.success : Colors.textMuted, marginLeft: 4 }}>
                {pct !== 0 ? `${Math.abs(pct)}% ${pct > 0 ? 'more' : 'less'} than last month` : 'Same as last month'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Filters */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {/* Category Dropdown */}
        <TouchableOpacity
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.surface,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: selectedCategory ? Colors.primary : Colors.border,
            flex: 1,
          }}
        >
          <Ionicons name="funnel-outline" size={16} color={selectedCategory ? Colors.primary : Colors.textSecondary} />
          <Text
            style={{ fontSize: 14, color: selectedCategory ? Colors.primary : Colors.textSecondary, marginLeft: 6, flex: 1 }}
            numberOfLines={1}
          >
            {selectedCategoryName}
          </Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Search */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: Colors.surface,
          borderRadius: 10,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: Colors.border,
          flex: 1.5,
        }}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            placeholder="Search..."
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

      {/* Category Picker Dropdown */}
      {showCategoryPicker && (
        <View style={{ backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 12, overflow: 'hidden' }}>
          <TouchableOpacity
            onPress={() => handleCategorySelect(undefined)}
            style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: !selectedCategory ? '#eef2ff' : undefined }}
          >
            <Text style={{ fontSize: 14, color: !selectedCategory ? Colors.primary : Colors.text, fontWeight: !selectedCategory ? '600' : '400' }}>All Categories</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleCategorySelect(cat.id)}
              style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: selectedCategory === cat.id ? '#eef2ff' : undefined }}
            >
              <Text style={{ fontSize: 14, color: selectedCategory === cat.id ? Colors.primary : Colors.text, fontWeight: selectedCategory === cat.id ? '600' : '400' }}>
                {cat.icon ? `${cat.icon} ` : ''}{cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/(tabs)/expenses/edit', params: { id: item.id } })}
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
      {/* Category Icon */}
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
      }}>
        <Text style={{ fontSize: 18 }}>{item.category?.icon || '💰'}</Text>
      </View>

      {/* Description & Date */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.text }} numberOfLines={1}>
          {item.description || item.category?.name || 'Expense'}
        </Text>
        <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
          {item.category?.name ? `${item.category.name} · ` : ''}{formatRelativeDate(item.expense_date)}
        </Text>
      </View>

      {/* Amount */}
      <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text, marginLeft: 8 }}>
        {formatCurrency(item.amount)}
      </Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
      <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 }}>No expenses yet</Text>
      <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
        {searchQuery || selectedCategory ? 'Try changing your filters' : 'Tap + to add your first expense'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 16 }}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
      />

      {/* FAB - Add Expense */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/expenses/add')}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: Colors.primary,
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
