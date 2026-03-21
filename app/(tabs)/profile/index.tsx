import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { profileService } from '../../../services/profile';
import { resolveUrl } from '../../../utils/format';
import { Colors } from '../../../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useToast } from '../../../components/Toast';
import { useConfirm } from '../../../components/ConfirmDialog';

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ padding: 16 }}>
        {/* Avatar & Name */}
        <View style={{ alignItems: 'center', marginBottom: 24, paddingTop: 8 }}>
          {user?.avatar_url ? (
            <Image
              source={{ uri: resolveUrl(user.avatar_url)! }}
              style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 12 }}
            />
          ) : (
            <View style={{
              width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary,
              justifyContent: 'center', alignItems: 'center', marginBottom: 12,
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff' }}>{getInitials()}</Text>
            </View>
          )}
          <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.text }}>{user?.name}</Text>
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
            </>
          )}
        </View>

        {/* Notification Preferences */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 12 }}>Notifications</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
              <Text style={{ fontSize: 14, color: Colors.text, marginLeft: 10 }}>Email Notifications</Text>
            </View>
            <Text style={{ fontSize: 13, color: user?.notification_email ? Colors.success : Colors.textMuted }}>
              {user?.notification_email ? 'On' : 'Off'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
              <Text style={{ fontSize: 14, color: Colors.text, marginLeft: 10 }}>Push Notifications</Text>
            </View>
            <Text style={{ fontSize: 13, color: Colors.textMuted }}>Coming soon</Text>
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
