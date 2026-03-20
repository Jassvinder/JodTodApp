import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { groupService } from '../services/groups';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function JoinGroupScreen() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 8) {
      setError('Invite code must be 8 characters');
      return;
    }

    setJoining(true);
    setError('');
    try {
      const response = await groupService.joinGroup(code);
      const msg = response.data?.message || 'Join request sent. The group admin will review your request.';
      Alert.alert('Request Sent', msg, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.errors?.invite_code?.[0] || 'Failed to join group.';
      setError(msg);
    } finally {
      setJoining(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ padding: 16 }}>
          {/* Header Illustration */}
          <View style={{ alignItems: 'center', marginVertical: 24 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#eef2ff',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="enter-outline" size={36} color={Colors.primary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 16 }}>Join a Group</Text>
            <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
              Enter the 8-character invite code shared by the group admin
            </Text>
          </View>

          {/* Invite Code Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>Invite Code *</Text>
            <TextInput
              value={inviteCode}
              onChangeText={(text) => { setInviteCode(text.toUpperCase()); setError(''); }}
              placeholder="ABCD1234"
              placeholderTextColor={Colors.textMuted}
              maxLength={8}
              autoCapitalize="characters"
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: error ? Colors.error : Colors.border,
                borderRadius: 10,
                padding: 14,
                fontSize: 20,
                fontWeight: '600',
                color: Colors.text,
                textAlign: 'center',
                letterSpacing: 4,
              }}
            />
            {error ? <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
          </View>

          {/* Join Button */}
          <TouchableOpacity
            onPress={handleJoin}
            disabled={joining}
            style={{
              backgroundColor: Colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 32,
            }}
          >
            {joining ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Join Group</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
