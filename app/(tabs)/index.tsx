import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { dashboardService } from '../../services/dashboard';
import { formatCurrency, formatRelativeDate, percentChange } from '../../utils/format';
import { Colors } from '../../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { DashboardData } from '../../types/dashboard';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
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
        <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.text }}>Welcome, {user?.name?.split(' ')[0]}!</Text>
        <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 16 }}>Your expense overview</Text>

        {/* Summary Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
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
            title="You Owe"
            amount={formatCurrency(gs?.total_you_owe || 0)}
            subtitle="Group balances"
            subtitleColor={Colors.textSecondary}
            icon="arrow-up-outline"
            iconBg="#fee2e2"
            iconColor={Colors.error}
          />
          <SummaryCard
            title="Owed to You"
            amount={formatCurrency(gs?.total_owed_to_you || 0)}
            subtitle="Group balances"
            subtitleColor={Colors.textSecondary}
            icon="arrow-down-outline"
            iconBg="#dcfce7"
            iconColor={Colors.success}
          />
        </View>

        {/* Pending Settlements */}
        {data?.pendingSettlements && data.pendingSettlements.count > 0 && (
          <View style={{ backgroundColor: '#fef3c7', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="alert-circle" size={20} color="#d97706" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#92400e', marginLeft: 8 }}>
                Pending Payments ({data.pendingSettlements.count})
              </Text>
            </View>
            {data.pendingSettlements.items.map((s) => (
              <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ fontSize: 14, color: '#92400e' }}>
                  Pay {formatCurrency(s.amount)} to {s.to_user_name}
                </Text>
                <Text style={{ fontSize: 12, color: '#b45309' }}>{s.group_name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Todo Stats */}
        {data?.todoStats && (data.todoStats.pending > 0 || data.todoStats.overdue > 0) && (
          <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 }}>My Tasks</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Text style={{ fontSize: 13, color: Colors.textSecondary }}>{data.todoStats.pending} pending</Text>
              {data.todoStats.overdue > 0 && (
                <Text style={{ fontSize: 13, color: Colors.error }}>{data.todoStats.overdue} overdue</Text>
              )}
            </View>
          </View>
        )}

        {/* Groups Overview */}
        {gs && gs.groups.length > 0 && (
          <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 10 }}>Groups</Text>
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
          </View>
        )}

        {/* Category Breakdown */}
        {ps && ps.category_breakdown.length > 0 && (
          <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 }}>Category Breakdown</Text>
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
          </View>
        )}

        {/* Recent Activity */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 10 }}>Recent Activity</Text>
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
        </View>
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
