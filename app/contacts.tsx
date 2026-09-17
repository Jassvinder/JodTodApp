import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { contactService, type ContactListParams } from '../services/contacts';
import { resolveUrl } from '../utils/format';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import BottomNav from '../components/BottomNav';
import type { Contact } from '../types/models';

interface ContactListHeaderProps {
  contactCount: number;
  requestCount: number;
  searchText: string;
  searching: boolean;
  onSearchTextChange: (text: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onRequests: () => void;
}

function ContactListHeader({
  contactCount,
  requestCount,
  searchText,
  searching,
  onSearchTextChange,
  onSearch,
  onClearSearch,
  onRequests,
}: ContactListHeaderProps) {
  return (
    <View>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 10,
        paddingLeft: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 12,
      }}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          value={searchText}
          onChangeText={onSearchTextChange}
          onSubmitEditing={onSearch}
          placeholder="Search contacts..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          style={{ flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 10, paddingHorizontal: 8 }}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={onClearSearch} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onSearch}
          disabled={searching}
          accessibilityLabel="Search contacts"
          style={{ alignSelf: 'stretch', width: 38, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary, borderTopRightRadius: 9, borderBottomRightRadius: 9, opacity: searching ? 0.7 : 1 }}
        >
          {searching ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="search" size={17} color="#fff" />}
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
          {contactCount} contact{contactCount !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity onPress={onRequests} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="person-add-outline" size={16} color={Colors.primary} />
          <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '600', marginLeft: 4 }}>Requests{requestCount ? ` (${requestCount})` : ''}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ContactsScreen() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [requestCount, setRequestCount] = useState(0);

  // Search
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const requestControllerRef = useRef<AbortController | null>(null);
  const searchQueryRef = useRef(searchQuery);

  const fetchContacts = useCallback(async (
    pageNum: number = 1,
    append: boolean = false,
    search = searchQueryRef.current,
  ) => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      const params: ContactListParams = { page: pageNum };
      if (search.trim()) params.search = search.trim();

      const response = await contactService.getContacts(params, controller.signal);
      if (controller.signal.aborted) return;
      const { data, meta } = response.data;

      if (append) {
        setContacts((prev) => [...prev, ...data]);
      } else {
        setContacts(data);
      }
      setPage(meta.current_page);
      setLastPage(meta.last_page);
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
        toast.show(message || 'Failed to load contacts.', 'error');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        setSearching(false);
      }
    }
  }, [toast]);

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  const fetchRequestCount = useCallback(async () => {
    try {
      const response = await contactService.getContactRequests();
      setRequestCount(response.data.data.length);
    } catch {
      setRequestCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setPage(1);
      fetchContacts(1);
      fetchRequestCount();
    }, [fetchContacts, fetchRequestCount])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchContacts(1);
  }, [fetchContacts]);

  const loadMore = () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    fetchContacts(page + 1, true);
  };

  const handleSearch = () => {
    const nextSearchQuery = searchText.trim();
    searchQueryRef.current = nextSearchQuery;
    setSearchQuery(nextSearchQuery);
    setSearching(true);
    setPage(1);
    fetchContacts(1, false, nextSearchQuery);
  };

  const handleClearSearch = () => {
    searchQueryRef.current = '';
    setSearchText('');
    setSearchQuery('');
    setSearching(false);
    setPage(1);
    fetchContacts(1, false, '');
  };

  const handleRemove = (contact: Contact) => {
    confirm.show({
      title: 'Remove Contact',
      message: `Are you sure you want to remove ${contact.contact_user.name} from your contacts?`,
      confirmText: 'Remove',
      danger: true,
      onConfirm: async () => {
        try {
          await contactService.removeContact(contact.id);
          setContacts((prev) => prev.filter((c) => c.id !== contact.id));
        } catch (error: any) {
          toast.show(error.response?.data?.message || 'Failed to remove contact.', 'error');
        }
      },
    });
  };

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      onLongPress={() => handleRemove(item)}
      activeOpacity={0.7}
      style={{
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Avatar */}
      {item.contact_user.avatar_url ? (
        <Image
          source={{ uri: resolveUrl(item.contact_user.avatar_url)! }}
          style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }}
        />
      ) : (
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: Colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
            {getInitials(item.contact_user.name)}
          </Text>
        </View>
      )}

      {/* Name & Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.text }} numberOfLines={1}>
          {item.contact_user.name}
        </Text>
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
          {item.contact_user.email}
        </Text>
        {item.contact_user.phone && (
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 1 }}>
            {item.contact_user.phone}
          </Text>
        )}
      </View>

      {/* Remove icon hint */}
      <Ionicons name="ellipsis-vertical" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
      <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 }}>No contacts yet</Text>
      <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
        {searchQuery ? 'No contacts match your search' : 'Tap + to add your first contact'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 16 }}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <ContactListHeader
              contactCount={contacts.length}
              requestCount={requestCount}
              searchText={searchText}
              searching={searching}
              onSearchTextChange={setSearchText}
              onSearch={handleSearch}
              onClearSearch={handleClearSearch}
              onRequests={() => router.push('/contacts-requests')}
            />
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
        />

        <TouchableOpacity
          onPress={() => router.push('/contacts-add')}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: Colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            zIndex: 10,
          }}
        >
          <Ionicons name="person-add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <BottomNav />
    </View>
  );
}
