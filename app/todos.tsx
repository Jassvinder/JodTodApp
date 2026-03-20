import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { todoService, type TodoListParams } from '../services/todos';
import { resolveUrl } from '../utils/format';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Todo, TodoCategory } from '../types/models';

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

type StatusFilter = 'all' | 'pending' | 'completed' | 'assigned_to_me' | 'assigned_by_me';

export default function TodosScreen() {
  const router = useRouter();
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
      Alert.alert('Error', error.response?.data?.message || 'Failed to load tasks.');
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
      Alert.alert('Error', error.response?.data?.message || 'Failed to update task.');
    }
  };

  const handleDelete = (todo: Todo) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${todo.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await todoService.deleteTodo(todo.id);
              setTodos((prev) => prev.filter((t) => t.id !== todo.id));
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete task.');
            }
          },
        },
      ]
    );
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

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
    { key: 'assigned_to_me', label: 'Assigned to me' },
    { key: 'assigned_by_me', label: 'Assigned by me' },
  ];

  const priorityFilters = [
    { key: 'all', label: 'All', color: Colors.textSecondary },
    { key: 'high', label: 'High', color: PRIORITY_COLORS.high },
    { key: 'medium', label: 'Medium', color: PRIORITY_COLORS.medium },
    { key: 'low', label: 'Low', color: PRIORITY_COLORS.low },
  ];

  const renderHeader = () => (
    <View>
      {/* Status Filter Chips */}
      <View style={{ marginBottom: 10 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusFilters}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { setStatusFilter(item.key); setLoading(true); setPage(1); }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: statusFilter === item.key ? Colors.primary : Colors.surface,
                borderWidth: 1,
                borderColor: statusFilter === item.key ? Colors.primary : Colors.border,
                marginRight: 8,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: statusFilter === item.key ? '#fff' : Colors.text }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Priority Filter Chips */}
      <View style={{ flexDirection: 'row', marginBottom: 10, gap: 8 }}>
        {priorityFilters.map((pf) => (
          <TouchableOpacity
            key={pf.key}
            onPress={() => { setPriorityFilter(pf.key); setLoading(true); setPage(1); }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: priorityFilter === pf.key ? pf.color : Colors.surface,
              borderWidth: 1,
              borderColor: priorityFilter === pf.key ? pf.color : Colors.border,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500', color: priorityFilter === pf.key ? '#fff' : pf.color }}>
              {pf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: 0, name: 'All', color: Colors.textSecondary }, ...categories]}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { setCategoryFilter(item.id === 0 ? undefined : item.id); setLoading(true); setPage(1); }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: (item.id === 0 && !categoryFilter) || categoryFilter === item.id ? Colors.primary : Colors.surface,
                  borderWidth: 1,
                  borderColor: (item.id === 0 && !categoryFilter) || categoryFilter === item.id ? Colors.primary : Colors.border,
                  marginRight: 8,
                }}
              >
                {item.id !== 0 && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color, marginRight: 6 }} />
                )}
                <Text style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: (item.id === 0 && !categoryFilter) || categoryFilter === item.id ? '#fff' : Colors.text,
                }}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
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
                {item.due_date}
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
  );
}
