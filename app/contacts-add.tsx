import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { contactService } from '../services/contacts';
import { resolveUrl } from '../utils/format';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useToast } from '../components/Toast';
import BottomNav from '../components/BottomNav';
import FriendCodeBadge from '../components/FriendCodeBadge';
import { useAuthStore } from '../stores/authStore';
import type { SearchUser } from '../types/models';

export default function ContactsAddScreen() {
  const router = useRouter();
  const toast = useToast();
  const myFriendCode = useAuthStore((s) => s.user?.friend_code);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 3) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await contactService.searchUsers(searchQuery.trim());
      setResults(response.data.data);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to search users.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchUsers(text);
    }, 500);
  };

  const handleAdd = async (user: SearchUser) => {
    setAddingId(user.id);
    try {
      const response = await contactService.addContact(user.id);
      toast.show(response.data.message);
      setResults((prev) => prev.map((u) => (u.id === user.id ? { ...u, request_status: 'sent' } : u)));
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to add contact.', 'error');
    } finally {
      setAddingId(null);
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  const renderUserItem = ({ item }: { item: SearchUser }) => (
    <View style={{
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: Colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      {/* Avatar */}
      {item.avatar_url ? (
        <Image
          source={{ uri: resolveUrl(item.avatar_url)! }}
          style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }}
        />
      ) : (
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: Colors.primaryLight,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
            {getInitials(item.name)}
          </Text>
        </View>
      )}

      {/* User Info */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.text, flexShrink: 1 }} numberOfLines={1}>
            {item.name}
          </Text>
          <FriendCodeBadge code={item.friend_code} />
        </View>
      </View>

      {item.request_status ? (
        // A request already exists either way; manage it on the Requests screen.
        <TouchableOpacity
          onPress={() => router.push('/contacts-requests')}
          style={{
            borderWidth: 1,
            borderColor: Colors.primary,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 7,
            marginLeft: 8,
          }}
        >
          <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 13 }}>
            {item.request_status === 'sent' ? 'Requested' : 'Respond'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => handleAdd(item)}
          disabled={addingId === item.id}
          style={{
            backgroundColor: Colors.primary,
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
            marginLeft: 8,
          }}
        >
          {addingId === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Add</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    if (!hasSearched) return null;
    return (
      <View style={{ alignItems: 'center', paddingVertical: 60 }}>
        <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 }}>No users found</Text>
        <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
          Try a different name
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1 }}>
        {/* Search Input */}
        <View style={{ padding: 16, paddingBottom: 0 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.surface,
            borderRadius: 10,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: Colors.border,
            marginBottom: 4,
          }}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search by name or friend code..."
              placeholderTextColor={Colors.textMuted}
              autoFocus
              autoCapitalize="none"
              style={{ flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 12, paddingHorizontal: 8 }}
            />
            {loading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 8 }} />}
            {query.length > 0 && !loading && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 8 }}>
            Type at least 3 characters and send a request. Details are shared only after they approve. If many people share a name, ask your friend for their friend code.
          </Text>
          {!!myFriendCode && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Your friend code:</Text>
              <FriendCodeBadge code={myFriendCode} />
            </View>
          )}
        </View>

        {/* Results */}
        <FlatList
          data={results}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        />
      </View>
      <BottomNav />
    </View>
  );
}
