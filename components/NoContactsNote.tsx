import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';

interface NoContactsNoteProps {
  // What the user is trying to do, e.g. "add group members"
  purpose: string;
  // Lets a modal close itself before navigating, so it doesn't stay on top of the next screen.
  onBeforeNavigate?: () => void;
}

// Shown wherever a contact picker is empty because the user has no contacts yet.
export default function NoContactsNote({ purpose, onBeforeNavigate }: NoContactsNoteProps) {
  const router = useRouter();

  return (
    <View style={{ backgroundColor: '#fef3c7', borderRadius: 10, borderWidth: 1, borderColor: '#fcd34d', padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Ionicons name="information-circle-outline" size={18} color="#b45309" style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, fontSize: 13, color: '#92400e', marginLeft: 6 }}>
          To {purpose}, first add your friends to your contact list. They appear here once they approve your request.
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          onBeforeNavigate?.();
          router.push('/contacts-add');
        }}
        style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 24 }}
      >
        <Ionicons name="person-add-outline" size={16} color={Colors.primary} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.primary, marginLeft: 4 }}>Add Contact</Text>
      </TouchableOpacity>
    </View>
  );
}
