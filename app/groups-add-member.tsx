import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { groupService, type GroupShowResponse } from '../services/groups';
import { resolveUrl } from '../utils/format';
import { Colors } from '../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useToast } from '../components/Toast';
import BottomNav from '../components/BottomNav';

interface ContactItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  avatar_url: string | null;
}

export default function AddMemberScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = parseInt(id || '0', 10);
  const toast = useToast();

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const response = await groupService.getGroup(groupId);
      const data: GroupShowResponse = response.data.data;
      const existingMemberIds = data.group.members.map((m) => m.id);
      setMemberIds(existingMemberIds);
      // Filter contacts to only show non-members
      const available = (data.contacts || []).filter(
        (c) => !existingMemberIds.includes(c.id)
      );
      setContacts(available);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load data.', 'error');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [groupId])
  );

  const handleAdd = async (contact: ContactItem) => {
    setAddingId(contact.id);
    try {
      await groupService.addMember(groupId, contact.id);
      // Remove from list and add to member ids
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      setMemberIds((prev) => [...prev, contact.id]);
      toast.show(`${contact.name} has been added to the group.`);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to add member.', 'error');
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderContactItem = ({ item }: { item: ContactItem }) => (
    <View
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
      {item.avatar_url ? (
        <Image
          source={{ uri: resolveUrl(item.avatar_url)! }}
          style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
        />
      ) : (
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: Colors.primaryLight,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
            {getInitials(item.name)}
          </Text>
        </View>
      )}

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 12, color: Colors.textMuted }} numberOfLines={1}>
          {item.email}
        </Text>
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
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {addingId === item.id ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={14} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>Add</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
      <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 }}>No contacts available</Text>
      <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
        All your contacts are already members of this group, or you have no contacts yet.
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1 }}>
      <FlatList
        data={contacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      />
      </View>
      <BottomNav />
    </View>
  );
}
