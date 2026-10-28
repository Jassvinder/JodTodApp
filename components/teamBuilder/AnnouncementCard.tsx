import { Linking, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/colors';
import { TEAM_BUILDER_COLOR } from '../../constants/teamBuilder';
import { formatDateTime } from '../../utils/format';
import UserAvatar from '../UserAvatar';
import type { TeamAnnouncement } from '../../types/teamBuilder';

interface AnnouncementCardProps {
  announcement: TeamAnnouncement;
  // Opens the team's announcements (used on the dashboard).
  onPress?: () => void;
  onDelete?: () => void;
}

// One team announcement: author, message, optional link (training video, meeting).
export default function AnnouncementCard({ announcement, onPress, onDelete }: AnnouncementCardProps) {
  const body = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <UserAvatar name={announcement.author_name ?? ''} avatarUrl={announcement.author_avatar_url} size={32} color={TEAM_BUILDER_COLOR} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }} numberOfLines={1}>
            {announcement.is_mine ? 'You' : announcement.author_name}
          </Text>
          <Text style={{ fontSize: 11, color: Colors.textMuted }}>
            {formatDateTime(announcement.created_at)}{announcement.team_name ? ` · ${announcement.team_name}` : ''}
          </Text>
        </View>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} hitSlop={8} style={{ padding: 4 }} accessibilityLabel="Delete announcement">
            <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={{ fontSize: 14, color: Colors.text, marginTop: 8 }} numberOfLines={onPress ? 3 : undefined}>
        {announcement.message}
      </Text>
      {!!announcement.link && (
        <TouchableOpacity onPress={() => Linking.openURL(announcement.link!)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Ionicons name="link-outline" size={14} color="#2563eb" />
          <Text style={{ fontSize: 13, color: '#2563eb', marginLeft: 4, flex: 1 }} numberOfLines={1}>{announcement.link}</Text>
        </TouchableOpacity>
      )}
    </>
  );

  const style = { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 8 };

  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={style}>{body}</TouchableOpacity>
  ) : (
    <View style={style}>{body}</View>
  );
}
