import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { todoService } from '../services/todos';
import { cancelTodoReminder } from '../services/todoReminders';
import { useAuthStore } from '../stores/authStore';
import { Colors } from '../constants/colors';
import { formatShortDate } from '../utils/format';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import UserAvatar from '../components/UserAvatar';
import BottomNav from '../components/BottomNav';
import type { Todo, TodoPerson } from '../types/models';

const PRIORITY_COLORS: Record<Todo['priority'], string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

function DetailRow({ icon, label, children }: { icon: keyof typeof Ionicons.glyphMap; label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border }}>
      <Ionicons name={icon} size={18} color={Colors.textMuted} style={{ width: 26 }} />
      <Text style={{ fontSize: 13, color: Colors.textSecondary, width: 100 }}>{label}</Text>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>{children}</View>
    </View>
  );
}

function PersonValue({ person, isMe }: { person: TodoPerson; isMe: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <UserAvatar name={person.name} avatarUrl={person.avatar_url} size={24} />
      <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text, marginLeft: 8 }}>
        {isMe ? 'You' : person.name}
      </Text>
    </View>
  );
}

export default function TodoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const todoId = Number(id);
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [todo, setTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchTodo = async () => {
    try {
      const response = await todoService.getTodo(todoId);
      setTodo(response.data.data);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load task.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTodo();
    }, [todoId])
  );

  const isOwner = !!todo && todo.user_id === currentUserId;

  const handleToggle = async () => {
    if (!todo) return;
    setToggling(true);
    try {
      const response = await todoService.toggleTodo(todo.id);
      setTodo(response.data.data);
      if (response.data.data.is_completed) await cancelTodoReminder(todo.id);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to update task.', 'error');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = () => {
    if (!todo) return;
    confirm.show({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${todo.title}"?`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await todoService.deleteTodo(todo.id);
          await cancelTodoReminder(todo.id);
          router.back();
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Failed to delete task.', 'error');
        }
      },
    });
  };

  const headerRight = () => todo ? (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/todos-edit', params: { id: todo.id } })}
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6 }}
        accessibilityLabel="Edit task"
      >
        <Ionicons name="create-outline" size={18} color={Colors.primary} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary, marginLeft: 4 }}>Edit</Text>
      </TouchableOpacity>
      {isOwner && (
        <TouchableOpacity onPress={handleDelete} style={{ padding: 6 }} accessibilityLabel="Delete task">
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      )}
    </View>
  ) : null;

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!todo) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Text style={{ fontSize: 15, color: Colors.textSecondary }}>Task not found.</Text>
      </View>
    );
  }

  const assignedToSomeoneElse = !!todo.assignee && todo.assignee.id !== todo.user_id;
  const assignedToMe = assignedToSomeoneElse && todo.assigned_to === currentUserId;
  const today = new Date().toISOString().split('T')[0];
  const dueDate = todo.due_date ? todo.due_date.slice(0, 10) : null;
  const overdue = !todo.is_completed && !!dueDate && dueDate < today;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Stack.Screen options={{ title: 'Task Details', headerRight }} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTodo(); }} colors={[Colors.primary]} />}
      >
        {assignedToMe && todo.user && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '15', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <Ionicons name="person-circle-outline" size={20} color={Colors.primary} />
            <Text style={{ flex: 1, fontSize: 13, color: Colors.text, marginLeft: 8 }}>
              <Text style={{ fontWeight: '700' }}>{todo.user.name}</Text> assigned this task to you
            </Text>
          </View>
        )}

        <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{
            fontSize: 18, fontWeight: '700', color: todo.is_completed ? Colors.textMuted : Colors.text,
            textDecorationLine: todo.is_completed ? 'line-through' : 'none', marginBottom: 12,
          }}>
            {todo.title}
          </Text>

          <DetailRow icon="checkmark-circle-outline" label="Status">
            <Text style={{ fontSize: 14, fontWeight: '600', color: todo.is_completed ? Colors.success : overdue ? Colors.error : Colors.warning }}>
              {todo.is_completed ? 'Completed' : overdue ? 'Overdue' : 'Pending'}
            </Text>
          </DetailRow>

          <DetailRow icon="flag-outline" label="Priority">
            <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: PRIORITY_COLORS[todo.priority] + '20' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: PRIORITY_COLORS[todo.priority] }}>
                {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
              </Text>
            </View>
          </DetailRow>

          <DetailRow icon="pricetag-outline" label="Category">
            {todo.category ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: todo.category.color, marginRight: 6 }} />
                <Text style={{ fontSize: 14, color: Colors.text }}>{todo.category.name}</Text>
              </View>
            ) : (
              <Text style={{ fontSize: 14, color: Colors.textMuted }}>None</Text>
            )}
          </DetailRow>

          <DetailRow icon="calendar-outline" label="Due Date">
            <Text style={{ fontSize: 14, color: dueDate ? (overdue ? Colors.error : Colors.text) : Colors.textMuted }}>
              {dueDate ? formatShortDate(dueDate) : 'No due date'}
            </Text>
          </DetailRow>

          <DetailRow icon="notifications-outline" label="Reminder">
            <Text style={{ fontSize: 14, color: todo.reminder_at ? Colors.text : Colors.textMuted }}>
              {todo.reminder_at
                ? new Date(todo.reminder_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'No reminder'}
            </Text>
          </DetailRow>

          {todo.user && (
            <DetailRow icon="person-outline" label={assignedToSomeoneElse ? 'Assigned By' : 'Created By'}>
              <PersonValue person={todo.user} isMe={todo.user.id === currentUserId} />
            </DetailRow>
          )}

          <DetailRow icon="people-outline" label="Assigned To">
            {assignedToSomeoneElse && todo.assignee ? (
              <PersonValue person={todo.assignee} isMe={todo.assignee.id === currentUserId} />
            ) : (
              <Text style={{ fontSize: 14, color: Colors.textMuted }}>Not assigned</Text>
            )}
          </DetailRow>

          <DetailRow icon="time-outline" label="Created On">
            <Text style={{ fontSize: 14, color: Colors.text }}>{formatShortDate(todo.created_at.slice(0, 10))}</Text>
          </DetailRow>
        </View>

        <TouchableOpacity
          onPress={handleToggle}
          disabled={toggling}
          style={{
            marginTop: 16, borderRadius: 12, padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
            backgroundColor: todo.is_completed ? Colors.surface : Colors.success,
            borderWidth: 1, borderColor: todo.is_completed ? Colors.border : Colors.success,
          }}
        >
          {toggling ? (
            <ActivityIndicator size="small" color={todo.is_completed ? Colors.primary : '#fff'} />
          ) : (
            <>
              <Ionicons name={todo.is_completed ? 'refresh-outline' : 'checkmark-done-outline'} size={18} color={todo.is_completed ? Colors.text : '#fff'} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: todo.is_completed ? Colors.text : '#fff', marginLeft: 8 }}>
                {todo.is_completed ? 'Mark as Pending' : 'Mark as Completed'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      <BottomNav />
    </View>
  );
}
