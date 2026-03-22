import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { expenseService } from '../../../services/expenses';
import { Colors } from '../../../constants/colors';
import { API_BASE_URL } from '../../../constants/config';
import Ionicons from '@expo/vector-icons/Ionicons';
import DatePickerField from '../../../components/DatePickerField';
import { useToast } from '../../../components/Toast';
import { useConfirm } from '../../../components/ConfirmDialog';
import type { Category, Expense } from '../../../types/models';

let ImagePicker: typeof import('expo-image-picker') | null = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {
  // expo-image-picker not installed
}

export default function EditExpenseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const confirm = useConfirm();

  // Form state
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');

  // Image state
  const [image1, setImage1] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [image2, setImage2] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [existingImage1, setExistingImage1] = useState<string | null>(null);
  const [existingImage2, setExistingImage2] = useState<string | null>(null);
  const [removeImage1, setRemoveImage1] = useState(false);
  const [removeImage2, setRemoveImage2] = useState(false);

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const descriptionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [expenseRes, catRes] = await Promise.all([
        expenseService.getExpense(parseInt(id!)),
        expenseService.getCategories(),
      ]);

      const expense = expenseRes.data.data;
      setCategories(catRes.data.data);

      // Pre-fill form
      setAmount(expense.amount.toString());
      setCategoryId(expense.category_id);
      setDescription(expense.description || '');
      setExpenseDate(expense.expense_date);

      if (expense.image_1) setExistingImage1(expense.image_1);
      if (expense.image_2) setExistingImage2(expense.image_2);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load expense.', 'error');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await expenseService.getSuggestions(query);
      setSuggestions(response.data.data);
      setShowSuggestions(response.data.data.length > 0);
    } catch {
      // Silent fail
    }
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    if (descriptionTimeout.current) clearTimeout(descriptionTimeout.current);
    descriptionTimeout.current = setTimeout(() => fetchSuggestions(text), 300);
  };

  const selectSuggestion = (text: string) => {
    setDescription(text);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const pickImage = async (slot: 1 | 2) => {
    if (!ImagePicker) {
      toast.show('expo-image-picker is not installed. Run: npx expo install expo-image-picker', 'error');
      return;
    }

    const handleImageResult = (asset: any) => {
      const imageData = {
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      };
      if (slot === 1) {
        setImage1(imageData);
        setExistingImage1(null);
        setRemoveImage1(false);
      } else {
        setImage2(imageData);
        setExistingImage2(null);
        setRemoveImage2(false);
      }
    };

    confirm.show({
      title: 'Add Photo',
      message: 'Choose a source',
      confirmText: 'Camera',
      cancelText: 'Gallery',
      danger: false,
      onConfirm: async () => {
        const permission = await ImagePicker!.requestCameraPermissionsAsync();
        if (!permission.granted) {
          toast.show('Camera access is needed to take photos.', 'error');
          return;
        }
        const result = await ImagePicker!.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: true,
        });
        if (!result.canceled && result.assets[0]) {
          handleImageResult(result.assets[0]);
        }
      },
      onCancel: async () => {
        const permission = await ImagePicker!.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          toast.show('Gallery access is needed to pick photos.', 'error');
          return;
        }
        const result = await ImagePicker!.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: true,
        });
        if (!result.canceled && result.assets[0]) {
          handleImageResult(result.assets[0]);
        }
      },
    });
  };

  const handleRemoveExistingImage = (slot: 1 | 2) => {
    if (slot === 1) {
      setExistingImage1(null);
      setRemoveImage1(true);
    } else {
      setExistingImage2(null);
      setRemoveImage2(true);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Enter a valid amount';
    if (!categoryId) newErrors.category_id = 'Select a category';
    if (!expenseDate) newErrors.expense_date = 'Select a date';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('amount', parseFloat(amount).toString());
      formData.append('category_id', categoryId!.toString());
      formData.append('expense_date', expenseDate);
      if (description.trim()) {
        formData.append('description', description.trim());
      } else {
        formData.append('description', '');
      }

      if (removeImage1) formData.append('remove_image_1', '1');
      if (removeImage2) formData.append('remove_image_2', '1');

      if (image1) {
        formData.append('image_1', {
          uri: image1.uri,
          name: image1.name,
          type: image1.type,
        } as any);
      }
      if (image2) {
        formData.append('image_2', {
          uri: image2.uri,
          name: image2.name,
          type: image2.type,
        } as any);
      }

      await expenseService.updateExpense(parseInt(id!), formData);
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

  const getImageUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}/storage/${path}`;
  };

  if (loading) {
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

          {/* Description Input with Autocomplete */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Description</Text>
            <TextInput
              value={description}
              onChangeText={handleDescriptionChange}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
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
            {errors.description && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{errors.description}</Text>}
          </View>

          {/* Date Input */}
          <DatePickerField
            label="Date *"
            value={expenseDate}
            onChange={setExpenseDate}
            error={errors.expense_date}
            maxDate={new Date()}
          />

          {/* Image Upload */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Receipt Photos (optional)</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Image Slot 1 */}
              <TouchableOpacity
                onPress={() => {
                  if (image1) { setImage1(null); }
                  else if (existingImage1) { handleRemoveExistingImage(1); }
                  else { pickImage(1); }
                }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderStyle: (image1 || existingImage1) ? 'solid' : 'dashed',
                  backgroundColor: Colors.surface,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {image1 ? (
                  <View style={{ width: '100%', height: '100%' }}>
                    <Image source={{ uri: image1.uri }} style={{ width: '100%', height: '100%' }} />
                    <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="close" size={14} color="#fff" />
                    </View>
                  </View>
                ) : existingImage1 ? (
                  <View style={{ width: '100%', height: '100%' }}>
                    <Image source={{ uri: getImageUrl(existingImage1) }} style={{ width: '100%', height: '100%' }} />
                    <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="close" size={14} color="#fff" />
                    </View>
                  </View>
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={24} color={Colors.textMuted} />
                    <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>Photo 1</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Image Slot 2 */}
              <TouchableOpacity
                onPress={() => {
                  if (image2) { setImage2(null); }
                  else if (existingImage2) { handleRemoveExistingImage(2); }
                  else { pickImage(2); }
                }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderStyle: (image2 || existingImage2) ? 'solid' : 'dashed',
                  backgroundColor: Colors.surface,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {image2 ? (
                  <View style={{ width: '100%', height: '100%' }}>
                    <Image source={{ uri: image2.uri }} style={{ width: '100%', height: '100%' }} />
                    <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="close" size={14} color="#fff" />
                    </View>
                  </View>
                ) : existingImage2 ? (
                  <View style={{ width: '100%', height: '100%' }}>
                    <Image source={{ uri: getImageUrl(existingImage2) }} style={{ width: '100%', height: '100%' }} />
                    <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="close" size={14} color="#fff" />
                    </View>
                  </View>
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={24} color={Colors.textMuted} />
                    <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>Photo 2</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Update Expense</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
