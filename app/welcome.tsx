import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { WELCOME_SLIDES } from '../constants/tips';
import { useTipsStore } from '../stores/tipsStore';

// First-run intro slides. Can be replayed from Help & Tips.
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setIntroSeen = useTipsStore((s) => s.setIntroSeen);
  const [index, setIndex] = useState(0);
  const slide = WELCOME_SLIDES[index];
  const isLast = index === WELCOME_SLIDES.length - 1;

  const close = () => {
    setIntroSeen(true);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}>
      <View style={{ alignItems: 'flex-end', minHeight: 36 }}>
        {!isLast && (
          <TouchableOpacity onPress={close} style={{ padding: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textSecondary }}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: slide.background, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name={slide.icon} size={56} color={slide.color} />
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.text, marginTop: 32, textAlign: 'center' }}>{slide.title}</Text>
        <Text style={{ fontSize: 16, color: Colors.textSecondary, marginTop: 12, textAlign: 'center', lineHeight: 24 }}>{slide.text}</Text>
        {isLast && (
          <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 24, textAlign: 'center' }}>
            Tap ? at the top of any screen for quick tips. Help & Tips in the menu explains every feature.
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 24 }}>
        {WELCOME_SLIDES.map((item, i) => (
          <View
            key={item.title}
            style={{ width: i === index ? 20 : 8, height: 8, borderRadius: 4, marginHorizontal: 4, backgroundColor: i === index ? Colors.primary : Colors.border }}
          />
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        {index > 0 && (
          <TouchableOpacity
            onPress={() => setIndex(index - 1)}
            style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text }}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => (isLast ? close() : setIndex(index + 1))}
          style={{ flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>{isLast ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
