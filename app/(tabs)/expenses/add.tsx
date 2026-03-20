import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { expenseService } from '../../../services/expenses';
import { Colors } from '../../../constants/colors';
import { API_BASE_URL } from '../../../constants/config';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Category } from '../../../types/models';

let ImagePicker: typeof import('expo-image-picker') | null = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {
  // expo-image-picker not installed
}

export default function AddExpenseScreen() {
  const router = useRouter();

  // Form state
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [image1, setImage1] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [image2, setImage2] = useState<{ uri: string; name: string; type: string } | null>(null);

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCategories, setLoadingCategories] = useState(true);

  const descriptionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await expenseService.getCategories();
      setCategories(response.data.data);
    } catch {
      Alert.alert('Error', 'Failed to load categories.');
    } finally {
      setLoadingCategories(false);
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
      Alert.alert('Not Available', 'expo-image-picker is not installed. Run: npx expo install expo-image-picker');
      return;
    }

    Alert.alert('Add Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const permission = await ImagePicker!.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permission Required', 'Camera access is needed to take photos.');
            return;
          }
          const result = await ImagePicker!.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            allowsEditing: true,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const imageData = {
              uri: asset.uri,
              name: asset.fileName || `photo_${Date.now()}.jpg`,
              type: asset.mimeType || 'image/jpeg',
            };
            if (slot === 1) setImage1(imageData);
            else setImage2(imageData);
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const permission = await ImagePicker!.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permission Required', 'Gallery access is needed to pick photos.');
            return;
          }
          const result = await ImagePicker!.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            allowsEditing: true,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const imageData = {
              uri: asset.uri,
              name: asset.fileName || `photo_${Date.now()}.jpg`,
              type: asset.mimeType || 'image/jpeg',
            };
            if (slot === 1) setImage1(imageData);
            else setImage2(imageData);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
      if (description.trim()) formData.append('description', description.trim());

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

      await expenseService.createExpense(formData);
      router.back();
    } catch (error: any) {
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const key in fieldErrors) mapped[key] = fieldErrors[key][0];
        setErrors(mapped);
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to save expense.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingCategories) {
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
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Date *</Text>
            <TextInput
              value={expenseDate}
              onChangeText={setExpenseDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: errors.expense_date ? Colors.error : Colors.border,
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                color: Colors.text,
              }}
            />
            {errors.expense_date && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{errors.expense_date}</Text>}
          </View>

          {/* Image Upload */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Receipt Photos (optional)</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Image Slot 1 */}
              <TouchableOpacity
                onPress={() => image1 ? setImage1(null) : pickImage(1)}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderStyle: image1 ? 'solid' : 'dashed',
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
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={24} color={Colors.textMuted} />
                    <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>Photo 1</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Image Slot 2 */}
              <TouchableOpacity
                onPress={() => image2 ? setImage2(null) : pickImage(2)}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderStyle: image2 ? 'solid' : 'dashed',
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
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Save Expense</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
