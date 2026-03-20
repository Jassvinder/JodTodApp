import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { groupService, type SettlementsResponse } from '../services/groups';
import { formatCurrency, formatRelativeDate } from '../utils/format';
import { Colors } from '../constants/colors';
import { useAuthStore } from '../stores/authStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { MemberBalance, SuggestedTransaction, Settlement } from '../types/models';

export default function SettlementsScreen() {
  const router = useRouter();
  const { groupId: groupIdParam } = useLocalSearchParams<{ groupId: string }>();
  const groupId = parseInt(groupIdParam || '0', 10);
  const currentUser = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [settlingUp, setSettlingUp] = useState(false);
  const [settlingAll, setSettlingAll] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [suggestedTransactions, setSuggestedTransactions] = useState<SuggestedTransaction[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchData = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const [settlementsRes, groupRes] = await Promise.all([
        groupService.getSettlements(groupId, pageNum),
        pageNum === 1 ? groupService.getGroup(groupId) : Promise.resolve(null),
      ]);

      const data: SettlementsResponse = settlementsRes.data.data;

      if (pageNum === 1) {
        setBalances(data.balances);
        setSuggestedTransactions(data.suggestedTransactions);
      }

      if (append) {
        setSettlements((prev) => [...prev, ...data.settlements.data]);
      } else {
        setSettlements(data.settlements.data);
      }
      setPage(data.settlements.meta.current_page);
      setLastPage(data.settlements.meta.last_page);

      if (groupRes) {
        setIsAdmin(groupRes.data.data.isAdmin);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load settlements.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData(1);
    }, [groupId])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchData(1);
  }, [groupId]);

  const loadMore = () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    fetchData(page + 1, true);
  };

  const hasPendingSettlements = settlements.some((s) => s.status === 'pending');

  const handleSettleUp = () => {
    if (hasPendingSettlements) {
      Alert.alert('Pending Settlements', 'There are pending settlements that need to be marked as completed first.');
      return;
    }

    Alert.alert(
      'Settle Up',
      'This will create settlement records based on current balances. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle Up',
          onPress: async () => {
            setSettlingUp(true);
            try {
              await groupService.settleUp(groupId);
              setPage(1);
              fetchData(1);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to settle up.');
            } finally {
              setSettlingUp(false);
            }
          },
        },
      ]
    );
  };

  const handleSettleAll = () => {
    Alert.alert(
      'Settle All',
      'This will mark ALL pending settlements as completed. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle All',
          onPress: async () => {
            setSettlingAll(true);
            try {
              await groupService.settleAll(groupId);
              setPage(1);
              fetchData(1);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to settle all.');
            } finally {
              setSettlingAll(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkComplete = (settlement: Settlement) => {
    Alert.alert(
      'Mark as Paid',
      `Confirm that ${settlement.from_user.name} has paid ${formatCurrency(settlement.amount)} to ${settlement.to_user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setMarkingId(settlement.id);
            try {
              await groupService.markSettlementComplete(groupId, settlement.id);
              setSettlements((prev) =>
                prev.map((s) =>
                  s.id === settlement.id ? { ...s, status: 'completed' as const } : s
                )
              );
              // Refresh balances
              fetchData(1);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to mark settlement.');
            } finally {
              setMarkingId(null);
            }
          },
        },
      ]
    );
  };

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  const canMarkComplete = (settlement: Settlement): boolean => {
    if (settlement.status !== 'pending') return false;
    if (isAdmin) return true;
    if (currentUser?.id === settlement.from_user.id) return true;
    if (currentUser?.id === settlement.to_user.id) return true;
    return false;
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      {/* Balance Cards */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 10 }}>Member Balances</Text>
      <View style={{ marginBottom: 16 }}>
        {balances.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: 14, color: Colors.textSecondary }}>No balances to show</Text>
          </View>
        ) : (
          balances.map((member) => {
            const isPositive = member.balance > 0;
            const isZero = member.balance === 0;
            const bgColor = isZero ? '#f1f5f9' : isPositive ? '#f0fdf4' : '#fef2f2';
            const textColor = isZero ? Colors.textMuted : isPositive ? Colors.success : Colors.error;
            const label = isZero ? 'Settled' : isPositive ? 'Gets back' : 'Owes';

            return (
              <View
                key={member.user_id}
                style={{
                  backgroundColor: Colors.surface,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 6,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: bgColor,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>
                    {getInitials(member.name)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text }}>{member.name}</Text>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{label}</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                  {isZero ? formatCurrency(0) : formatCurrency(Math.abs(member.balance))}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Suggested Transactions */}
      {suggestedTransactions.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 10 }}>Suggested Payments</Text>
          {suggestedTransactions.map((tx, index) => (
            <View
              key={index}
              style={{
                backgroundColor: Colors.surface,
                borderRadius: 10,
                padding: 12,
                marginBottom: 6,
                borderWidth: 1,
                borderColor: Colors.border,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {/* From */}
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#fef2f2',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.error }}>
                  {getInitials(tx.from.name)}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginHorizontal: 6 }} numberOfLines={1}>
                {tx.from.name}
              </Text>

              <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} />

              {/* To */}
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginHorizontal: 6 }} numberOfLines={1}>
                {tx.to.name}
              </Text>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#f0fdf4',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.success }}>
                  {getInitials(tx.to.name)}
                </Text>
              </View>

              <View style={{ flex: 1 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text }}>
                {formatCurrency(tx.amount)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      {isAdmin && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={handleSettleUp}
            disabled={settlingUp || hasPendingSettlements}
            style={{
              flex: 1,
              backgroundColor: hasPendingSettlements ? Colors.border : Colors.primary,
              borderRadius: 10,
              padding: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {settlingUp ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="swap-horizontal" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 6 }}>Settle Up</Text>
              </>
            )}
          </TouchableOpacity>

          {hasPendingSettlements && (
            <TouchableOpacity
              onPress={handleSettleAll}
              disabled={settlingAll}
              style={{
                flex: 1,
                backgroundColor: Colors.success,
                borderRadius: 10,
                padding: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              {settlingAll ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 6 }}>Settle All</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Settlement History Header */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 10 }}>Settlement History</Text>
    </View>
  );

  const renderSettlementItem = ({ item }: { item: Settlement }) => {
    const isPending = item.status === 'pending';
    const statusColor = isPending ? Colors.warning : Colors.success;
    const statusLabel = isPending ? 'Pending' : 'Completed';

    return (
      <View
        style={{
          backgroundColor: Colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* From Avatar */}
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#fef2f2',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.error }}>
              {getInitials(item.from_user.name)}
            </Text>
          </View>

          <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} style={{ marginHorizontal: 8 }} />

          {/* To Avatar */}
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#f0fdf4',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.success }}>
              {getInitials(item.to_user.name)}
            </Text>
          </View>

          {/* Info */}
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: 13, color: Colors.text }}>
              <Text style={{ fontWeight: '600' }}>{item.from_user.name}</Text>
              {' pays '}
              <Text style={{ fontWeight: '600' }}>{item.to_user.name}</Text>
            </Text>
            <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>
              {formatRelativeDate(item.created_at)}
            </Text>
          </View>

          {/* Amount + Status */}
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text }}>
              {formatCurrency(item.amount)}
            </Text>
            <View style={{
              backgroundColor: isPending ? '#fffbeb' : '#f0fdf4',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              marginTop: 2,
            }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: statusColor }}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* Mark as Paid Button */}
        {canMarkComplete(item) && (
          <TouchableOpacity
            onPress={() => handleMarkComplete(item)}
            disabled={markingId === item.id}
            style={{
              backgroundColor: Colors.success,
              borderRadius: 8,
              padding: 10,
              alignItems: 'center',
              marginTop: 10,
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {markingId === item.id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>Mark as Paid</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
      <Ionicons name="swap-horizontal-outline" size={40} color={Colors.textMuted} />
      <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 8 }}>No settlements yet</Text>
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
        data={settlements}
        renderItem={renderSettlementItem}
        keyExtractor={(item) => item.id.toString()}
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
