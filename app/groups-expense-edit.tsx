import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { groupService, type GroupExpensePayload, type GroupShowResponse } from '../services/groups';
import { expenseService } from '../services/expenses';
import { formatCurrency } from '../utils/format';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import DatePickerField from '../components/DatePickerField';
import { useToast } from '../components/Toast';
import type { Category, GroupMember, GroupExpense } from '../types/models';

export default function EditGroupExpenseScreen() {
  const router = useRouter();
  const { groupId: groupIdParam, expenseId: expenseIdParam } = useLocalSearchParams<{
    groupId: string;
    expenseId: string;
  }>();
  const groupId = parseInt(groupIdParam || '0', 10);
  const expenseId = parseInt(expenseIdParam || '0', 10);
  const toast = useToast();

  // Form state
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [paidBy, setPaidBy] = useState<number | null>(null);
  const [splitType, setSplitType] = useState<'equal' | 'custom' | 'percentage'>('equal');

  const [equalSplitMembers, setEqualSplitMembers] = useState<number[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<number, string>>({});
  const [percentages, setPercentages] = useState<Record<number, string>>({});

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeMembers, setActiveMembers] = useState<GroupMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [showPayerPicker, setShowPayerPicker] = useState(false);

  const fetchData = async () => {
    try {
      const [groupRes, catRes, expenseRes] = await Promise.all([
        groupService.getGroup(groupId),
        expenseService.getCategories(),
        groupService.getGroupExpenses(groupId, { page: 1 }),
      ]);

      const groupData: GroupShowResponse = groupRes.data.data;
      const active = groupData.group.members.filter((m) => m.pivot.is_active);
      setActiveMembers(active);
      setCategories(catRes.data.data);

      // Find the expense - could be in recent expenses from group detail or paginated list
      // Try to get it from the group expenses endpoint
      let expense: GroupExpense | undefined;
      // Search in all fetched expenses
      const allExpenses = expenseRes.data.data;
      expense = allExpenses.find((e) => e.id === expenseId);

      // If not found in first page, check recent expenses
      if (!expense) {
        expense = groupData.recentExpenses.find((e) => e.id === expenseId);
      }

      if (!expense) {
        // Try individual fetch via expenses list with search
        toast.show('Expense not found.', 'error');
        router.back();
        return;
      }

      // Pre-fill form
      setAmount(expense.amount.toString());
      setCategoryId(expense.category_id);
      setDescription(expense.description || '');
      setExpenseDate(expense.expense_date);
      setPaidBy(expense.paid_by);
      setSplitType(expense.split_type);

      // Pre-fill splits
      if (expense.splits && expense.splits.length > 0) {
        if (expense.split_type === 'equal') {
          setEqualSplitMembers(expense.splits.map((s) => s.user_id));
        } else if (expense.split_type === 'custom') {
          const amounts: Record<number, string> = {};
          expense.splits.forEach((s) => {
            amounts[s.user_id] = s.share_amount.toString();
          });
          setCustomAmounts(amounts);
        } else if (expense.split_type === 'percentage') {
          const pcts: Record<number, string> = {};
          expense.splits.forEach((s) => {
            pcts[s.user_id] = (s.percentage || 0).toString();
          });
          setPercentages(pcts);
        }
      } else {
        // Default to all active members for equal
        setEqualSplitMembers(active.map((m) => m.id));
      }
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load expense data.', 'error');
      router.back();
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getEqualShareAmount = (): number => {
    const total = parseFloat(amount) || 0;
    if (equalSplitMembers.length === 0) return 0;
    return Math.round((total / equalSplitMembers.length) * 100) / 100;
  };

  const getCustomTotal = (): number => {
    return Object.values(customAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const getPercentageTotal = (): number => {
    return Object.values(percentages).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const toggleEqualMember = (memberId: number) => {
    setEqualSplitMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const buildSplits = (): { user_id: number; share_amount: number; percentage: number | null }[] => {
    const total = parseFloat(amount) || 0;

    if (splitType === 'equal') {
      const share = getEqualShareAmount();
      return equalSplitMembers.map((userId) => ({
        user_id: userId,
        share_amount: share,
        percentage: null,
      }));
    }

    if (splitType === 'custom') {
      return activeMembers
        .filter((m) => (parseFloat(customAmounts[m.id] || '0') || 0) > 0)
        .map((m) => ({
          user_id: m.id,
          share_amount: parseFloat(customAmounts[m.id] || '0') || 0,
          percentage: null,
        }));
    }

    return activeMembers
      .filter((m) => (parseFloat(percentages[m.id] || '0') || 0) > 0)
      .map((m) => {
        const pct = parseFloat(percentages[m.id] || '0') || 0;
        return {
          user_id: m.id,
          share_amount: Math.round((total * pct) / 100 * 100) / 100,
          percentage: pct,
        };
      });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const total = parseFloat(amount) || 0;

    if (!amount || total <= 0) newErrors.amount = 'Enter a valid amount';
    if (!categoryId) newErrors.category_id = 'Select a category';
    if (!expenseDate) newErrors.expense_date = 'Select a date';
    if (!paidBy) newErrors.paid_by = 'Select who paid';

    if (splitType === 'equal') {
      if (equalSplitMembers.length === 0) newErrors.splits = 'Select at least one member';
    } else if (splitType === 'custom') {
      const customTotal = getCustomTotal();
      if (total > 0 && Math.abs(customTotal - total) > 0.01) {
        newErrors.splits = `Custom amounts total ${formatCurrency(customTotal)} but expense is ${formatCurrency(total)}`;
      }
    } else if (splitType === 'percentage') {
      const pctTotal = getPercentageTotal();
      if (Math.abs(pctTotal - 100) > 0.01) {
        newErrors.splits = `Percentages total ${pctTotal.toFixed(1)}% (must be 100%)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload: GroupExpensePayload = {
        description: description.trim(),
        amount: parseFloat(amount),
        paid_by: paidBy!,
        category_id: categoryId!,
        expense_date: expenseDate,
        split_type: splitType,
        splits: buildSplits(),
      };

      await groupService.updateGroupExpense(groupId, expenseId, payload);
      router.back();
    } catch (error: any) {
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const key in fieldErrors) mapped[key] = fieldErrors[key][0];
        setErrors(mapped);
      } else {
        toast.show(error.response?.data?.message || 'Failed to update expense.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  if (loadingData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const payerName = activeMembers.find((m) => m.id === paidBy)?.name || 'Select';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ padding: 16 }}>
          {/* Amount Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Amount *</Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: errors.amount ? Colors.error : Colors.border,
              paddingHorizontal: 16,
            }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.text, marginRight: 4 }}>₹</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                style={{ flex: 1, fontSize: 28, fontWeight: '700', color: Colors.text, paddingVertical: 16 }}
              />
            </View>
            {errors.amount && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{errors.amount}</Text>}
          </View>

          {/* Category Picker */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => { setCategoryId(cat.id); setErrors((e) => ({ ...e, category_id: '' })); }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: categoryId === cat.id ? Colors.primary : Colors.surface,
                    borderWidth: 1,
                    borderColor: categoryId === cat.id ? Colors.primary : Colors.border,
                    marginHorizontal: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  {cat.icon && <Text style={{ fontSize: 14, marginRight: 4 }}>{cat.icon}</Text>}
                  <Text style={{ fontSize: 13, fontWeight: '500', color: categoryId === cat.id ? '#fff' : Colors.text }}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.category_id && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{errors.category_id}</Text>}
          </View>

          {/* Description Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What was this expense for?"
              placeholderTextColor={Colors.textMuted}
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                color: Colors.text,
              }}
            />
          </View>

          {/* Date Input */}
          <DatePickerField
            label="Date *"
            value={expenseDate}
            onChange={setExpenseDate}
            error={errors.expense_date}
          />

          {/* Paid By Picker */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Paid By *</Text>
            <TouchableOpacity
              onPress={() => setShowPayerPicker(!showPayerPicker)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.surface,
                borderRadius: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: errors.paid_by ? Colors.error : Colors.border,
              }}
            >
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: Colors.primaryLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                  {paidBy ? getInitials(payerName) : '?'}
                </Text>
              </View>
              <Text style={{ fontSize: 15, color: Colors.text, flex: 1 }}>{payerName}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            {errors.paid_by && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{errors.paid_by}</Text>}

            {showPayerPicker && (
              <View style={{ backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, marginTop: 4, overflow: 'hidden' }}>
                {activeMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    onPress={() => { setPaidBy(member.id); setShowPayerPicker(false); }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: Colors.border,
                      backgroundColor: paidBy === member.id ? '#eef2ff' : undefined,
                    }}
                  >
                    <View style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: Colors.primaryLight,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 10,
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{getInitials(member.name)}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: paidBy === member.id ? Colors.primary : Colors.text, fontWeight: paidBy === member.id ? '600' : '400' }}>
                      {member.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Split Type Tabs */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Split Type</Text>
            <View style={{ flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' }}>
              {(['equal', 'custom', 'percentage'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSplitType(type)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    alignItems: 'center',
                    backgroundColor: splitType === type ? Colors.primary : undefined,
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: splitType === type ? '#fff' : Colors.textSecondary,
                  }}>
                    {type === 'equal' ? 'Equal' : type === 'custom' ? 'Custom' : 'Percentage'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Split Details */}
          <View style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            padding: 14,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: Colors.border,
          }}>
            {splitType === 'equal' && (
              <>
                <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 10 }}>
                  Select members to split equally
                  {(parseFloat(amount) || 0) > 0 && equalSplitMembers.length > 0 && (
                    ` - ${formatCurrency(getEqualShareAmount())} each`
                  )}
                </Text>
                {activeMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    onPress={() => toggleEqualMember(member.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderTopWidth: 1,
                      borderTopColor: Colors.border,
                    }}
                  >
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: equalSplitMembers.includes(member.id) ? Colors.primary : Colors.border,
                      backgroundColor: equalSplitMembers.includes(member.id) ? Colors.primary : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 10,
                    }}>
                      {equalSplitMembers.includes(member.id) && (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      )}
                    </View>
                    <Text style={{ fontSize: 14, color: Colors.text, flex: 1 }}>{member.name}</Text>
                    {(parseFloat(amount) || 0) > 0 && equalSplitMembers.includes(member.id) && (
                      <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                        {formatCurrency(getEqualShareAmount())}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {splitType === 'custom' && (
              <>
                <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 10 }}>
                  Enter amount for each member
                </Text>
                {activeMembers.map((member) => (
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
                    <Text style={{ fontSize: 14, color: Colors.text, flex: 1 }}>{member.name}</Text>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: Colors.background,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      width: 120,
                    }}>
                      <Text style={{ fontSize: 14, color: Colors.textMuted }}>₹</Text>
                      <TextInput
                        value={customAmounts[member.id] || ''}
                        onChangeText={(val) => setCustomAmounts((prev) => ({ ...prev, [member.id]: val }))}
                        placeholder="0"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="decimal-pad"
                        style={{ flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 6, paddingHorizontal: 4 }}
                      />
                    </View>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text }}>Total</Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: Math.abs(getCustomTotal() - (parseFloat(amount) || 0)) < 0.01 ? Colors.success : Colors.error,
                  }}>
                    {formatCurrency(getCustomTotal())} / {formatCurrency(parseFloat(amount) || 0)}
                  </Text>
                </View>
              </>
            )}

            {splitType === 'percentage' && (
              <>
                <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 10 }}>
                  Enter percentage for each member
                </Text>
                {activeMembers.map((member) => (
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
                    <Text style={{ fontSize: 14, color: Colors.text, flex: 1 }}>{member.name}</Text>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: Colors.background,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      width: 100,
                    }}>
                      <TextInput
                        value={percentages[member.id] || ''}
                        onChangeText={(val) => setPercentages((prev) => ({ ...prev, [member.id]: val }))}
                        placeholder="0"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="decimal-pad"
                        style={{ flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 6, paddingHorizontal: 4 }}
                      />
                      <Text style={{ fontSize: 14, color: Colors.textMuted }}>%</Text>
                    </View>
                    {(parseFloat(amount) || 0) > 0 && (parseFloat(percentages[member.id] || '0') || 0) > 0 && (
                      <Text style={{ fontSize: 12, color: Colors.textSecondary, marginLeft: 8, width: 70, textAlign: 'right' }}>
                        {formatCurrency(Math.round((parseFloat(amount) || 0) * (parseFloat(percentages[member.id] || '0') || 0) / 100 * 100) / 100)}
                      </Text>
                    )}
                  </View>
                ))}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text }}>Total</Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: Math.abs(getPercentageTotal() - 100) < 0.01 ? Colors.success : Colors.error,
                  }}>
                    {getPercentageTotal().toFixed(1)}% / 100%
                  </Text>
                </View>
              </>
            )}
          </View>

          {errors.splits && (
            <Text style={{ color: Colors.error, fontSize: 12, marginBottom: 16, marginTop: -12 }}>{errors.splits}</Text>
          )}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: Colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 32,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Update Expense</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
