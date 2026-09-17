import { View, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';

interface GroupExpenseActionsProps {
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function GroupExpenseActions({ isAdmin, onEdit, onDelete }: GroupExpenseActionsProps) {
  return (
    <View style={{ flexDirection: 'row', marginTop: 6 }}>
      <TouchableOpacity onPress={onEdit} style={{ padding: 3, marginRight: 8 }} accessibilityLabel="Edit group expense">
        <Ionicons name="create-outline" size={18} color={isAdmin ? Colors.primary : Colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={{ padding: 3 }} accessibilityLabel="Delete group expense">
        <Ionicons name="trash-outline" size={18} color={isAdmin ? Colors.error : Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}
