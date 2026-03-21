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
import type { SearchUser } from '../types/models';

export default function ContactsAddScreen() {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
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
      // Remove from results since they're now a contact
      setResults((prev) => prev.filter((u) => u.id !== user.id));
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
        <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.text }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
          {item.email}
        </Text>
        {item.phone && (
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 1 }}>
            {item.phone}
          </Text>
        )}
      </View>

      {/* Add Button */}
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
          Try a different name, email, or phone number
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
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
              placeholder="Search by name, email, or phone..."
              placeholderTextColor={Colors.textMuted}
              autoFocus
              autoCapitalize="none"
              style={{ flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 12, paddingHorizontal: 8 }}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 12 }}>
            Search JodTod users to add them as contacts (min 2 characters)
          </Text>
        </View>

        {/* Loading indicator */}
        {loading && (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}

        {/* Results */}
        <FlatList
          data={results}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        />
    </View>
  );
}
