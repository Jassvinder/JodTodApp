import { TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { callPhone, openWhatsApp } from '../../utils/phone';

// Call and WhatsApp icon buttons for a phone number; renders nothing without one.
export default function ContactActions({ phone, size = 18 }: { phone: string | null | undefined; size?: number }) {
  if (!phone) return null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity onPress={() => callPhone(phone)} hitSlop={6} style={{ padding: 6 }} accessibilityLabel="Call">
        <Ionicons name="call-outline" size={size} color="#2563eb" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => openWhatsApp(phone)} hitSlop={6} style={{ padding: 6 }} accessibilityLabel="WhatsApp">
        <Ionicons name="logo-whatsapp" size={size} color="#16a34a" />
      </TouchableOpacity>
    </View>
  );
}
