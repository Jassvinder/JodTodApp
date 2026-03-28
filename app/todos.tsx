import { useState, useCallback } from 'react';
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
import { todoService, type TodoListParams } from '../services/todos';
import { resolveUrl } from '../utils/format';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import BottomNav from '../components/BottomNav';
import type { Todo, TodoCategory } from '../types/models';

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

type StatusFilter = 'all' | 'pending' | 'completed' | 'assigned_to_me' | 'assigned_by_me';

function FilterDropdown({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: active ? Colors.primary : Colors.surface,
        borderWidth: 1, borderColor: active ? Colors.primary : Colors.border,
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '500', color: active ? '#fff' : Colors.text }} numberOfLines={1}>{label}</Text>
      <Ionicons name="chevron-down" size={14} color={active ? '#fff' : Colors.textMuted} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

function PickerModal({ visible, onClose, options, selected, onSelect }: {
  visible: boolean; onClose: () => void;
  options: { key: string; label: string; color?: string }[];
  selected: string | number | undefined;
  onSelect: (key: any) => void;
}) {
  if (!visible) return null;
  return (
    <TouchableOpacity
      activeOpacity={1} onPress={onClose}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 50, justifyContent: 'center', padding: 32 }}
    >
      <View style={{ backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden', maxHeight: 350 }}>
        <FlatList
          data={options}
          keyExtractor={(item) => String(item.key)}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { onSelect(item.key); onClose(); }}
              style={{
                flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: 1, borderBottomColor: Colors.border,
                backgroundColor: String(selected) === String(item.key) ? '#eef2ff' : undefined,
              }}
            >
              {item.color && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color, marginRight: 10 }} />}
              <Text style={{ fontSize: 14, flex: 1, fontWeight: String(selected) === String(item.key) ? '600' : '400', color: String(selected) === String(item.key) ? Colors.primary : Colors.text }}>{item.label}</Text>
              {String(selected) === String(item.key) && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
            </TouchableOpacity>
          )}
        />
      </View>
    </TouchableOpacity>
  );
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
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await todoService.getCategories();
      setCategories(response.data.data);
    } catch {
      // Silent fail
    }
  };

  const fetchTodos = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const params: TodoListParams = { page: pageNum };

      if (statusFilter === 'pending') params.status = 'pending';
      else if (statusFilter === 'completed') params.status = 'completed';
      else if (statusFilter === 'assigned_to_me') params.scope = 'assigned_to_me';
      else if (statusFilter === 'assigned_by_me') params.scope = 'assigned_by_me';

      if (priorityFilter !== 'all') params.priority = priorityFilter as 'low' | 'medium' | 'high';
      if (categoryFilter) params.category_id = categoryFilter;

      const response = await todoService.getTodos(params);
      const { data, meta } = response.data;

      if (append) {
        setTodos((prev) => [...prev, ...data]);
      } else {
        setTodos(data);
      }
      setPage(meta.current_page);
      setLastPage(meta.last_page);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load tasks.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
      setLoading(true);
      setPage(1);
      fetchTodos(1);
    }, [statusFilter, priorityFilter, categoryFilter])
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

  const handleToggle = async (todo: Todo) => {
    try {
      const response = await todoService.toggleTodo(todo.id);
      const updated = response.data.data;
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
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

  const statusLabel = statusOptions.find((s) => s.key === statusFilter)?.label || 'All Status';
  const priorityLabel = priorityOptions.find((p) => p.key === priorityFilter)?.label || 'All Priority';
  const categoryLabel = categoryFilter ? categories.find((c) => c.id === categoryFilter)?.name || 'Category' : 'All Categories';

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== undefined;

  const renderHeader = () => (
    <View>
      {/* Filter Dropdowns */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <FilterDropdown label={statusLabel} active={statusFilter !== 'all'} onPress={() => setShowStatusPicker(true)} />
        <FilterDropdown label={priorityLabel} active={priorityFilter !== 'all'} onPress={() => setShowPriorityPicker(true)} />
        {categories.length > 0 && (
          <FilterDropdown label={categoryLabel} active={!!categoryFilter} onPress={() => setShowCategoryPicker(true)} />
        )}
      </View>
      {hasActiveFilters && (
        <TouchableOpacity
          onPress={() => { setStatusFilter('all'); setPriorityFilter('all'); setCategoryFilter(undefined); setLoading(true); setPage(1); }}
          style={{ alignSelf: 'flex-start', marginBottom: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.error, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
        >
          <Ionicons name="close-circle" size={14} color="#fff" style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTodoItem = ({ item }: { item: Todo }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/todos-edit', params: { id: item.id } })}
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
                color={!item.is_completed && isOverdue(item.due_date) ? Colors.error : Colors.textMuted}
              />
              <Text style={{
                fontSize: 11,
                color: !item.is_completed && isOverdue(item.due_date) ? Colors.error : Colors.textMuted,
                marginLeft: 3,
                fontWeight: !item.is_completed && isOverdue(item.due_date) ? '600' : '400',
              }}>
                {new Date(item.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
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
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
      <Ionicons name="checkbox-outline" size={48} color={Colors.textMuted} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 }}>No tasks yet</Text>
      <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
        {statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter
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

      {/* Filter Picker Modals */}
      <PickerModal
        visible={showStatusPicker}
        onClose={() => setShowStatusPicker(false)}
        options={statusOptions.map((s) => ({ key: s.key, label: s.label }))}
        selected={statusFilter}
        onSelect={(key: StatusFilter) => { setStatusFilter(key); setLoading(true); setPage(1); }}
      />
      <PickerModal
        visible={showPriorityPicker}
        onClose={() => setShowPriorityPicker(false)}
        options={priorityOptions.map((p) => ({ key: p.key, label: p.label }))}
        selected={priorityFilter}
        onSelect={(key: string) => { setPriorityFilter(key); setLoading(true); setPage(1); }}
      />
      <PickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        options={[{ key: 'all', label: 'All Categories' }, ...categories.map((c) => ({ key: String(c.id), label: c.name, color: c.color }))]}
        selected={categoryFilter ? String(categoryFilter) : 'all'}
        onSelect={(key: string) => { setCategoryFilter(key === 'all' ? undefined : parseInt(key)); setLoading(true); setPage(1); }}
      />
      </View>
      <BottomNav />
    </View>
  );
}
