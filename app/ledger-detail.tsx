import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ledgerService, type LedgerEntryData, type LedgerPersonData } from '../services/ledger';
import { Colors } from '../constants/colors';
import { formatCurrency, formatDateTime, formatLocalDateTime, formatShortDate } from '../utils/format';
import UserAvatar from '../components/UserAvatar';
import LedgerPersonForm from '../components/ledger/LedgerPersonForm';
import LedgerEntryForm from '../components/ledger/LedgerEntryForm';
import { LEDGER_GET_COLOR, LEDGER_GIVE_COLOR } from '../components/ledger/LedgerUi';
import FormCard from '../components/FormCard';
import DatePickerField from '../components/DatePickerField';
import { cancelCollectReminder, getCollectReminderDate, scheduleCollectReminder } from '../services/ledgerReminders';
import { shareLedgerStatement } from '../utils/ledgerStatement';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import BottomNav from '../components/BottomNav';
import type { LedgerEntry, LedgerEntryType, LedgerPerson } from '../types/models';

type FormState =
  | { mode: 'none' }
  | { mode: 'person' }
  | { mode: 'reminder' }
  | { mode: 'entry'; type: LedgerEntryType }
  | { mode: 'editEntry'; entry: LedgerEntry };

export default function LedgerDetailScreen() {
  const { id, addEntry } = useLocalSearchParams<{ id: string; addEntry?: string }>();
  const personId = Number(id);
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [person, setPerson] = useState<LedgerPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState<FormState>(addEntry ? { mode: 'entry', type: 'gave' } : { mode: 'none' });
  const [saving, setSaving] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [reminderInput, setReminderInput] = useState('');

  // A collect reminder only makes sense while the person owes money.
  const applyPerson = (next: LedgerPerson) => {
    setPerson(next);
    if (next.balance <= 0) {
      cancelCollectReminder(next.id);
      setReminderDate(null);
    }
  };

  const fetchPerson = async () => {
    try {
      const response = await ledgerService.getPerson(personId);
      applyPerson(response.data.data);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPerson();
      getCollectReminderDate(personId).then(setReminderDate);
    }, [personId])
  );

  const runSave = async (request: () => Promise<{ data: { data: LedgerPerson } }>, failMessage: string) => {
    setSaving(true);
    try {
      const response = await request();
      applyPerson(response.data.data);
      setForm({ mode: 'none' });
    } catch (error: any) {
      toast.show(error.response?.data?.message || failMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePerson = (values: LedgerPersonData) =>
    runSave(() => ledgerService.updatePerson(personId, values), 'Failed to save.');

  const handleSaveEntry = (values: LedgerEntryData) => {
    if (form.mode === 'editEntry') {
      return runSave(() => ledgerService.updateEntry(personId, form.entry.id, values), 'Failed to save entry.');
    }
    return runSave(() => ledgerService.addEntry(personId, values), 'Failed to save entry.');
  };

  const handleDeletePerson = () => {
    if (!person) return;
    confirm.show({
      title: 'Delete Person',
      message: `Delete ${person.name} and all ${person.entries_count} entries? This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await ledgerService.deletePerson(personId);
          cancelCollectReminder(personId);
          router.back();
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Failed to delete.', 'error');
        }
      },
    });
  };

  const handleDeleteEntry = (entry: LedgerEntry) => {
    confirm.show({
      title: 'Delete Entry',
      message: `Delete "${entry.type === 'gave' ? 'You gave' : 'You got'} ${formatCurrency(entry.amount)}" on ${formatShortDate(entry.entry_date)}?`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          const response = await ledgerService.deleteEntry(personId, entry.id);
          setPerson(response.data.data);
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Failed to delete entry.', 'error');
        }
      },
    });
  };

  const openReminderForm = () => {
    // Default: tomorrow at 10 AM.
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(10, 0, 0, 0);
    setReminderInput(formatLocalDateTime(reminderDate ?? tomorrow));
    setForm({ mode: 'reminder' });
  };

  const handleSaveReminder = async () => {
    if (!person) return;
    const date = new Date(reminderInput);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      toast.show('Pick a date and time in the future.', 'error');
      return;
    }
    setSaving(true);
    const scheduled = await scheduleCollectReminder(person.id, person.name, person.balance, date);
    setSaving(false);
    if (!scheduled) {
      toast.show('Could not set the reminder. Allow notifications for JodTod and try again.', 'error');
      return;
    }
    setReminderDate(date);
    setForm({ mode: 'none' });
    toast.show('Reminder set.', 'success');
  };

  const handleRemoveReminder = async () => {
    await cancelCollectReminder(personId);
    setReminderDate(null);
  };

  const handleShare = async () => {
    if (!person) return;
    try {
      await shareLedgerStatement(person);
    } catch {
      toast.show('Could not open sharing.', 'error');
    }
  };

  const headerRight = () => person ? (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity onPress={handleShare} style={{ padding: 6 }} accessibilityLabel="Share statement">
        <Ionicons name="logo-whatsapp" size={20} color={LEDGER_GET_COLOR} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setForm({ mode: 'person' })} style={{ padding: 6 }} accessibilityLabel="Edit person">
        <Ionicons name="create-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDeletePerson} style={{ padding: 6 }} accessibilityLabel="Delete person">
        <Ionicons name="trash-outline" size={20} color={Colors.error} />
      </TouchableOpacity>
    </View>
  ) : null;

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!person) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Text style={{ fontSize: 15, color: Colors.textSecondary }}>Person not found.</Text>
      </View>
    );
  }

  const willGet = person.balance > 0;
  const settled = person.balance === 0;
  const balanceColor = settled ? Colors.textMuted : willGet ? LEDGER_GET_COLOR : LEDGER_GIVE_COLOR;

  const renderSummary = () => (
    <View>
      <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <UserAvatar name={person.name} size={44} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text }}>{person.name}</Text>
            {!!person.phone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${person.phone}`)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="call-outline" size={12} color={Colors.primary} />
                <Text style={{ fontSize: 13, color: Colors.primary, marginLeft: 4 }}>{person.phone}</Text>
              </TouchableOpacity>
            )}
            {!!person.note && <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>{person.note}</Text>}
          </View>
        </View>

        <View style={{ alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border }}>
          <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
            {settled ? 'All settled' : willGet ? `${person.name} owes you` : `You owe ${person.name}`}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: balanceColor, marginTop: 2 }}>
            {formatCurrency(Math.abs(person.balance))}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 8, gap: 16 }}>
            <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
              Total gave: <Text style={{ color: LEDGER_GIVE_COLOR, fontWeight: '600' }}>{formatCurrency(person.total_gave)}</Text>
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
              Total got: <Text style={{ color: LEDGER_GET_COLOR, fontWeight: '600' }}>{formatCurrency(person.total_got)}</Text>
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setForm({ mode: 'entry', type: 'gave' })}
          style={{ flex: 1, backgroundColor: LEDGER_GIVE_COLOR, borderRadius: 12, paddingVertical: 13, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="arrow-up-outline" size={18} color="#fff" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', marginLeft: 6 }}>You Gave</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setForm({ mode: 'entry', type: 'got' })}
          style={{ flex: 1, backgroundColor: LEDGER_GET_COLOR, borderRadius: 12, paddingVertical: 13, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="arrow-down-outline" size={18} color="#fff" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', marginLeft: 6 }}>You Got</Text>
        </TouchableOpacity>
      </View>

      {willGet && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12,
          borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16,
        }}>
          <Ionicons name={reminderDate ? 'alarm' : 'alarm-outline'} size={18} color={Colors.primary} />
          <Text style={{ flex: 1, fontSize: 13, color: Colors.text, marginLeft: 8 }}>
            {reminderDate
              ? `Reminder: ${formatDateTime(reminderDate.toISOString())}`
              : 'Remind me to collect this money'}
          </Text>
          <TouchableOpacity onPress={openReminderForm} style={{ paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.primary }}>{reminderDate ? 'Change' : 'Set'}</Text>
          </TouchableOpacity>
          {reminderDate && (
            <TouchableOpacity onPress={handleRemoveReminder} style={{ paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.error }}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {(person.entries?.length ?? 0) > 0 && (
        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 }}>
          HISTORY ({person.entries_count})
        </Text>
      )}
    </View>
  );

  const renderEntry = ({ item }: { item: LedgerEntry }) => {
    const gave = item.type === 'gave';
    const color = gave ? LEDGER_GIVE_COLOR : LEDGER_GET_COLOR;
    return (
      <TouchableOpacity
        onPress={() => setForm({ mode: 'editEntry', entry: item })}
        onLongPress={() => handleDeleteEntry(item)}
        style={{
          backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 8,
          borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center',
        }}
      >
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: color + '18', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name={gave ? 'arrow-up-outline' : 'arrow-down-outline'} size={18} color={color} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>{gave ? 'You gave' : 'You got'}</Text>
          <Text style={{ fontSize: 12, color: Colors.textMuted }}>{formatShortDate(item.entry_date)}</Text>
          {!!item.note && <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }} numberOfLines={2}>{item.note}</Text>}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color }}>{formatCurrency(item.amount)}</Text>
          <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>
            Bal. {item.balance_after === 0 ? formatCurrency(0) : `${formatCurrency(Math.abs(item.balance_after))} ${item.balance_after > 0 ? 'to get' : 'to give'}`}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteEntry(item)} hitSlop={8} style={{ padding: 4, marginLeft: 6 }} accessibilityLabel="Delete entry">
          <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Stack.Screen options={{ title: person.name, headerRight }} />
      <View style={{ flex: 1 }}>
        {/* Forms stay outside FlatList to prevent keyboard dismiss on re-render */}
        {form.mode === 'person' && (
          <LedgerPersonForm
            title="Edit Person"
            submitLabel="Save"
            initial={{ name: person.name, phone: person.phone, note: person.note }}
            saving={saving}
            onSubmit={handleSavePerson}
            onCancel={() => setForm({ mode: 'none' })}
          />
        )}
        {form.mode === 'reminder' && (
          <FormCard
            title={`Remind me to collect from ${person.name}`}
            submitLabel="Set Reminder"
            saving={saving}
            onSubmit={handleSaveReminder}
            onCancel={() => setForm({ mode: 'none' })}
          >
            <DatePickerField label="When" mode="datetime" value={reminderInput} onChange={setReminderInput} minDate={new Date()} />
          </FormCard>
        )}
        {(form.mode === 'entry' || form.mode === 'editEntry') && (
          <LedgerEntryForm
            key={form.mode === 'editEntry' ? `edit-${form.entry.id}` : `new-${form.type}`}
            personName={person.name}
            isEdit={form.mode === 'editEntry'}
            initial={form.mode === 'editEntry' ? form.entry : { type: form.type }}
            saving={saving}
            onSubmit={handleSaveEntry}
            onCancel={() => setForm({ mode: 'none' })}
          />
        )}

        <FlatList
          data={person.entries ?? []}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={form.mode === 'none' ? renderSummary() : null}
          ListEmptyComponent={
            form.mode === 'none' ? (
              <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
                No entries yet. Tap "You Gave" or "You Got" to add the first one.
              </Text>
            ) : null
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPerson(); }} colors={[Colors.primary]} />}
        />
      </View>
      <BottomNav />
    </View>
  );
}
