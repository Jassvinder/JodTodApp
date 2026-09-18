import { useEffect } from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../constants/config';

WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onIdToken: (idToken: string) => void;
  loading?: boolean;
}

export default function GoogleSignInButton({ onIdToken, loading }: GoogleSignInButtonProps) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      onIdToken(response.params.id_token);
    }
  }, [response]);

  return (
    <TouchableOpacity
      onPress={() => promptAsync()}
      disabled={!request || loading}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14,
        backgroundColor: Colors.surface,
      }}
    >
      {loading ? (
        <ActivityIndicator color={Colors.text} />
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color={Colors.text} style={{ marginRight: 10 }} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text }}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
