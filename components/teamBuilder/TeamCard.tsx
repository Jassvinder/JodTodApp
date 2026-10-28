import { Share, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/colors';
import { TEAM_BUILDER_COLOR } from '../../constants/teamBuilder';
import { TEAM_BUILDER_LABEL } from '../../constants/navigation';
import ContactActions from './ContactActions';
import type { TeamSummary } from '../../types/teamBuilder';

function shareInvite(team: TeamSummary) {
  return Share.share({
    message:
      `Join my team "${team.name}"${team.company_name ? ` (${team.company_name})` : ''} on JodTod ${TEAM_BUILDER_LABEL}.\n\n` +
      `1. Install JodTod and choose ${TEAM_BUILDER_LABEL}\n` +
      `2. Open Team > Join Team\n` +
      `3. Enter my invite code: ${team.invite_code}`,
  });
}

// Team summary with my sponsor, my invite code and downline counts. Used on the Team tab and Team Details.
export default function TeamCard({ team, onPress }: { team: TeamSummary; onPress?: () => void }) {
  const body = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text }}>{team.name}</Text>
          {!!team.company_name && <Text style={{ fontSize: 12, color: Colors.textSecondary }}>{team.company_name}</Text>}
        </View>
        {team.is_owner && (
          <View style={{ backgroundColor: '#fef3c7', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: TEAM_BUILDER_COLOR }}>Leader</Text>
          </View>
        )}
        {onPress && <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
        <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginLeft: 6 }}>
          <Text style={{ fontWeight: '700', color: Colors.text }}>{team.downline_count}</Text> {team.downline_count === 1 ? 'person' : 'people'} in my team
        </Text>
      </View>

      {team.sponsor && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <Text style={{ flex: 1, fontSize: 13, color: Colors.textSecondary }}>
            Sponsor: <Text style={{ fontWeight: '600', color: Colors.text }}>{team.sponsor.name}</Text>
          </Text>
          <ContactActions phone={team.sponsor.phone} size={16} />
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border }}>
        <Text style={{ flex: 1, fontSize: 13, color: Colors.textSecondary }}>
          My invite code: <Text selectable style={{ fontWeight: '700', color: Colors.text, letterSpacing: 1 }}>{team.invite_code}</Text>
        </Text>
        <TouchableOpacity
          onPress={() => shareInvite(team)}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: TEAM_BUILDER_COLOR }}
        >
          <Ionicons name="share-social-outline" size={14} color="#fff" />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff', marginLeft: 4 }}>Invite</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const style = {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  };

  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={style}>{body}</TouchableOpacity>
  ) : (
    <View style={style}>{body}</View>
  );
}
