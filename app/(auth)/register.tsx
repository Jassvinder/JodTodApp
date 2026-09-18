import { useRef, useState } from "react";
import {
  InteractionManager,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import { Colors } from "../../constants/colors";
import { getDeviceName } from "../../utils/device";
import { useToast } from "../../components/Toast";
import AppLogo from "./AppLogo";
import AuthKeyboardScreen from './AuthKeyboardScreen';
import GoogleSignInButton from "../../components/GoogleSignInButton";

export default function RegisterScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [googleLoading, setGoogleLoading] = useState(false);

  const register = useAuthStore((s) => s.register);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const toast = useToast();

  const handleGoogleIdToken = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle({ id_token: idToken, device_name: getDeviceName() });
    } catch (error: any) {
      toast.show(error.response?.data?.message || "Google sign-in failed.", "error");
    } finally {
      setGoogleLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    else if (name.trim().length < 2)
      newErrors.name = "Name must be at least 2 characters";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Enter a valid email";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (password !== passwordConfirmation)
      newErrors.password_confirmation = "Passwords do not match";
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
      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const key in fieldErrors) {
          mapped[key] = fieldErrors[key][0];
        }
        setErrors(mapped);
      } else {
        toast.show(message, "error");
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
      keyboardType?: TextInput["props"]["keyboardType"];
      autoCapitalize?: TextInput["props"]["autoCapitalize"];
      autoComplete?: TextInput["props"]["autoComplete"];
      onFocus?: () => void;
    },
  ) => (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "500",
          color: Colors.text,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={options.placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={options.secureTextEntry && !showPassword}
        keyboardType={options.keyboardType}
        autoCapitalize={options.autoCapitalize}
        autoComplete={options.autoComplete}
        onFocus={options.onFocus}
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
        <Text style={{ color: Colors.error, fontSize: 13, marginTop: 4 }}>
          {errors[field]}
        </Text>
      )}
    </View>
  );

  return (
    <AuthKeyboardScreen scrollViewRef={scrollViewRef}>
        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <AppLogo />
          <Text style={{ fontSize: 28, fontWeight: "700", color: Colors.text }}>
            Create Account
          </Text>
          <Text
            style={{ fontSize: 15, color: Colors.textSecondary, marginTop: 4 }}
          >
            Start tracking your expenses with JodTod
          </Text>
        </View>

        {renderInput("Full Name", name, setName, "name", {
          placeholder: "Enter your name",
          autoCapitalize: "words",
          autoComplete: "name",
        })}

        {renderInput("Email", email, setEmail, "email", {
          placeholder: "you@example.com",
          keyboardType: "email-address",
          autoCapitalize: "none",
          autoComplete: "email",
        })}

        {renderInput("Password", password, setPassword, "password", {
          placeholder: "Minimum 8 characters",
          secureTextEntry: true,
          autoComplete: "new-password",
        })}

        {renderInput(
          "Confirm Password",
          passwordConfirmation,
          setPasswordConfirmation,
          "password_confirmation",
          {
            placeholder: "Re-enter your password",
            secureTextEntry: true,
            autoComplete: "new-password",
            onFocus: () => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
              InteractionManager.runAfterInteractions(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              });
            },
          },
        )}

        {/* Show/Hide Password Toggle */}
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={{ alignSelf: "flex-end", marginBottom: 24, marginTop: -8 }}
        >
          <Text
            style={{ color: Colors.primary, fontWeight: "600", fontSize: 14 }}
          >
            {showPassword ? "Hide Passwords" : "Show Passwords"}
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
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
          <Text style={{ marginHorizontal: 12, color: Colors.textMuted, fontSize: 13 }}>OR</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
        </View>

        {/* Google Sign-In */}
        <View style={{ marginBottom: 24 }}>
          <GoogleSignInButton onIdToken={handleGoogleIdToken} loading={googleLoading} />
        </View>

        {/* Login Link */}
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 15 }}>
            Already have an account?{" "}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text
                style={{
                  color: Colors.primary,
                  fontWeight: "600",
                  fontSize: 15,
                }}
              >
                Login
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
    </AuthKeyboardScreen>
  );
}
