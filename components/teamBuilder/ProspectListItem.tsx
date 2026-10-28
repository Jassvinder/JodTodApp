import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/colors';
import { OPEN_PROSPECT_STATUSES } from '../../constants/teamBuilder';
import { formatDateTime } from '../../utils/format';
import UserAvatar from '../UserAvatar';
import ProspectStatusBadge from './ProspectStatusBadge';
import ContactActions from './ContactActions';
import type { Prospect, ProspectBrief } from '../../types/teamBuilder';

// Uplines get a ProspectBrief (no phone or team), so those fields are optional.
type ProspectRow = ProspectBrief & Partial<Pick<Prospect, 'phone' | 'team_name'>>;

// One prospect row, shared by the Prospects and Follow-ups tabs and the upline's member view.
export default function ProspectListItem({ prospect, onPress }: { prospect: ProspectRow; onPress?: () => void }) {
  const showFollowUp = !!prospect.next_follow_up_at && OPEN_PROSPECT_STATUSES.includes(prospect.status);
  const overdue = showFollowUp && new Date(prospect.next_follow_up_at!).getTime() < Date.now();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: overdue ? '#fca5a5' : Colors.border,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <UserAvatar name={prospect.name} size={40} color="#d97706" />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text }} numberOfLines={1}>{prospect.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 6 }}>
          <ProspectStatusBadge status={prospect.status} />
          {!!prospect.team_name && (
            <Text style={{ fontSize: 11, color: Colors.textMuted }} numberOfLines={1}>{prospect.team_name}</Text>
          )}
        </View>
        {showFollowUp && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="alarm-outline" size={12} color={overdue ? Colors.error : Colors.textSecondary} />
            <Text style={{ fontSize: 12, marginLeft: 4, color: overdue ? Colors.error : Colors.textSecondary, fontWeight: overdue ? '600' : '400' }}>
              {overdue ? 'Overdue: ' : ''}{formatDateTime(prospect.next_follow_up_at!)}
            </Text>
          </View>
        )}
      </View>
      <ContactActions phone={prospect.phone} />
    </TouchableOpacity>
  );
}
