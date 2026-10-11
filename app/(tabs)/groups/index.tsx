import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { groupService } from '../../../services/groups';
import { formatCurrency, resolveUrl } from '../../../utils/format';
import { Colors } from '../../../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import EmptyState from '../../../components/EmptyState';
import HeaderAddButton from '../../../components/HeaderAddButton';
import TipAnchor from '../../../components/tips/TipAnchor';
import { useToast } from '../../../components/Toast';
import type { Group } from '../../../types/models';

export default function GroupsScreen() {
  const router = useRouter();
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = async () => {
    try {
      const response = await groupService.getGroups();
      setGroups(response.data.data);
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to load groups.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchGroups();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGroups();
  }, []);

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

  const renderGroupItem = ({ item }: { item: Group }) => {
    const role = item.pivot?.role || 'member';

    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/groups-detail', params: { id: item.id } })}
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
        {/* Group Photo / Initials */}
        {item.photo_url ? (
          <Image
            source={{ uri: resolveUrl(item.photo_url)! }}
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
              {getInitials(item.name)}
            </Text>
          </View>
        )}

        {/* Group Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.text, flex: 1 }} numberOfLines={1}>
              {item.name}
            </Text>
            {role === 'admin' && (
              <View style={{ backgroundColor: '#eef2ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: Colors.primary }}>Admin</Text>
              </View>
            )}
            {item.is_all_settled && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 }}>
                <Ionicons name="checkmark-circle" size={10} color="#16a34a" />
                <Text style={{ fontSize: 9, fontWeight: '600', color: '#16a34a', marginLeft: 3 }}>All Settled</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>
            {item.members_count} member{item.members_count !== 1 ? 's' : ''}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="people-outline"
      title="Split bills with friends"
      text="Create a group for a trip, flat or event. Add friends, record shared expenses, and JodTod shows who owes whom."
      actionLabel="Create Group"
      onAction={() => router.push('/groups-create')}
      secondaryLabel="Have an invite code? Join a group"
      onSecondary={() => router.push('/groups-join')}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      />

      <HeaderAddButton
        onPress={() => router.push('/groups-create')}
        helpScreen="groups"
        tipId="groups.create"
        leadingAction={(
          <TipAnchor id="groups.join">
          <TouchableOpacity
            onPress={() => router.push('/groups-join')}
            accessibilityRole="button"
            accessibilityLabel="Join"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: Colors.primary,
              paddingHorizontal: 12,
              paddingVertical: 5,
            }}
          >
            <Ionicons name="enter-outline" size={16} color={Colors.primary} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary, marginLeft: 4 }}>Join</Text>
          </TouchableOpacity>
          </TipAnchor>
        )}
      />
    </View>
  );
}
