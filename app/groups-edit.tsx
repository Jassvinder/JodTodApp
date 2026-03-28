import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { groupService } from '../services/groups';
import { Colors } from '../constants/colors';
import { resolveUrl } from '../utils/format';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import BottomNav from '../components/BottomNav';

let ImagePicker: typeof import('expo-image-picker') | null = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {
  // expo-image-picker not installed
}

interface PickedImage {
  uri: string;
  name: string;
  type: string;
}

export default function EditGroupScreen() {
  const router = useRouter();
  const { id, name: initialName, description: initialDescription, photoUrl: initialPhotoUrl } = useLocalSearchParams<{
    id: string;
    name: string;
    description: string;
    photoUrl: string;
  }>();
  const groupId = parseInt(id || '0', 10);
  const toast = useToast();
  const confirm = useConfirm();

  const [name, setName] = useState(initialName || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(resolveUrl(initialPhotoUrl) || '');
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pickPhoto = async () => {
    if (!ImagePicker) {
      toast.show('expo-image-picker is not installed.', 'error');
      return;
    }

    const handlePhotoResult = (asset: any) => {
      setPhoto({
        uri: asset.uri,
        name: asset.fileName || `group_photo_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
      setRemovePhoto(false);
    };

    confirm.show({
      title: 'Group Photo',
      message: 'Choose a source',
      confirmText: 'Camera',
      cancelText: 'Gallery',
      danger: false,
      onConfirm: async () => {
        const permission = await ImagePicker!.requestCameraPermissionsAsync();
        if (!permission.granted) {
          toast.show('Camera access is needed.', 'error');
          return;
        }
        const result = await ImagePicker!.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: true,
          aspect: [1, 1],
        });
        if (!result.canceled && result.assets[0]) {
          handlePhotoResult(result.assets[0]);
        }
      },
      onCancel: async () => {
        const permission = await ImagePicker!.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          toast.show('Gallery access is needed.', 'error');
          return;
        }
        const result = await ImagePicker!.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: true,
          aspect: [1, 1],
        });
        if (!result.canceled && result.assets[0]) {
          handlePhotoResult(result.assets[0]);
        }
      },
    });
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setExistingPhotoUrl('');
    setRemovePhoto(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) newErrors.name = 'Group name must be at least 2 characters';
    if (name.trim().length > 100) newErrors.name = 'Group name is too long';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('_method', 'PUT');

      if (photo) {
        formData.append('photo', {
          uri: photo.uri,
          name: photo.name,
          type: photo.type,
        } as any);
      } else if (removePhoto) {
        formData.append('remove_photo', '1');
      }

      await groupService.updateGroup(groupId, formData);
      router.back();
    } catch (error: any) {
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const key in fieldErrors) mapped[key] = fieldErrors[key][0];
        setErrors(mapped);
      } else {
        toast.show(error.response?.data?.message || 'Failed to update group.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const hasPhoto = photo || (existingPhotoUrl && !removePhoto);
  const displayUri = photo ? photo.uri : existingPhotoUrl;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ padding: 16 }}>
          {/* Group Photo */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View>
              <TouchableOpacity onPress={pickPhoto} activeOpacity={0.7}>
                {hasPhoto && displayUri ? (
                  <Image
                    source={{ uri: displayUri }}
                    style={{ width: 100, height: 100, borderRadius: 50 }}
                  />
                ) : (
                  <View style={{
                    width: 100, height: 100, borderRadius: 50,
                    backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    <Ionicons name="camera-outline" size={28} color={Colors.textMuted} />
                    <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              {hasPhoto && (
                <TouchableOpacity
                  onPress={() => confirm.show({
                    title: 'Remove Photo',
                    message: 'Are you sure you want to remove this photo?',
                    confirmText: 'Remove',
                    danger: true,
                    onConfirm: handleRemovePhoto,
                  })}
                  style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 26, height: 26, borderRadius: 13,
                    backgroundColor: Colors.error, justifyContent: 'center', alignItems: 'center',
                    borderWidth: 2, borderColor: Colors.background,
                  }}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            {hasPhoto && (
              <TouchableOpacity onPress={pickPhoto} style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '500' }}>Change Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Group Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Group name"
              placeholderTextColor={Colors.textMuted}
              maxLength={100}
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: errors.name ? Colors.error : Colors.border,
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                color: Colors.text,
              }}
            />
            {errors.name && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{errors.name}</Text>}
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What is this group for?"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              maxLength={500}
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                color: Colors.text,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
            />
          </View>

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
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Update Group</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    <BottomNav />
    </View>
  );
}
