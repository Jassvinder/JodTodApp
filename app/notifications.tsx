import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { notificationService } from '../services/notifications';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useToast } from '../components/Toast';
import type { AppNotification } from '../types/models';

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function getNotificationIcon(type: string): { name: keyof typeof Ionicons.glyphMap; color: string; bg: string } {
  if (type.includes('Expense') || type.includes('expense')) {
    return { name: 'wallet-outline', color: Colors.primary, bg: '#eef2ff' };
  }
  if (type.includes('Settlement') || type.includes('settlement')) {
    return { name: 'swap-horizontal-outline', color: Colors.success, bg: '#dcfce7' };
  }
  if (type.includes('Group') || type.includes('group')) {
    return { name: 'people-outline', color: '#3b82f6', bg: '#dbeafe' };
  }
  if (type.includes('Todo') || type.includes('todo') || type.includes('Task')) {
    return { name: 'checkbox-outline', color: '#8b5cf6', bg: '#ede9fe' };
  }
  if (type.includes('Reminder') || type.includes('reminder')) {
    return { name: 'alarm-outline', color: Colors.warning, bg: '#fef3c7' };
  }
  if (type.includes('Weekly') || type.includes('Summary')) {
    return { name: 'bar-chart-outline', color: '#06b6d4', bg: '#cffafe' };
  }
  return { name: 'notifications-outline', color: Colors.primary, bg: '#eef2ff' };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const toast = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const response = await notificationService.getNotifications(pageNum);
      const { data, meta } = response.data;

      if (append) {
        setNotifications((prev) => [...prev, ...data]);
      } else {
        setNotifications(data);
      }
      setPage(meta.current_page);
      setLastPage(meta.last_page);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load notifications.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchNotifications(1);
  }, []);

  const loadMore = () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    fetchNotifications(page + 1, true);
  };

  const getNotificationRoute = (notification: AppNotification): { pathname: string; params?: Record<string, any> } | null => {
    const data = notification.data;
    if (!data?.type) return null;

    const type = data.type as string;

    // Todo notifications
    if (type === 'todo_reminder' || type === 'todo_assigned') {
      return { pathname: '/todos' };
    }

    // Group expense notifications
    if (type === 'group_expense_added' && data.group_id) {
      return { pathname: '/groups-expenses', params: { groupId: data.group_id } };
    }

    // Settlement notifications
    if ((type === 'settlement_requested' || type === 'settlement_completed') && data.group_id) {
      return { pathname: '/groups-settlements', params: { groupId: data.group_id } };
    }

    // Group-related notifications (added_to_group, join_request, etc.)
    if (data.group_id) {
      return { pathname: '/groups-detail', params: { id: data.group_id } };
    }

    return null;
  };

  const handleNotificationPress = async (notification: AppNotification) => {
    // Mark as read if unread
    if (!notification.read_at) {
      try {
        await notificationService.markRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
          )
        );
      } catch {
        // Silent fail - still navigate
      }
    }

    // Navigate to relevant screen
    const route = getNotificationRoute(notification);
    if (route) {
      router.push(route as any);
    }
  };

  const handleMarkAllRead = async () => {
    const hasUnread = notifications.some((n) => !n.read_at);
    if (!hasUnread) return;

    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to mark all as read.', 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  const hasUnread = notifications.some((n) => !n.read_at);

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderNotificationItem = ({ item }: { item: AppNotification }) => {
    const icon = getNotificationIcon(item.type);
    const isUnread = !item.read_at;
    const title = item.data?.title || 'Notification';
    const message = item.data?.message || '';

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
        style={{
          backgroundColor: isUnread ? '#f0f0ff' : Colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: isUnread ? Colors.primaryLight : Colors.border,
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: icon.bg,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            marginTop: 2,
          }}
        >
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <Text
              style={{ fontSize: 15, fontWeight: isUnread ? '600' : '500', color: Colors.text, flex: 1 }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {isUnread && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.primary,
                  marginLeft: 8,
                }}
              />
            )}
          </View>
          {message ? (
            <Text style={{ fontSize: 13, color: Colors.textSecondary, lineHeight: 18 }} numberOfLines={2}>
              {message}
            </Text>
          ) : null}
          <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
      <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 }}>No notifications</Text>
      <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
        You're all caught up! We'll notify you when something happens.
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

  const renderHeader = () => {
    if (!hasUnread) return null;
    return (
      <TouchableOpacity
        onPress={handleMarkAllRead}
        disabled={markingAll}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginBottom: 12,
          paddingVertical: 4,
        }}
      >
        {markingAll ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 6 }} />
        ) : (
          <Ionicons name="checkmark-done-outline" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
        )}
        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary }}>Mark All Read</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
      />
    </View>
  );
}
