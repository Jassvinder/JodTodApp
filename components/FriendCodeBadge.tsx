import { Text, View } from 'react-native';
import { Colors } from '../constants/colors';

// Friend codes tell apart users who share the same name.
export default function FriendCodeBadge({ code }: { code: string }) {
  return (
    <View style={{ backgroundColor: '#eef2ff', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 6 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.primaryDark }}>{code}</Text>
    </View>
  );
}
