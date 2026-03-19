import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { Colors } from '../../constants/colors';
import { getDeviceName } from '../../utils/device';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const register = useAuthStore((s) => s.register);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    else if (name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== passwordConfirmation) newErrors.password_confirmation = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirmation: passwordConfirmation,
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
        Alert.alert('Registration Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    field: string,
    options: {
      placeholder: string;
      secureTextEntry?: boolean;
      keyboardType?: TextInput['props']['keyboardType'];
      autoCapitalize?: TextInput['props']['autoCapitalize'];
      autoComplete?: TextInput['props']['autoComplete'];
    },
  ) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={options.placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={options.secureTextEntry && !showPassword}
        keyboardType={options.keyboardType}
        autoCapitalize={options.autoCapitalize}
        autoComplete={options.autoComplete}
        style={{
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: errors[field] ? Colors.error : Colors.border,
          borderRadius: 12,
          padding: 14,
          fontSize: 16,
          color: Colors.text,
        }}
      />
      {errors[field] && (
        <Text style={{ color: Colors.error, fontSize: 13, marginTop: 4 }}>{errors[field]}</Text>
      )}
    </View>
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
          <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.text }}>Create Account</Text>
          <Text style={{ fontSize: 15, color: Colors.textSecondary, marginTop: 4 }}>
            Start tracking your expenses with JodTod
          </Text>
        </View>

        {renderInput('Full Name', name, setName, 'name', {
          placeholder: 'Enter your name',
          autoCapitalize: 'words',
          autoComplete: 'name',
        })}

        {renderInput('Email', email, setEmail, 'email', {
          placeholder: 'you@example.com',
          keyboardType: 'email-address',
          autoCapitalize: 'none',
          autoComplete: 'email',
        })}

        {renderInput('Password', password, setPassword, 'password', {
          placeholder: 'Minimum 8 characters',
          secureTextEntry: true,
          autoComplete: 'new-password',
        })}

        {renderInput('Confirm Password', passwordConfirmation, setPasswordConfirmation, 'password_confirmation', {
          placeholder: 'Re-enter your password',
          secureTextEntry: true,
          autoComplete: 'new-password',
        })}

        {/* Show/Hide Password Toggle */}
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={{ alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 }}
        >
          <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14 }}>
            {showPassword ? 'Hide Passwords' : 'Show Passwords'}
          </Text>
        </TouchableOpacity>

        {/* Register Button */}
        <TouchableOpacity
          onPress={handleRegister}
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
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 15 }}>Already have an account? </Text>
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
