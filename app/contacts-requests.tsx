import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import BottomNav from '../components/BottomNav';
import { Colors } from '../constants/colors';
import { useToast } from '../components/Toast';
import { contactService } from '../services/contacts';
import type { ContactRequest } from '../types/models';
import { resolveUrl } from '../utils/format';

export default function ContactRequestsScreen() {
  const toast = useToast();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchRequests = async () => {
    try {
      const response = await contactService.getContactRequests();
      setRequests(response.data.data);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.show(message || 'Failed to load contact requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchRequests();
  }, []));

  const handleRequest = async (request: ContactRequest, approved: boolean) => {
    setProcessingId(request.id);
    try {
      const response = approved
        ? await contactService.approveContactRequest(request.id)
        : await contactService.rejectContactRequest(request.id);
      setRequests((prev) => prev.filter((item) => item.id !== request.id));
      toast.show(response.data.message);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.show(message || 'Failed to update contact request.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const initials = (name: string) => name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 80, flexGrow: 1 }}
        ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 60 }}><Ionicons name="person-add-outline" size={48} color={Colors.textMuted} /><Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 }}>No contact requests</Text></View>}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center' }}>
            {item.user.avatar_url ? <Image source={{ uri: resolveUrl(item.user.avatar_url)! }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} /> : <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Text style={{ color: '#fff', fontWeight: '700' }}>{initials(item.user.name)}</Text></View>}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.text, flexShrink: 1 }} numberOfLines={1}>{item.user.name}</Text>
              <View style={{ backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.primary }}>{item.user.friend_code}</Text>
              </View>
            </View>
            {processingId === item.id ? <ActivityIndicator color={Colors.primary} /> : <View style={{ flexDirection: 'row', gap: 8 }}><TouchableOpacity onPress={() => handleRequest(item, false)} style={{ padding: 8 }}><Ionicons name="close" size={20} color={Colors.error} /></TouchableOpacity><TouchableOpacity onPress={() => handleRequest(item, true)} style={{ backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Approve</Text></TouchableOpacity></View>}
          </View>
        )}
      />
      <BottomNav />
    </View>
  );
}
