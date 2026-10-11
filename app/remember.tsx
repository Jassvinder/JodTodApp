import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { rememberService } from '../services/remember';
import { Colors } from '../constants/colors';
import { formatDaysAgo, formatShortDate } from '../utils/format';
import EmptyState from '../components/EmptyState';
import HeaderAddButton from '../components/HeaderAddButton';
import RememberForm, { type RememberFormValues } from '../components/RememberForm';
import { useToast } from '../components/Toast';
import BottomNav from '../components/BottomNav';
import type { RememberItem } from '../types/models';

export default function RememberScreen() {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<RememberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const response = await rememberService.getItems();
      setItems(response.data.data);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load items.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems();
  }, []);

  const handleCreate = async (values: RememberFormValues) => {
    setSaving(true);
    try {
      const response = await rememberService.createItem({
        name: values.name,
        note: values.note || null,
        done_on: values.done_on,
      });
      const created = response.data.data;
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setShowForm(false);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to save item.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: RememberItem }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/remember-detail', params: { id: item.id } })}
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
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text }}>{item.name}</Text>
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>
          {item.last_done_on
            ? `Last: ${formatShortDate(item.last_done_on)} (${formatDaysAgo(item.last_done_on)})`
            : 'No dates added yet'}
        </Text>
        {item.avg_gap_days !== null && (
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
            Usually every ~{item.avg_gap_days} days
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="bookmark-outline"
      title="Never forget the little things"
      text="When did you last change the gas cylinder, water filter or remote batteries? Save it here and add a new date each time. JodTod shows how many days have passed and how often it usually happens."
      iconColor="#d97706"
      iconBg="#fef3c7"
      actionLabel="Add First Item"
      onAction={() => setShowForm(true)}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1 }}>
        {/* Form stays outside FlatList to prevent keyboard dismiss on re-render */}
        {showForm && (
          <RememberForm
            title="New Item"
            submitLabel="Add"
            dateLabel="Last done on"
            saving={saving}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 8 }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </Text>
          }
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        />

        <HeaderAddButton onPress={() => setShowForm(true)} visible={!showForm} helpScreen="remember" tipId="remember.add" />
      </View>
      <BottomNav />
    </View>
  );
}
