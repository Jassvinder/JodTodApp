import { useState, useRef } from 'react';
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
import { useRouter } from 'expo-router';
import { incomeService } from '../../../services/incomes';
import { Colors } from '../../../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import DatePickerField from '../../../components/DatePickerField';
import { useToast } from '../../../components/Toast';

export default function AddIncomeScreen() {
  const router = useRouter();
  const toast = useToast();

  // Form state
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);

  // UI state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sourceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await incomeService.getSuggestions(query);
      setSuggestions(response.data.data);
      setShowSuggestions(response.data.data.length > 0);
    } catch {
      // Silent fail
    }
  };

  const handleSourceChange = (text: string) => {
    setSource(text);
    if (sourceTimeout.current) clearTimeout(sourceTimeout.current);
    sourceTimeout.current = setTimeout(() => fetchSuggestions(text), 300);
  };

  const selectSuggestion = (text: string) => {
    setSource(text);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Enter a valid amount';
    if (!source.trim()) newErrors.source = 'Enter income source';
    if (!incomeDate) newErrors.income_date = 'Select a date';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await incomeService.createIncome({
        amount: parseFloat(amount),
        source: source.trim(),
        description: description.trim() || undefined,
        income_date: incomeDate,
      });
      router.back();
    } catch (error: any) {
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const key in fieldErrors) mapped[key] = fieldErrors[key][0];
        setErrors(mapped);
      } else {
        toast.show(error.response?.data?.message || 'Failed to save income.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

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
              <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.success, marginRight: 4 }}>₹</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                style={{ flex: 1, fontSize: 28, fontWeight: '700', color: Colors.success, paddingVertical: 16 }}
              />
            </View>
            {errors.amount && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{errors.amount}</Text>}
          </View>

          {/* Source Input with Autocomplete */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Source *</Text>
            <TextInput
              value={source}
              onChangeText={handleSourceChange}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="e.g. Salary, Freelance, Investment..."
              placeholderTextColor={Colors.textMuted}
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: errors.source ? Colors.error : Colors.border,
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                color: Colors.text,
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, marginTop: 4, overflow: 'hidden' }}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => selectSuggestion(s)}
                    style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: i < suggestions.length - 1 ? 1 : 0, borderBottomColor: Colors.border }}
                  >
                    <Text style={{ fontSize: 14, color: Colors.text }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.source && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{errors.source}</Text>}
          </View>

          {/* Description Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Optional details about this income"
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
            {errors.description && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{errors.description}</Text>}
          </View>

          {/* Date Input */}
          <DatePickerField
            label="Date *"
            value={incomeDate}
            onChange={setIncomeDate}
            error={errors.income_date}
            maxDate={new Date()}
          />

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: Colors.success,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 32,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Save Income</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
