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
  Image,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/auth';
import { Colors } from '../../constants/colors';
import { getDeviceName } from '../../utils/device';
import { useToast } from '../../components/Toast';

type AuthTab = 'email' | 'otp';
type OtpStep = 'phone' | 'verify';

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState<AuthTab>('email');

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP login state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [otpDebug, setOtpDebug] = useState<string | null>(null);

  // Shared state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { login, loginWithOtp } = useAuthStore();
  const toast = useToast();

  // --- Email Login ---
  const validateEmail = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async () => {
    if (!validateEmail()) return;
    setLoading(true);
    setErrors({});
    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
        device_name: getDeviceName(),
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Something went wrong. Please try again.';
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const key in fieldErrors) {
          mapped[key] = fieldErrors[key][0];
        }
        setErrors(mapped);
      } else {
        toast.show(message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- OTP Login ---
  const validatePhone = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(phone.trim())) newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validatePhone()) return;
    setLoading(true);
    setErrors({});
    try {
      const response = await authService.sendOtp(phone.trim());
      setOtpDebug(response.data.data?.otp_debug || null);
      setOtpStep('verify');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send OTP.';
      toast.show(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setErrors({ otp: 'Enter the 6-digit OTP' });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await loginWithOtp({
        phone: phone.trim(),
        otp,
        device_name: getDeviceName(),
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid OTP.';
      toast.show(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp('');
    setOtpDebug(null);
    await handleSendOtp();
  };

  // --- Tab Component ---
  const renderTabs = () => (
    <View style={{ flexDirection: 'row', backgroundColor: Colors.border, borderRadius: 12, padding: 4, marginBottom: 24 }}>
      {/* Email tab - active */}
      <TouchableOpacity
        onPress={() => { setActiveTab('email'); setErrors({}); }}
        style={{
          flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
          backgroundColor: activeTab === 'email' ? Colors.surface : 'transparent',
          ...(activeTab === 'email' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 } : {}),
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: activeTab === 'email' ? Colors.primary : Colors.textSecondary }}>
          Email & Password
        </Text>
      </TouchableOpacity>
      {/* OTP tab - disabled with Coming Soon */}
      <View style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', opacity: 0.5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textMuted }}>OTP Login</Text>
          <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#d97706' }}>SOON</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // --- Email Form ---
  const renderEmailForm = () => (
    <>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={Colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={inputStyle(!!errors.email)}
        />
        {errors.email && <Text style={errorStyle}>{errors.email}</Text>}
      </View>

      <View style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Password</Text>
        <View style={{ position: 'relative' }}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry={!showPassword}
            autoComplete="password"
            style={{ ...inputStyle(!!errors.password), paddingRight: 60 }}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: 14, top: 14 }}
          >
            <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14 }}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={errorStyle}>{errors.password}</Text>}
      </View>

      <View style={{ alignItems: 'flex-end', marginBottom: 24 }}>
        <Link href="/(auth)/forgot-password" asChild>
          <TouchableOpacity>
            <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14 }}>Forgot Password?</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <TouchableOpacity onPress={handleEmailLogin} disabled={loading} style={buttonStyle(loading)}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={buttonText}>Login</Text>}
      </TouchableOpacity>
    </>
  );

  // --- OTP Form ---
  const renderOtpForm = () => (
    <>
      {otpStep === 'phone' ? (
        <>
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Phone Number</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  backgroundColor: Colors.surface,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 12,
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  padding: 14,
                  borderRightWidth: 0,
                }}
              >
                <Text style={{ fontSize: 16, color: Colors.textSecondary }}>+91</Text>
              </View>
              <TextInput
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="Enter 10-digit number"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                style={{
                  ...inputStyle(!!errors.phone),
                  flex: 1,
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                }}
              />
            </View>
            {errors.phone && <Text style={errorStyle}>{errors.phone}</Text>}
          </View>

          <TouchableOpacity onPress={handleSendOtp} disabled={loading} style={buttonStyle(loading)}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={buttonText}>Send OTP</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={{ backgroundColor: '#eef2ff', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: Colors.text, textAlign: 'center' }}>
              OTP sent to <Text style={{ fontWeight: '700' }}>+91 {phone}</Text>
            </Text>
            <TouchableOpacity onPress={() => { setOtpStep('phone'); setOtp(''); setOtpDebug(null); }}>
              <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                Change number
              </Text>
            </TouchableOpacity>
          </View>

          {otpDebug && (
            <View style={{ backgroundColor: '#fef3c7', borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: '#92400e', textAlign: 'center' }}>
                Dev OTP: <Text style={{ fontWeight: '700' }}>{otpDebug}</Text>
              </Text>
            </View>
          )}

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Enter OTP</Text>
            <TextInput
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="6-digit OTP"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              style={{ ...inputStyle(!!errors.otp), textAlign: 'center', letterSpacing: 8, fontSize: 22 }}
            />
            {errors.otp && <Text style={errorStyle}>{errors.otp}</Text>}
          </View>

          <TouchableOpacity onPress={handleVerifyOtp} disabled={loading} style={buttonStyle(loading)}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={buttonText}>Verify & Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResendOtp} disabled={loading} style={{ alignItems: 'center', marginTop: 16 }}>
            <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14 }}>Resend OTP</Text>
          </TouchableOpacity>
        </>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={{ width: 80, height: 64, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.text }}>Welcome Back</Text>
          <Text style={{ fontSize: 15, color: Colors.textSecondary, marginTop: 4 }}>
            Sign in to your JodTod account
          </Text>
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Forms */}
        {activeTab === 'email' ? renderEmailForm() : renderOtpForm()}

        {/* Register Link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 15 }}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 15 }}>Register</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Shared Styles ---
const inputStyle = (hasError: boolean) => ({
  backgroundColor: Colors.surface,
  borderWidth: 1,
  borderColor: hasError ? Colors.error : Colors.border,
  borderRadius: 12,
  padding: 14,
  fontSize: 16,
  color: Colors.text,
});

const errorStyle = { color: Colors.error, fontSize: 13, marginTop: 4 };

const buttonStyle = (loading: boolean) => ({
  backgroundColor: loading ? Colors.primaryLight : Colors.primary,
  borderRadius: 12,
  padding: 16,
  alignItems: 'center' as const,
});

const buttonText = { color: '#fff', fontSize: 16, fontWeight: '600' as const };
