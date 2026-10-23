import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import UserAvatar from './UserAvatar';
import type { Todo } from '../types/models';

const PRIORITY_COLORS: Record<Todo['priority'], string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

interface TodoListItemProps {
  item: Todo;
  currentUserId?: number;
  onPress: () => void;
  onLongPress: () => void;
  onToggle: () => void;
}

export default function TodoListItem({ item, currentUserId, onPress, onLongPress, onToggle }: TodoListItemProps) {
  const today = new Date().toISOString().split('T')[0];
  const overdue = !item.is_completed && !!item.due_date && item.due_date < today;
  const assignedToOther = !!item.assignee && item.assignee.id !== item.user_id;
  // Task someone else created and assigned to the current user.
  const assignedByName = assignedToOther && item.assigned_to === currentUserId ? item.user?.name : undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        backgroundColor: overdue ? '#fff7f7' : Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: overdue ? '#fecaca' : Colors.border, flexDirection: 'row', alignItems: 'center',
      }}
    >
      <TouchableOpacity
        onPress={onToggle}
        style={{
          width: 24, height: 24, borderRadius: 12, borderWidth: 2,
          borderColor: item.is_completed ? Colors.success : Colors.border,
          backgroundColor: item.is_completed ? Colors.success : 'transparent',
          justifyContent: 'center', alignItems: 'center', marginRight: 12,
        }}
      >
        {item.is_completed && <Ionicons name="checkmark" size={14} color="#fff" />}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15, fontWeight: '500',
            color: item.is_completed ? Colors.textMuted : Colors.text,
            textDecorationLine: item.is_completed ? 'line-through' : 'none',
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 8 }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: PRIORITY_COLORS[item.priority] + '20' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: PRIORITY_COLORS[item.priority] }}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </Text>
          </View>
          {item.category && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.category.color, marginRight: 4 }} />
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{item.category.name}</Text>
            </View>
          )}
          {item.due_date && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={11} color={overdue ? Colors.error : Colors.textMuted} />
              <Text style={{
                fontSize: 11, marginLeft: 3,
                color: overdue ? Colors.error : Colors.textMuted,
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
        {assignedByName && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="person-outline" size={11} color={Colors.textMuted} />
            <Text style={{ fontSize: 11, color: Colors.textSecondary, marginLeft: 3 }} numberOfLines={1}>
              Assigned by {assignedByName}
            </Text>
          </View>
        )}
      </View>
      {assignedToOther && item.assignee && item.assigned_to !== currentUserId && (
        <View style={{ marginLeft: 8 }}>
          <UserAvatar name={item.assignee.name} avatarUrl={item.assignee.avatar_url} size={28} />
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
}
