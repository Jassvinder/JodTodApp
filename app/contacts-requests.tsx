import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import BottomNav from '../components/BottomNav';
import FriendCodeBadge from '../components/FriendCodeBadge';
import { Colors } from '../constants/colors';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { contactService } from '../services/contacts';
import type { ContactRequest, ContactRequestUser, SentContactRequest } from '../types/models';
import { resolveUrl } from '../utils/format';

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } }).response?.data?.message;

const initials = (name: string) => name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?';

function RequestRow({ user, busy, actions }: { user: ContactRequestUser; busy: boolean; actions: ReactNode }) {
  return (
    <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center' }}>
      {user.avatar_url ? (
        <Image source={{ uri: resolveUrl(user.avatar_url)! }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} />
      ) : (
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{initials(user.name)}</Text>
        </View>
      )}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.text, flexShrink: 1 }} numberOfLines={1}>{user.name}</Text>
        <FriendCodeBadge code={user.friend_code} />
      </View>
      {busy ? <ActivityIndicator color={Colors.primary} /> : actions}
    </View>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, marginTop: 4 }}>
      {title} ({count})
    </Text>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <Text style={{ fontSize: 13, color: Colors.textMuted, marginBottom: 16 }}>{text}</Text>;
}

export default function ContactRequestsScreen() {
  const toast = useToast();
  const confirm = useConfirm();
  const [received, setReceived] = useState<ContactRequest[]>([]);
  const [sent, setSent] = useState<SentContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchRequests = async () => {
    try {
      const [receivedResponse, sentResponse] = await Promise.all([
        contactService.getContactRequests(),
        contactService.getSentRequests(),
      ]);
      setReceived(receivedResponse.data.data);
      setSent(sentResponse.data.data);
    } catch (error: unknown) {
      toast.show(errorMessage(error) || 'Failed to load contact requests.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      setReceived((prev) => prev.filter((item) => item.id !== request.id));
      toast.show(response.data.message);
    } catch (error: unknown) {
      toast.show(errorMessage(error) || 'Failed to update contact request.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = (request: SentContactRequest) => {
    confirm.show({
      title: 'Cancel Request',
      message: `Cancel your contact request to ${request.contact_user.name}?`,
      confirmText: 'Cancel Request',
      danger: true,
      onConfirm: async () => {
        setProcessingId(request.id);
        try {
          await contactService.removeContact(request.id);
          setSent((prev) => prev.filter((item) => item.id !== request.id));
          toast.show('Contact request cancelled.');
        } catch (error: unknown) {
          toast.show(errorMessage(error) || 'Failed to cancel request.', 'error');
        } finally {
          setProcessingId(null);
        }
      },
    });
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRequests(); }} colors={[Colors.primary]} />}
      >
        <SectionTitle title="Received" count={received.length} />
        {received.length === 0 && <EmptyLine text="No one has sent you a request." />}
        {received.map((item) => (
          <RequestRow
            key={item.id}
            user={item.user}
            busy={processingId === item.id}
            actions={
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => handleRequest(item, false)} style={{ padding: 8 }}>
                  <Ionicons name="close" size={20} color={Colors.error} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRequest(item, true)} style={{ backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Approve</Text>
                </TouchableOpacity>
              </View>
            }
          />
        ))}

        <View style={{ height: 12 }} />
        <SectionTitle title="Sent" count={sent.length} />
        {sent.length === 0 && <EmptyLine text="Requests you send appear here until they are approved." />}
        {sent.map((item) => (
          <RequestRow
            key={item.id}
            user={item.contact_user}
            busy={processingId === item.id}
            actions={
              <TouchableOpacity onPress={() => handleCancel(item)} style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 }}>
                <Text style={{ color: Colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            }
          />
        ))}
      </ScrollView>
      <BottomNav />
    </View>
  );
}
