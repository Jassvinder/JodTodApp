import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { profileService } from '../../../services/profile';
import { resolveUrl } from '../../../utils/format';
import { Colors } from '../../../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useToast } from '../../../components/Toast';
import { useConfirm } from '../../../components/ConfirmDialog';

let ImagePicker: typeof import('expo-image-picker') | null = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {
  // expo-image-picker not installed
}

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delete account state
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Avatar state
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Phone verification state
  const [showPhoneEdit, setShowPhoneEdit] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDebug, setOtpDebug] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [removingPhone, setRemovingPhone] = useState(false);
  const [phoneErrors, setPhoneErrors] = useState<Record<string, string>>({});

  // Reset edit/delete UI state on every visit (do not retain from previous visit)
  useFocusEffect(
    useCallback(() => {
      setEditing(false);
      setName(user?.name || '');
      setEmail(user?.email || '');
      setErrors({});
      setShowDelete(false);
      setDeletePassword('');
      setShowPhoneEdit(false);
      setPhoneNumber('');
      setPhoneOtp('');
      setOtpSent(false);
      setOtpDebug(null);
      setPhoneErrors({});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])
  );

  const getInitials = (): string => {
    if (!user?.name) return '?';
    const parts = user.name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  const handleSaveProfile = async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSaving(true);
    setErrors({});
    try {
      const response = await profileService.updateProfile({ name: name.trim() });
      setUser(response.data.data);
      setEditing(false);
      toast.show(response.data.message);
    } catch (error: any) {
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const key in fieldErrors) mapped[key] = fieldErrors[key][0];
        setErrors(mapped);
      } else {
        toast.show(error.response?.data?.message || 'Failed to update profile.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.show('Please enter your password.', 'error');
      return;
    }
    setDeleting(true);
    try {
      await profileService.deleteAccount(deletePassword);
      await logout();
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to delete account.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    confirm.show({
      title: 'Delete Account',
      message: 'Are you sure? All your data will be permanently deleted. This cannot be undone.',
      confirmText: 'Continue',
      danger: true,
      onConfirm: () => setShowDelete(true),
    });
  };

  const uploadAvatar = async (asset: { base64?: string | null; mimeType?: string }) => {
    if (!asset.base64) {
      toast.show('Could not read image data.', 'error');
      return;
    }
    setAvatarUploading(true);
    try {
      const dataUri = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
      const response = await profileService.updateAvatar(dataUri);
      setUser({ ...user!, avatar_url: response.data.avatar_url });
      toast.show('Profile photo updated.');
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to update photo.', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const pickAvatar = () => {
    if (!ImagePicker) {
      toast.show('expo-image-picker is not installed.', 'error');
      return;
    }

    confirm.show({
      title: 'Profile Photo',
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
          base64: true,
        });
        if (!result.canceled && result.assets[0]) {
          await uploadAvatar(result.assets[0]);
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
          base64: true,
        });
        if (!result.canceled && result.assets[0]) {
          await uploadAvatar(result.assets[0]);
        }
      },
    });
  };

  const handleRemoveAvatar = () => {
    confirm.show({
      title: 'Remove Photo',
      message: 'Remove your profile photo?',
      confirmText: 'Remove',
      danger: true,
      onConfirm: async () => {
        setAvatarUploading(true);
        try {
          await profileService.destroyAvatar();
          setUser({ ...user!, avatar: null, avatar_url: null });
          toast.show('Profile photo removed.');
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Failed to remove photo.', 'error');
        } finally {
          setAvatarUploading(false);
        }
      },
    });
  };

  const closePhoneEdit = () => {
    setShowPhoneEdit(false);
    setPhoneNumber('');
    setPhoneOtp('');
    setOtpSent(false);
    setOtpDebug(null);
    setPhoneErrors({});
  };

  const handleSendPhoneOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      setPhoneErrors({ phone: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }
    setPhoneErrors({});
    setSendingOtp(true);
    try {
      const response = await profileService.sendPhoneOtp(phoneNumber);
      setOtpSent(true);
      setOtpDebug(response.data.otp_debug);
      toast.show(response.data.message);
    } catch (error: any) {
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const key in fieldErrors) mapped[key] = fieldErrors[key][0];
        setPhoneErrors(mapped);
      } else {
        toast.show(error.response?.data?.message || 'Failed to send OTP.', 'error');
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) {
      setPhoneErrors({ otp: 'Enter the 6-digit code.' });
      return;
    }
    setPhoneErrors({});
    setVerifyingOtp(true);
    try {
      const response = await profileService.verifyPhoneOtp(phoneNumber, phoneOtp);
      setUser({ ...user!, phone: response.data.phone, phone_verified_at: new Date().toISOString() });
      toast.show(response.data.message);
      closePhoneEdit();
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Invalid or expired OTP.', 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleRemovePhone = () => {
    confirm.show({
      title: 'Remove Phone Number',
      message: 'Remove your verified phone number?',
      confirmText: 'Remove',
      danger: true,
      onConfirm: async () => {
        setRemovingPhone(true);
        try {
          const response = await profileService.removePhone();
          setUser({ ...user!, phone: null, phone_verified_at: null });
          toast.show(response.data.message);
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Failed to remove phone number.', 'error');
        } finally {
          setRemovingPhone(false);
        }
      },
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ padding: 16 }}>
        {/* Avatar & Name */}
        <View style={{ alignItems: 'center', marginBottom: 24, paddingTop: 8 }}>
          <View style={{ width: 80, height: 80, marginBottom: 12 }}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: resolveUrl(user.avatar_url)! }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
            ) : (
              <View style={{
                width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary,
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff' }}>{getInitials()}</Text>
              </View>
            )}
            {avatarUploading && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}
            {user?.avatar_url && !avatarUploading && (
              <TouchableOpacity
                onPress={handleRemoveAvatar}
                style={{ position: 'absolute', top: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.error, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.background }}
              >
                <Ionicons name="close" size={13} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={pickAvatar} disabled={avatarUploading} style={{ marginBottom: 4 }}>
            <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 13 }}>Change Photo</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 8 }}>{user?.name}</Text>
          <Text style={{ fontSize: 14, color: Colors.textSecondary }}>{user?.email}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            {user?.email_verified_at ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                <Text style={{ fontSize: 12, color: Colors.success, marginLeft: 4 }}>Email Verified</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Ionicons name="alert-circle" size={14} color="#d97706" />
                <Text style={{ fontSize: 12, color: '#92400e', marginLeft: 4 }}>Email Unverified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Profile Info Card */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text }}>Profile Information</Text>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14 }}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 4 }}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={{ backgroundColor: Colors.background, borderWidth: 1, borderColor: errors.name ? Colors.error : Colors.border, borderRadius: 10, padding: 12, fontSize: 15, color: Colors.text }}
                />
                {errors.name && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 2 }}>{errors.name}</Text>}
              </View>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.textMuted, marginBottom: 4 }}>Email</Text>
                <View style={{ backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12 }}>
                  <Text style={{ fontSize: 15, color: Colors.textMuted }}>{user?.email}</Text>
                </View>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>Email requires verification and can't be changed here.</Text>
              </View>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.textMuted, marginBottom: 4 }}>Phone</Text>
                <View style={{ backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12 }}>
                  <Text style={{ fontSize: 15, color: Colors.textMuted }}>{user?.phone ? `+91 ${user.phone}` : 'Not added'}</Text>
                </View>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>Phone requires OTP verification and can't be changed here.</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => { setEditing(false); setName(user?.name || ''); setErrors({}); }}
                  style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' }}
                >
                  <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={saving}
                  style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' }}
                >
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <ProfileRow icon="person-outline" label="Name" value={user?.name || ''} />
              <ProfileRow icon="mail-outline" label="Email" value={user?.email || ''} />
              <ProfileRow icon="call-outline" label="Phone" value={user?.phone ? `+91 ${user.phone}` : 'Not added'} />
              <ProfileRow icon="cash-outline" label="Currency" value={user?.currency || 'INR'} />
              {!showPhoneEdit && (
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                  <TouchableOpacity onPress={() => { setPhoneNumber(user?.phone || ''); setShowPhoneEdit(true); }}>
                    <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 13 }}>
                      {user?.phone ? 'Change Phone Number' : 'Add Phone Number'}
                    </Text>
                  </TouchableOpacity>
                  {user?.phone && (
                    <TouchableOpacity onPress={handleRemovePhone} disabled={removingPhone}>
                      {removingPhone ? (
                        <ActivityIndicator size="small" color={Colors.error} />
                      ) : (
                        <Text style={{ color: Colors.error, fontWeight: '600', fontSize: 13 }}>Remove</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}

          {showPhoneEdit && (
            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border }}>
              {!otpSent ? (
                <>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 4 }}>10-digit mobile number</Text>
                  <TextInput
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, '').slice(0, 10))}
                    keyboardType="number-pad"
                    maxLength={10}
                    placeholder="9876543210"
                    placeholderTextColor={Colors.textMuted}
                    style={{ backgroundColor: Colors.background, borderWidth: 1, borderColor: phoneErrors.phone ? Colors.error : Colors.border, borderRadius: 10, padding: 12, fontSize: 15, color: Colors.text }}
                  />
                  {phoneErrors.phone && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 2 }}>{phoneErrors.phone}</Text>}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity onPress={closePhoneEdit} style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' }}>
                      <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSendPhoneOtp} disabled={sendingOtp} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' }}>
                      {sendingOtp ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Send OTP</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 4 }}>6-digit code sent to +91 {phoneNumber}</Text>
                  <TextInput
                    value={phoneOtp}
                    onChangeText={(text) => setPhoneOtp(text.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="123456"
                    placeholderTextColor={Colors.textMuted}
                    style={{ backgroundColor: Colors.background, borderWidth: 1, borderColor: phoneErrors.otp ? Colors.error : Colors.border, borderRadius: 10, padding: 12, fontSize: 15, color: Colors.text, letterSpacing: 4 }}
                  />
                  {phoneErrors.otp && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 2 }}>{phoneErrors.otp}</Text>}
                  {otpDebug && <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 4 }}>Dev OTP: {otpDebug}</Text>}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity onPress={closePhoneEdit} style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' }}>
                      <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleVerifyPhoneOtp} disabled={verifyingOtp} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' }}>
                      {verifyingOtp ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Verify</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* Notification Preferences */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 12 }}>Notifications</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
              <Text style={{ fontSize: 14, color: Colors.text, marginLeft: 10 }}>Email Notifications (Weekly Summary & Settlements)</Text>
            </View>
            <Text style={{ fontSize: 13, color: user?.notification_email ? Colors.success : Colors.textMuted }}>
              {user?.notification_email ? 'On' : 'Off'}
            </Text>
          </View>
        </View>

        {/* Quick Links */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 12 }}>Quick Links</Text>
          <TouchableOpacity
            onPress={() => router.push('/contacts')}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border }}
          >
            <Ionicons name="people-outline" size={22} color={Colors.primary} />
            <Text style={{ fontSize: 15, color: Colors.text, fontWeight: '500', marginLeft: 10, flex: 1 }}>My Contacts</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border }}>
          <TouchableOpacity onPress={logout} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
            <Ionicons name="log-out-outline" size={22} color={Colors.error} />
            <Text style={{ fontSize: 15, color: Colors.error, fontWeight: '500', marginLeft: 10 }}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account */}
        {showDelete ? (
          <View style={{ backgroundColor: '#fee2e2', borderRadius: 12, padding: 16, marginBottom: 32, borderWidth: 1, borderColor: '#fca5a5' }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#991b1b', marginBottom: 8 }}>Delete Account</Text>
            <Text style={{ fontSize: 13, color: '#991b1b', marginBottom: 12 }}>Enter your password to confirm. This action is irreversible.</Text>
            <TextInput
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#fca5a5', borderRadius: 10, padding: 12, fontSize: 15, color: Colors.text, marginBottom: 12 }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => { setShowDelete(false); setDeletePassword(''); }} style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fca5a5', alignItems: 'center' }}>
                <Text style={{ color: '#991b1b', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteAccount} disabled={deleting} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: Colors.error, alignItems: 'center' }}>
                {deleting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={confirmDelete} style={{ alignItems: 'center', paddingVertical: 16, marginBottom: 32 }}>
            <Text style={{ fontSize: 14, color: Colors.error }}>Delete Account</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function ProfileRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
      <Ionicons name={icon} size={20} color={Colors.textSecondary} />
      <View style={{ marginLeft: 10, flex: 1 }}>
        <Text style={{ fontSize: 12, color: Colors.textMuted }}>{label}</Text>
        <Text style={{ fontSize: 15, color: Colors.text }}>{value}</Text>
      </View>
    </View>
  );
}
