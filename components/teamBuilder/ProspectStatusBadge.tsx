import { Text, View } from 'react-native';
import { PROSPECT_STATUS_META } from '../../constants/teamBuilder';
import type { ProspectStatus } from '../../types/teamBuilder';

export default function ProspectStatusBadge({ status }: { status: ProspectStatus }) {
  const meta = PROSPECT_STATUS_META[status];
  return (
    <View style={{ backgroundColor: meta.bg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: meta.color }}>{meta.label}</Text>
    </View>
  );
}
