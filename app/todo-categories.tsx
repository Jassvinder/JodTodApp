import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { todoService } from '../services/todos';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import BottomNav from '../components/BottomNav';
import type { TodoCategory } from '../types/models';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b',
];

export default function TodoCategoriesScreen() {
  const toast = useToast();
  const confirm = useConfirm();
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add/Edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await todoService.getCategories();
      setCategories(response.data.data);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load categories.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchCategories();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setSelectedColor(PRESET_COLORS[0]);
  };

  const handleEdit = (cat: TodoCategory) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSelectedColor(cat.color);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.show('Please enter a category name.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const response = await todoService.updateCategory(editingId, { name: name.trim(), color: selectedColor });
        setCategories((prev) => prev.map((c) => (c.id === editingId ? response.data.data : c)));
      } else {
        const response = await todoService.createCategory({ name: name.trim(), color: selectedColor });
        setCategories((prev) => [...prev, response.data.data]);
      }
      resetForm();
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to save category.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (cat: TodoCategory) => {
    confirm.show({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${cat.name}"?`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await todoService.deleteCategory(cat.id);
          setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Failed to delete category.', 'error');
        }
      },
    });
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
      <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 8 }}>
        {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
      </Text>
    </View>
  );

  const renderCategoryItem = ({ item }: { item: TodoCategory }) => (
    <TouchableOpacity
      onPress={() => handleEdit(item)}
      onLongPress={() => handleDelete(item)}
      style={{
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Color Dot */}
      <View style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: item.color,
        marginRight: 12,
      }} />

      {/* Name */}
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text }}>
        {item.name}
      </Text>

      {/* Edit hint */}
      <Ionicons name="create-outline" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
      <Ionicons name="color-palette-outline" size={48} color={Colors.textMuted} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 }}>No categories yet</Text>
      <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
        Tap + to create your first category
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1 }}>
      {/* Add/Edit Form - outside FlatList to prevent keyboard dismiss on re-render */}
      {showForm && (
        <View style={{
          backgroundColor: Colors.surface,
          borderRadius: 12,
          padding: 16,
          margin: 16,
          marginBottom: 0,
          borderWidth: 1,
          borderColor: Colors.border,
        }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 12 }}>
            {editingId ? 'Edit Category' : 'New Category'}
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Category name"
            placeholderTextColor={Colors.textMuted}
            autoFocus
            style={{
              backgroundColor: Colors.background,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              color: Colors.text,
              marginBottom: 12,
            }}
          />

          <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 8 }}>Color</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {PRESET_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                style={{
                  width: 36, height: 36, borderRadius: 18, backgroundColor: color,
                  justifyContent: 'center', alignItems: 'center',
                  borderWidth: 3, borderColor: selectedColor === color ? Colors.text : 'transparent',
                }}
              >
                {selectedColor === color && <Ionicons name="checkmark" size={18} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={resetForm}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 10,
                backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 10,
                backgroundColor: Colors.primary, alignItems: 'center',
              }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#fff' }}>
                  {editingId ? 'Update' : 'Add'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      />

      {/* FAB - Add Category */}
      {!showForm && (
        <TouchableOpacity
          onPress={() => { resetForm(); setShowForm(true); }}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: Colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
      </View>
      <BottomNav />
    </View>
  );
}
