import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getTodoCategoriesWithDefaults, todoService, type TodoListParams } from '../services/todos';
import { cancelTodoReminder } from '../services/todoReminders';
import { resolveUrl } from '../utils/format';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import BottomNav from '../components/BottomNav';
import ListSearchBar from '../components/ListSearchBar';
import TodoFilterBar from '../components/TodoFilterBar';
import type { Todo, TodoCategory } from '../types/models';

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

type StatusFilter = 'all' | 'pending' | 'completed' | 'assigned_to_me' | 'assigned_by_me';
interface TodoFilters {
  status: StatusFilter;
  priority: string;
  category: number | undefined;
}

export default function TodosScreen() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const requestControllerRef = useRef<AbortController | null>(null);
  const searchQueryRef = useRef(searchQuery);

  const fetchCategories = async () => {
    try {
      const response = await getTodoCategoriesWithDefaults();
      setCategories(response.data.data);
    } catch {
      // Silent fail
    }
  };

  const fetchTodos = async (pageNum: number = 1, append: boolean = false, search = searchQueryRef.current, filters?: TodoFilters) => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    try {
      const params: TodoListParams = { page: pageNum };

      const activeFilters = filters || { status: statusFilter, priority: priorityFilter, category: categoryFilter };
      if (activeFilters.status === 'pending') params.status = 'pending';
      else if (activeFilters.status === 'completed') params.status = 'completed';
      else if (activeFilters.status === 'assigned_to_me') params.scope = 'assigned_to_me';
      else if (activeFilters.status === 'assigned_by_me') params.scope = 'assigned_by_me';

      if (activeFilters.priority !== 'all') params.priority = activeFilters.priority as 'low' | 'medium' | 'high';
      if (activeFilters.category) params.category_id = activeFilters.category;
      if (search.trim()) params.search = search.trim();

      const response = await todoService.getTodos(params, controller.signal);
      if (controller.signal.aborted) return;
      const { data, meta } = response.data;

      if (append) {
        setTodos((prev) => [...prev, ...data]);
      } else {
        setTodos(data);
      }
      setPage(meta.current_page);
      setLastPage(meta.last_page);
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
        toast.show(message || 'Failed to load tasks.', 'error');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        setSearching(false);
      }
    }
  };

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
      setStatusFilter('all');
      setPriorityFilter('all');
      setCategoryFilter(undefined);
      searchQueryRef.current = '';
      setSearchText('');
      setSearchQuery('');
      setLoading(true);
      setPage(1);
      fetchTodos(1, false, '', { status: 'all', priority: 'all', category: undefined });
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchTodos(1);
  }, [statusFilter, priorityFilter, categoryFilter]);

  const loadMore = () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    fetchTodos(page + 1, true);
  };

  const handleSearch = () => {
    const nextSearchQuery = searchText.trim();
    searchQueryRef.current = nextSearchQuery;
    setSearchQuery(nextSearchQuery);
    setSearching(true);
    setPage(1);
    fetchTodos(1, false, nextSearchQuery);
  };

  const handleClearSearch = () => {
    searchQueryRef.current = '';
    setSearchText('');
    setSearchQuery('');
    setSearching(false);
    setPage(1);
    fetchTodos(1, false, '');
  };

  const handleToggle = async (todo: Todo) => {
    try {
      const response = await todoService.toggleTodo(todo.id);
      const updated = response.data.data;
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
      if (updated.is_completed) await cancelTodoReminder(todo.id);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to update task.', 'error');
    }
  };

  const handleDelete = (todo: Todo) => {
    confirm.show({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${todo.title}"?`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await todoService.deleteTodo(todo.id);
          await cancelTodoReminder(todo.id);
          setTodos((prev) => prev.filter((t) => t.id !== todo.id));
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Failed to delete task.', 'error');
        }
      },
    });
  };

  const isOverdue = (dueDate: string | null): boolean => {
    if (!dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  };

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const statusOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All Status' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
    { key: 'assigned_to_me', label: 'Assigned to me' },
    { key: 'assigned_by_me', label: 'Assigned by me' },
  ];

  const priorityOptions = [
    { key: 'all', label: 'All Priority' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' },
  ];

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== undefined;

  const renderHeader = () => (
    <View>
      <TodoFilterBar
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        categories={categories}
        status={statusFilter}
        priority={priorityFilter}
        categoryId={categoryFilter}
        onStatusChange={(value) => { const nextStatus = value as StatusFilter; setStatusFilter(nextStatus); setLoading(true); setPage(1); fetchTodos(1, false, searchQueryRef.current, { status: nextStatus, priority: priorityFilter, category: categoryFilter }); }}
        onPriorityChange={(value) => { setPriorityFilter(value); setLoading(true); setPage(1); fetchTodos(1, false, searchQueryRef.current, { status: statusFilter, priority: value, category: categoryFilter }); }}
        onCategoryChange={(value) => { setCategoryFilter(value); setLoading(true); setPage(1); fetchTodos(1, false, searchQueryRef.current, { status: statusFilter, priority: priorityFilter, category: value }); }}
      />
      {hasActiveFilters && (
        <TouchableOpacity
          onPress={() => { setStatusFilter('all'); setPriorityFilter('all'); setCategoryFilter(undefined); setLoading(true); setPage(1); fetchTodos(1, false, searchQueryRef.current, { status: 'all', priority: 'all', category: undefined }); }}
          style={{ alignSelf: 'flex-start', marginBottom: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.error, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
        >
          <Ionicons name="close-circle" size={14} color="#fff" style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTodoItem = ({ item }: { item: Todo }) => {
    const overdue = !item.is_completed && isOverdue(item.due_date);

    return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/todos-edit', params: { id: item.id } })}
      onLongPress={() => handleDelete(item)}
      style={{
        backgroundColor: overdue ? '#fff7f7' : Colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: overdue ? '#fecaca' : Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Checkbox */}
      <TouchableOpacity
        onPress={() => handleToggle(item)}
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: item.is_completed ? Colors.success : Colors.border,
          backgroundColor: item.is_completed ? Colors.success : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        {item.is_completed && <Ionicons name="checkmark" size={14} color="#fff" />}
      </TouchableOpacity>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '500',
            color: item.is_completed ? Colors.textMuted : Colors.text,
            textDecorationLine: item.is_completed ? 'line-through' : 'none',
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 8 }}>
          {/* Priority Badge */}
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 10,
            backgroundColor: PRIORITY_COLORS[item.priority] + '20',
          }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: PRIORITY_COLORS[item.priority] }}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </Text>
          </View>

          {/* Category */}
          {item.category && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.category.color, marginRight: 4 }} />
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{item.category.name}</Text>
            </View>
          )}

          {/* Due Date */}
          {item.due_date && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="calendar-outline"
                size={11}
                color={overdue ? Colors.error : Colors.textMuted}
              />
              <Text style={{
                fontSize: 11,
                color: overdue ? Colors.error : Colors.textMuted,
                marginLeft: 3,
                fontWeight: overdue ? '600' : '400',
              }}>
                {new Date(item.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            </View>
          )}
          {item.reminder_at && <Ionicons name="notifications-outline" size={14} color={Colors.primary} accessibilityLabel="Reminder set" />}
          {overdue && (
            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: '#fee2e2' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.error }}>Overdue</Text>
            </View>
          )}
        </View>
      </View>

      {/* Assigned User Avatar */}
      {item.assigned_user && (
        <View style={{ marginLeft: 8 }}>
          {item.assigned_user.avatar_url ? (
            <Image
              source={{ uri: resolveUrl(item.assigned_user.avatar_url)! }}
              style={{ width: 28, height: 28, borderRadius: 14 }}
            />
          ) : (
            <View style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: Colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                {getInitials(item.assigned_user.name)}
              </Text>
            </View>
          )}
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
      <Ionicons name="checkbox-outline" size={48} color={Colors.textMuted} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 }}>No tasks yet</Text>
      <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
        {statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter || searchQuery
          ? 'Try changing your filters'
          : 'Tap + to add your first task'}
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
      <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <ListSearchBar value={searchText} placeholder="Search tasks..." searching={searching} accessibilityLabel="Search tasks" onChangeText={setSearchText} onSearch={handleSearch} onClear={handleClearSearch} />
      </View>
      <FlatList
        data={todos}
        renderItem={renderTodoItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
      />

      {/* FAB - Add Todo */}
      <TouchableOpacity
        onPress={() => router.push('/todos-add')}
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
      <BottomNav />
    </View>
  );
}
