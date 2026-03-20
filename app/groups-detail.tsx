import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Share,
  Platform,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { groupService, type GroupShowResponse } from '../services/groups';
import { formatCurrency, formatRelativeDate, resolveUrl } from '../utils/format';
import { Colors } from '../constants/colors';
import { useAuthStore } from '../stores/authStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import type { GroupMember, GroupExpense, MemberBalance } from '../types/models';

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = parseInt(id || '0', 10);
  const currentUser = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<GroupShowResponse | null>(null);

  const fetchGroup = async () => {
    try {
      const response = await groupService.getGroup(groupId);
      setData(response.data.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load group.');
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchGroup();
    }, [groupId])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGroup();
  }, [groupId]);

  const isAdmin = data?.isAdmin ?? false;
  const group = data?.group;
  const members = group?.members ?? [];
  const recentExpenses = data?.recentExpenses ?? [];
  const contacts = data?.contacts ?? [];
  const membersWithUnsettled = data?.membersWithUnsettled ?? [];
  const pendingMembers = data?.pendingMembers ?? [];

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  const copyInviteCode = async () => {
    if (!group) return;
    try {
      await Clipboard.setStringAsync(group.invite_code);
      Alert.alert('Copied', 'Invite code copied to clipboard.');
    } catch {
      Alert.alert('Error', 'Could not copy invite code.');
    }
  };

  const shareInviteCode = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `Join my group "${group.name}" on JodTod! Use invite code: ${group.invite_code}`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleApproveMember = async (member: { id: number; name: string }) => {
    try {
      await groupService.approveMember(groupId, member.id);
      Alert.alert('Approved', `${member.name} has been approved.`);
      fetchGroup();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to approve member.');
    }
  };

  const handleRejectMember = (member: { id: number; name: string }) => {
    Alert.alert(
      'Reject Request',
      `Are you sure you want to reject ${member.name}'s request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.rejectMember(groupId, member.id);
              fetchGroup();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject request.');
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (member: GroupMember) => {
    if (member.id === currentUser?.id) {
      Alert.alert('Error', 'You cannot remove yourself. Use "Leave Group" instead.');
      return;
    }
    if (member.pivot.role === 'admin') {
      Alert.alert('Error', 'Cannot remove a group admin.');
      return;
    }

    const hasUnsettled = membersWithUnsettled.includes(member.id);
    const action = hasUnsettled ? 'deactivate' : 'remove';
    const message = hasUnsettled
      ? `${member.name} has unsettled expenses. They will be deactivated (not included in new expenses) but their balances remain.`
      : `Are you sure you want to remove ${member.name} from the group?`;

    Alert.alert(
      hasUnsettled ? 'Deactivate Member' : 'Remove Member',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: hasUnsettled ? 'Deactivate' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.removeMember(groupId, member.id);
              fetchGroup();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || `Failed to ${action} member.`);
            }
          },
        },
      ]
    );
  };

  const handleReactivateMember = async (member: GroupMember) => {
    try {
      await groupService.reactivateMember(groupId, member.id);
      fetchGroup();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reactivate member.');
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${group?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.leaveGroup(groupId);
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to leave group.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.deleteGroup(groupId);
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete group.');
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!group) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <View style={{ padding: 16 }}>
        {/* Group Header */}
        <View style={{
          backgroundColor: Colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: Colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {group.photo_url ? (
              <Image
                source={{ uri: resolveUrl(group.photo_url)! }}
                style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
              />
            ) : (
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: Colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>{getInitials(group.name)}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.text }}>{group.name}</Text>
              {group.description && (
                <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>{group.description}</Text>
              )}
            </View>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/groups-edit', params: { id: groupId, name: group.name, description: group.description || '', photoUrl: group.photo_url || '' } })}
                style={{ padding: 8 }}
              >
                <Ionicons name="create-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: Colors.background, borderRadius: 8, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text }}>{data?.totalExpensesCount ?? 0}</Text>
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>Expenses</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: Colors.background, borderRadius: 8, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text }}>{formatCurrency(data?.totalExpensesAmount ?? 0)}</Text>
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>Total Spent</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: Colors.background, borderRadius: 8, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text }}>{members.length}</Text>
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>Members</Text>
            </View>
          </View>
        </View>

        {/* Invite Code */}
        <View style={{
          backgroundColor: Colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: Colors.border,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Ionicons name="key-outline" size={18} color={Colors.textSecondary} />
          <Text style={{ fontSize: 13, color: Colors.textSecondary, marginLeft: 8 }}>Invite Code:</Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text, marginLeft: 6, letterSpacing: 2 }}>{group.invite_code}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={copyInviteCode} style={{ padding: 6, marginRight: 4 }}>
            <Ionicons name="copy-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={shareInviteCode} style={{ padding: 6 }}>
            <Ionicons name="share-social-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Pending Join Requests */}
        {isAdmin && pendingMembers.length > 0 && (
          <View style={{
            backgroundColor: '#fffbeb',
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#fde68a',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="time-outline" size={18} color="#d97706" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#92400e', marginLeft: 6, flex: 1 }}>
                Pending Requests ({pendingMembers.length})
              </Text>
            </View>
            {pendingMembers.map((member) => (
              <View
                key={member.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderTopWidth: 1,
                  borderTopColor: '#fde68a',
                }}
              >
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#fde68a',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400e' }}>
                    {getInitials(member.name)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text }}>{member.name}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted }}>{member.email}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleApproveMember(member)}
                  style={{
                    backgroundColor: Colors.success,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    marginRight: 6,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleRejectMember(member)}
                  style={{
                    borderWidth: 1,
                    borderColor: Colors.error,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.error }}>Reject</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Members Section */}
        <View style={{
          backgroundColor: Colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: Colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1 }}>Members</Text>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/groups-add-member', params: { id: groupId } })}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Ionicons name="person-add-outline" size={16} color={Colors.primary} />
                <Text style={{ fontSize: 13, color: Colors.primary, marginLeft: 4 }}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {members.map((member) => (
            <View
              key={member.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                borderTopWidth: 1,
                borderTopColor: Colors.border,
              }}
            >
              {/* Avatar */}
              {member.avatar_url ? (
                <Image
                  source={{ uri: resolveUrl(member.avatar_url)! }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    marginRight: 10,
                    opacity: member.pivot.is_active ? 1 : 0.5,
                  }}
                />
              ) : (
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: !member.pivot.is_active ? '#e2e8f0' : Colors.primaryLight,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                  opacity: member.pivot.is_active ? 1 : 0.6,
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: !member.pivot.is_active ? Colors.textMuted : '#fff' }}>
                    {getInitials(member.name)}
                  </Text>
                </View>
              )}

              {/* Name + Badges */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: member.pivot.is_active ? Colors.text : Colors.textMuted,
                  }}>
                    {member.name}
                    {member.id === currentUser?.id ? ' (You)' : ''}
                  </Text>
                  {member.pivot.role === 'admin' && (
                    <View style={{ backgroundColor: '#eef2ff', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, marginLeft: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: Colors.primary }}>Admin</Text>
                    </View>
                  )}
                  {!member.pivot.is_active && (
                    <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, marginLeft: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: Colors.textMuted }}>Inactive</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 12, color: Colors.textMuted }}>{member.email}</Text>
              </View>

              {/* Admin actions */}
              {isAdmin && member.id !== currentUser?.id && member.pivot.role !== 'admin' && (
                <View style={{ flexDirection: 'row' }}>
                  {!member.pivot.is_active ? (
                    <TouchableOpacity
                      onPress={() => handleReactivateMember(member)}
                      style={{ padding: 6 }}
                    >
                      <Ionicons name="refresh-outline" size={18} color={Colors.success} />
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(member)}
                    style={{ padding: 6 }}
                  >
                    <Ionicons name="remove-circle-outline" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Recent Expenses Section */}
        <View style={{
          backgroundColor: Colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: Colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1 }}>Recent Expenses</Text>
            {(data?.totalExpensesCount ?? 0) > 5 && (
              <TouchableOpacity onPress={() => router.push({ pathname: '/groups-expenses', params: { groupId } })}>
                <Text style={{ fontSize: 13, color: Colors.primary }}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentExpenses.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons name="receipt-outline" size={32} color={Colors.textMuted} />
              <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 6 }}>No expenses yet</Text>
            </View>
          ) : (
            recentExpenses.map((expense) => (
              <View
                key={expense.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderTopWidth: 1,
                  borderTopColor: Colors.border,
                }}
              >
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#eef2ff',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                }}>
                  <Text style={{ fontSize: 14 }}>{expense.category?.icon || '💰'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text }} numberOfLines={1}>
                    {expense.description || expense.category?.name || 'Expense'}
                  </Text>
                  <Text style={{ fontSize: 11, color: Colors.textMuted }}>
                    Paid by {expense.payer?.name || 'Unknown'} · {formatRelativeDate(expense.expense_date)}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>{formatCurrency(expense.amount)}</Text>
              </View>
            ))
          )}

          {/* Add Expense Button */}
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/groups-expense-add', params: { groupId } })}
            style={{
              backgroundColor: Colors.primary,
              borderRadius: 10,
              padding: 12,
              alignItems: 'center',
              marginTop: 10,
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        {/* Settle Up Button */}
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/groups-settlements', params: { groupId } })}
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: Colors.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="swap-horizontal" size={20} color={Colors.primary} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.primary, marginLeft: 8 }}>Settlements & Balances</Text>
        </TouchableOpacity>

        {/* Leave / Delete Group */}
        <View style={{ marginBottom: 40, gap: 8 }}>
          {!isAdmin && (
            <TouchableOpacity
              onPress={handleLeaveGroup}
              style={{
                backgroundColor: Colors.surface,
                borderRadius: 12,
                padding: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.error,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.error }}>Leave Group</Text>
            </TouchableOpacity>
          )}
          {isAdmin && (
            <TouchableOpacity
              onPress={handleDeleteGroup}
              style={{
                backgroundColor: Colors.surface,
                borderRadius: 12,
                padding: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.error,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.error }}>Delete Group</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
