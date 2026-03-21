import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useDrawerStore } from '../../stores/drawerStore';
import { dashboardService } from '../../services/dashboard';
import { notificationService } from '../../services/notifications';
import { formatCurrency, formatRelativeDate, percentChange, resolveUrl } from '../../utils/format';
import { Colors } from '../../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import CollapsibleSection from '../../components/CollapsibleSection';
import type { DashboardData } from '../../types/dashboard';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { open: openDrawer } = useDrawerStore();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = async () => {
    try {
      const response = await dashboardService.getData();
      setData(response.data.data);
    } catch {
      // Silent fail - show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getRecent();
      setUnreadCount(response.data.data.unread_count);
    } catch {
      // Silent fail
    }
  };

  useEffect(() => {
    fetchData();
    fetchUnreadCount();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    fetchUnreadCount();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const ps = data?.personalSummary;
  const is = data?.incomeSummary;
  const gs = data?.groupsSummary;
  const expPct = percentChange(ps?.this_month_total || 0, ps?.last_month_total || 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <View style={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={openDrawer} style={{ padding: 4 }}>
            <Ionicons name="menu" size={26} color={Colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.text }}>Welcome, {user?.name?.split(' ')[0]}!</Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary }}>Your expense overview</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={{ padding: 6, marginRight: 8 }}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
            {unreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  backgroundColor: Colors.error,
                  borderRadius: 9,
                  minWidth: 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 3,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{ padding: 2 }}>
            {user?.avatar_url ? (
              <Image source={{ uri: resolveUrl(user.avatar_url)! }} style={{ width: 34, height: 34, borderRadius: 17 }} />
            ) : (
              <View style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: Colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <CollapsibleSection title="Summary" icon="stats-chart-outline" defaultOpen={true}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <SummaryCard
              title="Expenses"
              amount={formatCurrency(ps?.this_month_total || 0)}
              subtitle={expPct !== 0 ? `${expPct > 0 ? '+' : ''}${expPct}% vs last month` : 'Same as last month'}
              subtitleColor={expPct > 0 ? Colors.error : Colors.success}
              icon="wallet-outline"
              iconBg="#eef2ff"
              iconColor={Colors.primary}
            />
            <SummaryCard
              title="Income"
              amount={formatCurrency(is?.this_month_income || 0)}
              subtitle="This month"
              subtitleColor={Colors.textSecondary}
              icon="trending-up-outline"
              iconBg="#dcfce7"
              iconColor={Colors.success}
            />
            <SummaryCard
              title={is && is.this_month_savings >= 0 ? 'Savings' : 'Loss'}
              amount={formatCurrency(is?.this_month_savings || 0)}
              subtitle="Income - Expenses"
              subtitleColor={Colors.textSecondary}
              icon="cash-outline"
              iconBg={(is?.this_month_savings || 0) >= 0 ? '#dcfce7' : '#fee2e2'}
              iconColor={(is?.this_month_savings || 0) >= 0 ? Colors.success : Colors.error}
            />
            <SummaryCard
              title="To Pay"
              amount={formatCurrency(gs?.total_you_owe || 0)}
              subtitle="Group balances"
              subtitleColor={Colors.textSecondary}
              icon="arrow-up-outline"
              iconBg="#fee2e2"
              iconColor={Colors.error}
            />
            <SummaryCard
              title="To Receive"
              amount={formatCurrency(gs?.total_owed_to_you || 0)}
              subtitle="Group balances"
              subtitleColor={Colors.textSecondary}
              icon="arrow-down-outline"
              iconBg="#dcfce7"
              iconColor={Colors.success}
            />
          </View>
        </CollapsibleSection>

        {/* Pending Settlements */}
        {data?.pendingSettlements && data.pendingSettlements.count > 0 && (
          <CollapsibleSection
            title="Pending Payments"
            count={data.pendingSettlements.count}
            icon="alert-circle-outline"
            iconColor="#d97706"
            iconBg="#fef3c7"
            backgroundColor="#fef3c7"
            borderColor="#fcd34d"
            titleColor="#92400e"
            defaultOpen={true}
          >
            {data.pendingSettlements.items.map((s) => (
              <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ fontSize: 14, color: '#92400e' }}>
                  Pay {formatCurrency(s.amount)} to {s.to_user_name}
                </Text>
                <Text style={{ fontSize: 12, color: '#b45309' }}>{s.group_name}</Text>
              </View>
            ))}
          </CollapsibleSection>
        )}

        {/* Todo Stats */}
        {data?.todoStats && (data.todoStats.pending > 0 || data.todoStats.overdue > 0) && (
          <CollapsibleSection
            title="My Tasks"
            icon="checkbox-outline"
            iconColor="#8b5cf6"
            iconBg="#ede9fe"
            defaultOpen={true}
          >
            <TouchableOpacity
              onPress={() => router.push('/todos')}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Text style={{ fontSize: 13, color: Colors.textSecondary }}>{data.todoStats.pending} pending</Text>
                  {data.todoStats.overdue > 0 && (
                    <Text style={{ fontSize: 13, color: Colors.error }}>{data.todoStats.overdue} overdue</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          </CollapsibleSection>
        )}

        {/* Groups Overview */}
        {gs && gs.groups.length > 0 && (
          <CollapsibleSection
            title="Groups"
            count={gs.groups.length}
            icon="people-outline"
            iconColor="#3b82f6"
            iconBg="#dbeafe"
            defaultOpen={true}
          >
            {gs.groups.map((g) => (
              <View key={g.group_id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text }}>{g.group_name}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textSecondary }}>{g.members_count} members</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: g.your_balance >= 0 ? Colors.success : Colors.error }}>
                  {formatCurrency(g.your_balance)}
                </Text>
              </View>
            ))}
          </CollapsibleSection>
        )}

        {/* Category Breakdown */}
        {ps && ps.category_breakdown.length > 0 && (
          <CollapsibleSection
            title="Category Breakdown"
            icon="pie-chart-outline"
            defaultOpen={true}
          >
            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 12 }}>This month's spending</Text>
            {ps.category_breakdown.map((cat, i) => {
              const pct = ps.this_month_total > 0 ? Math.round((cat.total / ps.this_month_total) * 100) : 0;
              return (
                <View key={i} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, color: Colors.text }}>{cat.icon} {cat.name}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text }}>{formatCurrency(cat.total)}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: Colors.border, borderRadius: 3 }}>
                    <View style={{ height: 6, backgroundColor: Colors.primary, borderRadius: 3, width: `${pct}%` }} />
                  </View>
                  <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>{pct}%</Text>
                </View>
              );
            })}
          </CollapsibleSection>
        )}

        {/* Recent Activity */}
        <CollapsibleSection
          title="Recent Activity"
          icon="time-outline"
          defaultOpen={true}
          style={{ marginBottom: 24 }}
        >
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            data.recentActivity.map((a, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < data.recentActivity.length - 1 ? 1 : 0, borderBottomColor: Colors.border }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10,
                  backgroundColor: a.type === 'personal_expense' ? '#eef2ff' : a.type === 'group_expense' ? '#dbeafe' : '#dcfce7',
                }}>
                  <Ionicons
                    name={a.type === 'personal_expense' ? 'wallet-outline' : a.type === 'group_expense' ? 'people-outline' : 'swap-horizontal-outline'}
                    size={18}
                    color={a.type === 'personal_expense' ? Colors.primary : a.type === 'group_expense' ? '#3b82f6' : Colors.success}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: Colors.text }} numberOfLines={1}>{a.description || 'No description'}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted }}>
                    {formatRelativeDate(a.date)}
                    {a.group_name ? ` · ${a.group_name}` : ''}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>{formatCurrency(a.amount)}</Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>No recent activity</Text>
          )}
        </CollapsibleSection>
      </View>
    </ScrollView>
  );
}

function SummaryCard({ title, amount, subtitle, subtitleColor, icon, iconBg, iconColor }: {
  title: string; amount: string; subtitle: string; subtitleColor: string;
  icon: keyof typeof Ionicons.glyphMap; iconBg: string; iconColor: string;
}) {
  return (
    <View style={{
      backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border,
      width: '48%', flexGrow: 1, minWidth: 150,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: iconBg, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={{ fontSize: 13, color: Colors.textSecondary }}>{title}</Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text }}>{amount}</Text>
      <Text style={{ fontSize: 11, color: subtitleColor, marginTop: 2 }}>{subtitle}</Text>
    </View>
  );
}
