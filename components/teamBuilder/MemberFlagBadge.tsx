import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MEMBER_FLAG_META } from '../../constants/teamBuilder';
import type { TeamMemberFlag } from '../../types/teamBuilder';

export default function MemberFlagBadge({ flag }: { flag: TeamMemberFlag }) {
  const meta = MEMBER_FLAG_META[flag];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: meta.bg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' }}>
      <Ionicons name={meta.icon} size={11} color={meta.color} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: meta.color, marginLeft: 3 }}>{meta.label}</Text>
    </View>
  );
}
