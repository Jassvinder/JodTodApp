import { useEffect, useState, useCallback, useRef } from 'react';
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

interface ExpenseListHeaderProps {
  summary: ExpenseSummary | null;
  categories: Category[];
  selectedCategory?: number;
  selectedCategoryName: string;
  searchText: string;
  searching: boolean;
  showCategoryPicker: boolean;
  onToggleCategoryPicker: () => void;
  onCategorySelect: (categoryId: number | undefined) => void;
  onSearchTextChange: (text: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
}

function ExpenseListHeader({
  summary,
  categories,
  selectedCategory,
  selectedCategoryName,
  searchText,
  searching,
  showCategoryPicker,
  onToggleCategoryPicker,
  onCategorySelect,
  onSearchTextChange,
  onSearch,
  onClearSearch,
}: ExpenseListHeaderProps) {
  const pct = percentChange(summary?.monthly_total || 0, summary?.last_month_total || 0);

  return (
    <View>
      {summary && (
        <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 4 }}>This Month</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.text }}>{formatCurrency(summary.monthly_total)}</Text>
          {summary.last_month_total > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name={pct > 0 ? 'trending-up' : pct < 0 ? 'trending-down' : 'remove-outline'} size={16} color={pct > 0 ? Colors.error : pct < 0 ? Colors.success : Colors.textMuted} />
              <Text style={{ fontSize: 13, color: pct > 0 ? Colors.error : pct < 0 ? Colors.success : Colors.textMuted, marginLeft: 4 }}>
                {pct !== 0 ? `${Math.abs(pct)}% ${pct > 0 ? 'more' : 'less'} than last month` : 'Same as last month'}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TouchableOpacity onPress={onToggleCategoryPicker} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: selectedCategory ? Colors.primary : Colors.border, flex: 1 }}>
          <Ionicons name="funnel-outline" size={16} color={selectedCategory ? Colors.primary : Colors.textSecondary} />
          <Text style={{ fontSize: 14, color: selectedCategory ? Colors.primary : Colors.textSecondary, marginLeft: 6, flex: 1 }} numberOfLines={1}>{selectedCategoryName}</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 10, paddingLeft: 12, borderWidth: 1, borderColor: Colors.border, flex: 1.5 }}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            value={searchText}
            onChangeText={onSearchTextChange}
            onSubmitEditing={onSearch}
            placeholder="Search..."
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            style={{ flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 10, paddingHorizontal: 8 }}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={onClearSearch} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onSearch} disabled={searching} accessibilityLabel="Search expenses" style={{ alignSelf: 'stretch', width: 38, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary, borderTopRightRadius: 9, borderBottomRightRadius: 9, opacity: searching ? 0.7 : 1 }}>
            {searching ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="search" size={17} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>

      {showCategoryPicker && (
        <View style={{ backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 12, overflow: 'hidden' }}>
          <TouchableOpacity onPress={() => onCategorySelect(undefined)} style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: !selectedCategory ? '#eef2ff' : undefined }}>
            <Text style={{ fontSize: 14, color: !selectedCategory ? Colors.primary : Colors.text, fontWeight: !selectedCategory ? '600' : '400' }}>All Categories</Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity key={category.id} onPress={() => onCategorySelect(category.id)} style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: selectedCategory === category.id ? '#eef2ff' : undefined }}>
              <Text style={{ fontSize: 14, color: selectedCategory === category.id ? Colors.primary : Colors.text, fontWeight: selectedCategory === category.id ? '600' : '400' }}>{category.icon ? `${category.icon} ` : ''}{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ExpensesScreen() {
  const router = useRouter();
  const showToast = useToast((state) => state.show);
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
  const [searching, setSearching] = useState(false);
  const requestControllerRef = useRef<AbortController | null>(null);
  const filtersRef = useRef({ category: selectedCategory, search: searchQuery });

  const fetchCategories = async () => {
    try {
      const response = await expenseService.getCategories();
      setCategories(response.data.data);
    } catch {
      // Silent fail
    }
  };

  const fetchExpenses = useCallback(async (
    pageNum: number = 1,
    append: boolean = false,
    filters = filtersRef.current,
  ) => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      const params: ExpenseListParams = { page: pageNum };
      if (filters.category) params.category = filters.category;
      if (filters.search.trim()) params.search = filters.search.trim();

      const response = await expenseService.getExpenses(params, controller.signal);
      if (controller.signal.aborted) return;
      const { data, meta, summary: summaryData } = response.data;

      if (append) {
        setExpenses((prev) => [...prev, ...data]);
      } else {
        setExpenses(data);
      }
      setSummary(summaryData);
      setPage(meta.current_page);
      setLastPage(meta.last_page);
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
        showToast(message || 'Failed to load expenses.', 'error');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        setSearching(false);
      }
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  // Refetch on focus (when coming back from add/edit)
  useFocusEffect(
    useCallback(() => {
      setPage(1);
      fetchExpenses(1);
    }, [fetchExpenses])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchExpenses(1);
  }, [fetchExpenses]);

  const loadMore = () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    fetchExpenses(page + 1, true);
  };

  const handleSearch = () => {
    const nextSearchQuery = searchText.trim();
    const filters = { category: selectedCategory, search: nextSearchQuery };
    filtersRef.current = filters;
    setSearchQuery(nextSearchQuery);
    setSearching(true);
    setPage(1);
    fetchExpenses(1, false, filters);
  };

  const handleClearSearch = () => {
    const filters = { category: selectedCategory, search: '' };
    filtersRef.current = filters;
    setSearchText('');
    setSearchQuery('');
    setSearching(false);
    setPage(1);
    fetchExpenses(1, false, filters);
  };

  const handleCategorySelect = (catId: number | undefined) => {
    const filters = { category: catId, search: searchQuery };
    filtersRef.current = filters;
    setSelectedCategory(catId);
    setShowCategoryPicker(false);
    setPage(1);
    fetchExpenses(1, false, filters);
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
          showToast(error.response?.data?.message || 'Failed to delete expense.', 'error');
        }
      },
    });
  };

  const selectedCategoryName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name || 'Category'
    : 'All Categories';

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
        ListHeaderComponent={
          <ExpenseListHeader
            summary={summary}
            categories={categories}
            selectedCategory={selectedCategory}
            selectedCategoryName={selectedCategoryName}
            searchText={searchText}
            searching={searching}
            showCategoryPicker={showCategoryPicker}
            onToggleCategoryPicker={() => setShowCategoryPicker((visible) => !visible)}
            onCategorySelect={handleCategorySelect}
            onSearchTextChange={setSearchText}
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
          />
        }
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
