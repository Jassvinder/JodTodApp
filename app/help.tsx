import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { HELP_TOPICS } from '../constants/tips';
import { useTipsStore } from '../stores/tipsStore';
import { useToast } from '../components/Toast';
import BottomNav from '../components/BottomNav';

export default function HelpScreen() {
  const router = useRouter();
  const toast = useToast();
  const resetTips = useTipsStore((s) => s.resetTips);

  const handleResetTips = () => {
    resetTips();
    toast.show('Tips will show again the next time you open each screen.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <HelpAction icon="play-circle-outline" label="Watch Intro" onPress={() => router.push('/welcome')} />
          <HelpAction icon="refresh-outline" label="Show All Tips Again" onPress={handleResetTips} />
        </View>

        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 }}>What you can do in JodTod</Text>
        {HELP_TOPICS.map((topic) => (
          <TouchableOpacity
            key={topic.title}
            onPress={() => router.push(topic.route as never)}
            style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'flex-start' }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Ionicons name={topic.icon} size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text }}>{topic.title}</Text>
              <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2, lineHeight: 19 }}>{topic.text}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginTop: 9 }} />
          </TouchableOpacity>
        ))}

        <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 12, textAlign: 'center' }}>
          Tip: tap ? at the top of any screen to see what it does.
        </Text>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

function HelpAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' }}
    >
      <Ionicons name={icon} size={24} color={Colors.primary} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text, marginTop: 6, textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  );
}
