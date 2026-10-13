import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { expenseService } from '../services/expenses';
import { Colors } from '../constants/colors';
import type { Category } from '../types/models';

interface Props {
  value: number | null;
  onChange: (categoryId: number) => void;
  error?: string;
}

// Loads expense categories itself and shows a retry option when the list fails or comes back empty.
export default function ExpenseCategoryPicker({ value, onChange, error }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const response = await expenseService.getCategories();
      setCategories(response.data.data ?? []);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const renderBody = () => {
    if (loading) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={{ fontSize: 13, color: Colors.textSecondary, marginLeft: 8 }}>Loading categories...</Text>
        </View>
      );
    }

    if (loadFailed || categories.length === 0) {
      return (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: Colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: Colors.border,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}>
          <Ionicons name="alert-circle-outline" size={18} color={Colors.textSecondary} />
          <Text style={{ flex: 1, fontSize: 13, color: Colors.textSecondary, marginLeft: 8 }}>
            {loadFailed ? 'Could not load categories.' : 'No categories available yet.'}
          </Text>
          <TouchableOpacity onPress={load} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.primary }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" style={{ marginHorizontal: -4 }}>
        {categories.map((cat) => {
          const selected = value === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onChange(cat.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: selected ? Colors.primary : Colors.surface,
                borderWidth: 1,
                borderColor: selected ? Colors.primary : Colors.border,
                marginHorizontal: 4,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {cat.icon && <Text style={{ fontSize: 14, marginRight: 4 }}>{cat.icon}</Text>}
              <Text style={{ fontSize: 13, fontWeight: '500', color: selected ? '#fff' : Colors.text }}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Category *</Text>
      {renderBody()}
      {error ? <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}
