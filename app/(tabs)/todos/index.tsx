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
import { getTodoCategoriesWithDefaults, todoService, type TodoListParams } from '../../../services/todos';
import { cancelTodoReminder } from '../../../services/todoReminders';
import { Colors } from '../../../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import EmptyState from '../../../components/EmptyState';
import HeaderAddButton from '../../../components/HeaderAddButton';
import { useToast } from '../../../components/Toast';
import { useConfirm } from '../../../components/ConfirmDialog';
import ListSearchBar from '../../../components/ListSearchBar';
import TodoFilterBar from '../../../components/TodoFilterBar';
import TodoListItem from '../../../components/TodoListItem';
import { useAuthStore } from '../../../stores/authStore';
import TipAnchor from '../../../components/tips/TipAnchor';
import type { Todo, TodoCategory } from '../../../types/models';

type StatusFilter = 'all' | 'pending' | 'completed' | 'assigned_to_me' | 'assigned_by_me';
interface TodoFilters {
  status: StatusFilter;
  priority: string;
  category: number | undefined;
}

export default function TodosTabScreen() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

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
    if (todo.user_id !== currentUserId) {
      toast.show(`${todo.user?.name || 'Someone else'} assigned this task to you, so only they can delete it.`, 'info');
      return;
    }
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
      <TipAnchor id="todos.filters">
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
      </TipAnchor>
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

  const renderTodoItem = ({ item }: { item: Todo }) => (
    <TodoListItem
      item={item}
      currentUserId={currentUserId}
      onPress={() => router.push({ pathname: '/todos-detail', params: { id: item.id } })}
      onLongPress={() => handleDelete(item)}
      onToggle={() => handleToggle(item)}
    />
  );

  const renderEmpty = () => (
    statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter || searchQuery ? (
      <EmptyState icon="search-outline" title="No tasks match" text="Try changing your search or filters." />
    ) : (
      <EmptyState
        icon="checkbox-outline"
        title="Plan your first task"
        text="Add tasks with due dates and reminders, sort them by category, and assign them to friends from your contacts."
        actionLabel="Add Task"
        onAction={() => router.push('/todos-add')}
      />
    )
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
      <HeaderAddButton onPress={() => router.push('/todos-add')} helpScreen="todos" tipId="todos.add" />

    </View>
  );
}
