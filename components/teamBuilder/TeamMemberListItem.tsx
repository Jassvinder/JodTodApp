import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/colors';
import { TEAM_BUILDER_COLOR } from '../../constants/teamBuilder';
import UserAvatar from '../UserAvatar';
import MemberFlagBadge from './MemberFlagBadge';
import type { TeamMemberSummary } from '../../types/teamBuilder';

// One person in my team, as the upline sees them: flag, follow-ups and this week's work.
export default function TeamMemberListItem({ member, onPress }: { member: TeamMemberSummary; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
    >
      <UserAvatar name={member.name} avatarUrl={member.avatar_url} size={40} color={TEAM_BUILDER_COLOR} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text }} numberOfLines={1}>{member.name}</Text>
        {!member.is_direct && !!member.sponsor_name && (
          <Text style={{ fontSize: 11, color: Colors.textMuted }} numberOfLines={1}>Under {member.sponsor_name}</Text>
        )}
        {member.flag && <View style={{ marginTop: 4 }}><MemberFlagBadge flag={member.flag} /></View>}
        <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4 }}>
          This week: {member.plans_week}{member.target?.plans_per_week ? `/${member.target.plans_per_week}` : ''} plans
          {' · '}{member.follow_ups_week}{member.target?.follow_ups_per_week ? `/${member.target.follow_ups_per_week}` : ''} follow-ups
        </Text>
        {member.overdue_follow_ups > 0 && (
          <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.error, marginTop: 2 }}>
            {member.overdue_follow_ups} follow-up{member.overdue_follow_ups > 1 ? 's' : ''} overdue
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}
