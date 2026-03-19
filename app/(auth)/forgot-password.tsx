import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { authService } from '../../services/auth';
import { Colors } from '../../constants/colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authService.forgotPassword(email.trim().toLowerCase());
      setSuccessMessage(response.data.message);
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: Colors.background }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: '#dcfce7',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 32 }}>✓</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 8 }}>Check Your Email</Text>
        <Text style={{ fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          {successMessage}{'\n'}
          <Text style={{ fontWeight: '600', color: Colors.text }}>{email}</Text>
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={{
            backgroundColor: Colors.primary,
            borderRadius: 12,
            paddingHorizontal: 32,
            paddingVertical: 14,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: 'absolute', top: 60, left: 24 }}
        >
          <Text style={{ fontSize: 16, color: Colors.primary, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: '#fef3c7',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 32 }}>🔑</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.text }}>Forgot Password?</Text>
          <Text style={{ fontSize: 15, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
            Enter your email and we'll send you a reset link
          </Text>
        </View>

        {/* Email */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={{
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: error ? Colors.error : Colors.border,
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              color: Colors.text,
            }}
          />
          {error ? (
            <Text style={{ color: Colors.error, fontSize: 13, marginTop: 4 }}>{error}</Text>
          ) : null}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? Colors.primaryLight : Colors.primary,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 15 }}>Remember your password? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 15 }}>Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
