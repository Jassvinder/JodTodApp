import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import type { TodoCategory } from '../types/models';

interface TodoCategoryPickerProps {
  categories: TodoCategory[];
  value: number | null;
  onChange: (categoryId: number | null) => void;
  onManage: () => void;
}

export default function TodoCategoryPicker({ categories, value, onChange, onManage }: TodoCategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCategory = categories.find((category) => category.id === value);

  const selectCategory = (categoryId: number | null) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  return (
    <View style={{ marginBottom: 20, position: 'relative', zIndex: 10, elevation: isOpen ? 10 : 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text }}>Category</Text>
        <TouchableOpacity onPress={onManage} style={{ backgroundColor: '#3730a3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Manage Categories</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => setIsOpen((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        style={{
          flexDirection: 'row', alignItems: 'center', minHeight: 46, paddingHorizontal: 12,
          backgroundColor: Colors.surface, borderWidth: 1, borderColor: isOpen ? Colors.primary : Colors.border,
          borderRadius: 10,
        }}
      >
        {selectedCategory ? (
          <>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedCategory.color, marginRight: 8 }} />
            <Text style={{ flex: 1, fontSize: 14, color: Colors.text }}>{selectedCategory.name}</Text>
          </>
        ) : (
          <Text style={{ flex: 1, fontSize: 14, color: Colors.textMuted }}>No category</Text>
        )}
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      {isOpen && (
        <View style={{
          position: 'absolute', top: 76, left: 0, right: 0, zIndex: 20, elevation: 12,
          backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
          overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6,
        }}>
          <TouchableOpacity
            onPress={() => selectCategory(null)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: value === null ? '#eef2ff' : Colors.surface }}
          >
            <Text style={{ flex: 1, fontSize: 14, color: value === null ? Colors.primary : Colors.text, fontWeight: value === null ? '600' : '400' }}>No category</Text>
            {value === null && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
          </TouchableOpacity>
          {categories.map((category) => {
            const isSelected = value === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => selectCategory(category.id)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: isSelected ? '#eef2ff' : Colors.surface }}
              >
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: category.color, marginRight: 8 }} />
                <Text style={{ flex: 1, fontSize: 14, color: isSelected ? Colors.primary : Colors.text, fontWeight: isSelected ? '600' : '400' }}>{category.name}</Text>
                {isSelected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
