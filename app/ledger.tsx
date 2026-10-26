import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ledgerService, type LedgerPersonData } from '../services/ledger';
import { Colors } from '../constants/colors';
import { formatCurrency, formatShortDate } from '../utils/format';
import EmptyState from '../components/EmptyState';
import HeaderAddButton from '../components/HeaderAddButton';
import ListSearchBar from '../components/ListSearchBar';
import UserAvatar from '../components/UserAvatar';
import LedgerPersonForm from '../components/ledger/LedgerPersonForm';
import { LEDGER_GET_COLOR, LEDGER_GIVE_COLOR, LedgerBalanceText } from '../components/ledger/LedgerUi';
import { useToast } from '../components/Toast';
import BottomNav from '../components/BottomNav';
import type { LedgerPerson, LedgerTotals } from '../types/models';

export default function LedgerScreen() {
  const router = useRouter();
  const toast = useToast();
  const [people, setPeople] = useState<LedgerPerson[]>([]);
  const [totals, setTotals] = useState<LedgerTotals>({ you_will_get: 0, you_will_give: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchPeople = async () => {
    try {
      const response = await ledgerService.getPeople();
      setPeople(response.data.data.people);
      setTotals(response.data.data.totals);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setSearchText('');
      fetchPeople();
    }, [])
  );

  const handleCreate = async (values: LedgerPersonData) => {
    setSaving(true);
    try {
      const response = await ledgerService.createPerson(values);
      setShowForm(false);
      // Open the new person so the first entry can be added right away.
      router.push({ pathname: '/ledger-detail', params: { id: response.data.data.id, addEntry: '1' } });
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to add person.', 'error');
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

  const query = searchText.trim().toLowerCase();
  const visiblePeople = query ? people.filter((p) => p.name.toLowerCase().includes(query)) : people;

  const renderTotals = () => (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: '#dcfce7', borderRadius: 12, padding: 14 }}>
          <Text style={{ fontSize: 12, color: '#166534' }}>You will get</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: LEDGER_GET_COLOR, marginTop: 2 }}>{formatCurrency(totals.you_will_get)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fee2e2', borderRadius: 12, padding: 14 }}>
          <Text style={{ fontSize: 12, color: '#991b1b' }}>You will give</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: LEDGER_GIVE_COLOR, marginTop: 2 }}>{formatCurrency(totals.you_will_give)}</Text>
        </View>
      </View>
      {people.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <ListSearchBar
            value={searchText}
            placeholder="Search people..."
            searching={false}
            accessibilityLabel="Search people"
            onChangeText={setSearchText}
            onSearch={() => {}}
            onClear={() => setSearchText('')}
          />
        </View>
      )}
      {people.length > 0 && (
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>
          {visiblePeople.length} {visiblePeople.length === 1 ? 'person' : 'people'}
        </Text>
      )}
    </View>
  );

  const renderPerson = ({ item }: { item: LedgerPerson }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/ledger-detail', params: { id: item.id } })}
      style={{
        backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center',
      }}
    >
      <UserAvatar name={item.name} size={40} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text }} numberOfLines={1}>{item.name}</Text>
        <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
          {item.last_entry_on ? `Last entry ${formatShortDate(item.last_entry_on)}` : 'No entries yet'}
        </Text>
      </View>
      <LedgerBalanceText balance={item.balance} />
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    query ? (
      <EmptyState icon="search-outline" title="No people match" text="Try a different name." />
    ) : (
      <EmptyState
        icon="swap-horizontal-outline"
        title="Keep track of money you give and get"
        text="Gave ₹500 to a friend, got some back later? Add the person, then record each time you give or get money. JodTod keeps the running total, so you always know who owes whom."
        iconColor={LEDGER_GET_COLOR}
        iconBg="#dcfce7"
        actionLabel="Add First Person"
        onAction={() => setShowForm(true)}
      />
    )
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1 }}>
        {/* Form stays outside FlatList to prevent keyboard dismiss on re-render */}
        {showForm && (
          <LedgerPersonForm
            title="Add Person"
            submitLabel="Add"
            saving={saving}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        <FlatList
          data={visiblePeople}
          renderItem={renderPerson}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderTotals()}
          ListEmptyComponent={renderEmpty}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPeople(); }} colors={[Colors.primary]} />}
        />

        <HeaderAddButton onPress={() => setShowForm(true)} visible={!showForm} label="Person" helpScreen="ledger" tipId="ledger.add" />
      </View>
      <BottomNav />
    </View>
  );
}
