import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

export default function VerifyEmailScreen() {
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const { user, logout, loadToken } = useAuthStore();
  const router = useRouter();
  const toast = useToast();

  const handleResend = async () => {
    setLoading(true);
    try {
      const response = await api.post('/email/verification-notification');
      toast.show(response.data.message || 'Verification email sent.');
      setResent(true);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to resend verification email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      await loadToken();
      // loadToken fetches fresh user data - if verified, root layout will redirect to tabs
    } catch {
      toast.show('Could not check verification status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: Colors.background }}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={{ width: 80, height: 64, marginBottom: 24 }}
        resizeMode="contain"
      />

      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: '#fef3c7',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Text style={{ fontSize: 32 }}>✉️</Text>
      </View>

      <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 8 }}>Verify Your Email</Text>
      <Text style={{ fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 8 }}>
        We've sent a verification link to
      </Text>
      <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 24 }}>
        {user?.email}
      </Text>
      <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 32 }}>
        Please check your inbox and click the verification link. Then tap the button below to continue.
      </Text>

      <TouchableOpacity
        onPress={handleCheckVerification}
        disabled={loading}
        style={{
          backgroundColor: loading ? Colors.primaryLight : Colors.primary,
          borderRadius: 12,
          paddingHorizontal: 32,
          paddingVertical: 14,
          width: '100%',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>I've Verified My Email</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleResend}
        disabled={loading}
        style={{ marginBottom: 24 }}
      >
        <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14 }}>
          {resent ? 'Email Resent! Send Again?' : 'Resend Verification Email'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={logout}>
        <Text style={{ color: Colors.textMuted, fontSize: 14 }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
