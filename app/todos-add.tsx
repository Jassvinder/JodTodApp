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
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { todoService } from '../services/todos';
import { contactService } from '../services/contacts';
import { resolveUrl } from '../utils/format';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import DatePickerField from '../components/DatePickerField';
import { useToast } from '../components/Toast';
import type { TodoCategory, Contact } from '../types/models';

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

export default function AddTodoScreen() {
  const router = useRouter();
  const toast = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [assignedName, setAssignedName] = useState('');
  const [reminderAt, setReminderAt] = useState('');

  // UI state
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showContactPicker, setShowContactPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, contactRes] = await Promise.all([
        todoService.getCategories(),
        contactService.getContacts({ page: 1 }),
      ]);
      setCategories(catRes.data.data);
      setContacts(contactRes.data.data);
    } catch {
      // Silent fail
    } finally {
      setLoadingData(false);
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Enter a task title';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await todoService.createTodo({
        title: title.trim(),
        priority,
        due_date: dueDate || null,
        category_id: categoryId,
        assigned_to: assignedTo,
        reminder_at: reminderAt || null,
      });
      router.back();
    } catch (error: any) {
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const key in fieldErrors) mapped[key] = fieldErrors[key][0];
        setErrors(mapped);
      } else {
        toast.show(error.response?.data?.message || 'Failed to save task.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setAssignedTo(contact.contact_user.id);
    setAssignedName(contact.contact_user.name);
    setShowContactPicker(false);
  };

  const handleClearAssigned = () => {
    setAssignedTo(null);
    setAssignedName('');
  };

  if (loadingData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ padding: 16 }}>
          {/* Title Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What needs to be done?"
              placeholderTextColor={Colors.textMuted}
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: errors.title ? Colors.error : Colors.border,
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                color: Colors.text,
              }}
            />
            {errors.title && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{errors.title}</Text>}
          </View>

          {/* Priority Picker */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Priority</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['low', 'medium', 'high'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: priority === p ? PRIORITY_COLORS[p] : Colors.surface,
                    borderWidth: 1,
                    borderColor: priority === p ? PRIORITY_COLORS[p] : Colors.border,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: priority === p ? '#fff' : PRIORITY_COLORS[p] }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Due Date Input */}
          <DatePickerField
            label="Due Date"
            value={dueDate}
            onChange={setDueDate}
            error={errors.due_date}
          />

          {/* Category Picker */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text }}>Category</Text>
              <TouchableOpacity onPress={() => router.push('/todo-categories')}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.primary }}>Manage</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              <TouchableOpacity
                onPress={() => setCategoryId(null)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: categoryId === null ? Colors.primary : Colors.surface,
                  borderWidth: 1,
                  borderColor: categoryId === null ? Colors.primary : Colors.border,
                  marginHorizontal: 4,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: categoryId === null ? '#fff' : Colors.text }}>
                  None
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: categoryId === cat.id ? Colors.primary : Colors.surface,
                    borderWidth: 1,
                    borderColor: categoryId === cat.id ? Colors.primary : Colors.border,
                    marginHorizontal: 4,
                  }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cat.color, marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '500', color: categoryId === cat.id ? '#fff' : Colors.text }}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Assign to Contact */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Assign To</Text>
            {assignedTo ? (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.surface,
                borderRadius: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: Colors.border,
              }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: Colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>{getInitials(assignedName)}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: Colors.text }}>{assignedName}</Text>
                <TouchableOpacity onPress={handleClearAssigned}>
                  <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowContactPicker(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: Colors.surface,
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <Ionicons name="person-add-outline" size={18} color={Colors.textMuted} />
                <Text style={{ fontSize: 14, color: Colors.textMuted, marginLeft: 8 }}>Select a contact</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Reminder Date Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Reminder</Text>
            <TextInput
              value={reminderAt}
              onChangeText={setReminderAt}
              placeholder="YYYY-MM-DD HH:MM"
              placeholderTextColor={Colors.textMuted}
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: errors.reminder_at ? Colors.error : Colors.border,
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                color: Colors.text,
              }}
            />
            {errors.reminder_at && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{errors.reminder_at}</Text>}
          </View>

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
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Save Task</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Contact Picker Modal */}
      <Modal visible={showContactPicker} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text }}>Select Contact</Text>
              <TouchableOpacity onPress={() => setShowContactPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 14, color: Colors.textMuted }}>No contacts found</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectContact(item)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: Colors.surface,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                >
                  {item.contact_user.avatar_url ? (
                    <Image
                      source={{ uri: resolveUrl(item.contact_user.avatar_url)! }}
                      style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }}
                    />
                  ) : (
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: Colors.primary,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>
                        {getInitials(item.contact_user.name)}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text }}>{item.contact_user.name}</Text>
                    <Text style={{ fontSize: 12, color: Colors.textSecondary }}>{item.contact_user.email}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
