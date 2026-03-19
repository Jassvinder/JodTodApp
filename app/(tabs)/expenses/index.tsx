import { View, Text } from 'react-native';
import { Colors } from '../../../constants/colors';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ExpensesScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 24 }}>
      <Ionicons name="wallet-outline" size={48} color={Colors.textMuted} />
      <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 12 }}>Expenses</Text>
      <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4 }}>Coming soon...</Text>
    </View>
  );
}
