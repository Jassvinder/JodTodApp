import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { rememberService } from '../services/remember';
import { Colors } from '../constants/colors';
import { formatDaysAgo, formatShortDate } from '../utils/format';
import HeaderAddButton from '../components/HeaderAddButton';
import RememberForm, { type RememberFormValues } from '../components/RememberForm';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import type { RememberEntry, RememberItem } from '../types/models';

type FormMode = 'none' | 'entry' | 'edit';

export default function RememberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Number(id);
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [item, setItem] = useState<RememberItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('none');
  const [saving, setSaving] = useState(false);

  const fetchItem = async () => {
    try {
      const response = await rememberService.getItem(itemId);
      setItem(response.data.data);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load item.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItem();
    }, [itemId])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItem();
  }, [itemId]);

  const handleSubmit = async (values: RememberFormValues) => {
    setSaving(true);
    try {
      const response = formMode === 'edit'
        ? await rememberService.updateItem(itemId, { name: values.name, note: values.note || null })
        : await rememberService.addEntry(itemId, { done_on: values.done_on, note: values.note || null });
      setItem(response.data.data);
      setFormMode('none');
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = () => {
    if (!item) return;
    confirm.show({
      title: 'Delete Item',
      message: `Delete "${item.name}" and all its dates?`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await rememberService.deleteItem(itemId);
          router.back();
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Failed to delete item.', 'error');
        }
      },
    });
  };

  const handleDeleteEntry = (entry: RememberEntry) => {
    confirm.show({
      title: 'Delete Date',
      message: `Delete the entry for ${formatShortDate(entry.done_on)}?`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          const response = await rememberService.deleteEntry(itemId, entry.id);
          setItem(response.data.data);
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Failed to delete date.', 'error');
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

  if (!item) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Text style={{ fontSize: 15, color: Colors.textSecondary }}>Item not found.</Text>
      </View>
    );
  }

  const renderSummary = () => (
    <View style={{
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text }}>{item.name}</Text>
          {!!item.note && (
            <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>{item.note}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => setFormMode('edit')} hitSlop={8} style={{ padding: 6 }}>
          <Ionicons name="create-outline" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteItem} hitSlop={8} style={{ padding: 6, marginLeft: 4 }}>
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 14, gap: 10 }}>
        <SummaryStat
          label="Last done"
          value={item.last_done_on ? formatDaysAgo(item.last_done_on) : '-'}
        />
        <SummaryStat
          label="Average gap"
          value={item.avg_gap_days !== null ? `~${item.avg_gap_days} days` : '-'}
        />
        <SummaryStat label="Times" value={String(item.entries_count)} />
      </View>
    </View>
  );

  const renderEntry = ({ item: entry }: { item: RememberEntry }) => (
    <View style={{
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: Colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      <Ionicons name="calendar-outline" size={18} color={Colors.primary} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.text }}>
          {formatShortDate(entry.done_on)}
        </Text>
        <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
          {formatDaysAgo(entry.done_on)}{entry.note ? ` · ${entry.note}` : ''}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleDeleteEntry(entry)} hitSlop={8} style={{ padding: 6 }}>
        <Ionicons name="trash-outline" size={18} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {formMode !== 'none' && (
        <RememberForm
          key={formMode}
          title={formMode === 'edit' ? 'Edit Item' : 'Add Date'}
          submitLabel={formMode === 'edit' ? 'Update' : 'Add'}
          showName={formMode === 'edit'}
          showDate={formMode === 'entry'}
          initialName={formMode === 'edit' ? item.name : ''}
          initialNote={formMode === 'edit' ? item.note ?? '' : ''}
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={() => setFormMode('none')}
        />
      )}

      <FlatList
        data={item.entries ?? []}
        renderItem={renderEntry}
        keyExtractor={(entry) => entry.id.toString()}
        ListHeaderComponent={
          <View>
            {renderSummary()}
            <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 }}>History</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 24 }}>
            No dates yet. Tap Add Date to log the first one.
          </Text>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      />

      <HeaderAddButton label="Add Date" onPress={() => setFormMode('entry')} visible={formMode === 'none'} />
    </View>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, borderRadius: 10, padding: 10 }}>
      <Text style={{ fontSize: 11, color: Colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 2 }}>{value}</Text>
    </View>
  );
}
