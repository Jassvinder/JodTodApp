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
    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
      <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 }}>No groups yet</Text>
      <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
        Create a group or join one with an invite code
      </Text>
    </View>
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

      {/* Join Group Button */}
      <TouchableOpacity
        onPress={() => router.push('/groups-join')}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 84,
          height: 48,
          paddingHorizontal: 16,
          borderRadius: 24,
          backgroundColor: Colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <Ionicons name="enter-outline" size={20} color={Colors.primary} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary, marginLeft: 6 }}>Join</Text>
      </TouchableOpacity>

      {/* FAB - Create Group */}
      <TouchableOpacity
        onPress={() => router.push('/groups-create')}
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
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
