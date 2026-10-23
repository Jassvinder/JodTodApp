import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import { File, Paths } from 'expo-file-system';
import { supportService } from '../services/support';
import { Colors } from '../constants/colors';
import { useToast } from '../components/Toast';
import BottomNav from '../components/BottomNav';
import type { SupportDetails } from '../types/models';

export default function SupportScreen() {
  const toast = useToast();
  const [details, setDetails] = useState<SupportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await supportService.getDetails();
      setDetails(res.data.data);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveQr = async () => {
    if (!details?.qr_url || saving) return;
    setSaving(true);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
      if (!permission.granted) {
        toast.show('Allow photo access to save the QR code.', 'error');
        return;
      }
      const ext = details.qr_url.split('?')[0].split('.').pop() || 'png';
      const target = new File(Paths.cache, `jodtod-support-qr.${ext}`);
      const file = await File.downloadFileAsync(details.qr_url, target, { idempotent: true });
      await MediaLibrary.saveToLibraryAsync(file.uri);
      toast.show('QR code saved to your gallery.');
    } catch {
      toast.show('Could not save the QR code. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const copyUpiId = async () => {
    if (!details?.upi_id) return;
    await Clipboard.setStringAsync(details.upi_id);
    toast.show('UPI ID copied.');
  };

  const openUpiApp = async () => {
    if (!details?.upi_link) return;
    try {
      await Linking.openURL(details.upi_link);
    } catch {
      toast.show('No UPI app found on this phone.', 'error');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (failed || !details) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 15, color: Colors.textSecondary, textAlign: 'center' }}>Could not load this page.</Text>
        <TouchableOpacity onPress={load} style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primary }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasPaymentDetails = Boolean(details.qr_url || details.upi_id);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        {/* Free-for-now note */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff1f2', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
              <Ionicons name="heart-outline" size={20} color="#f43f5e" />
            </View>
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: Colors.text }}>{details.title}</Text>
          </View>
          {details.paragraphs.map((paragraph, index) => (
            <Text key={index} style={{ fontSize: 14, color: Colors.textSecondary, lineHeight: 21, marginTop: index ? 8 : 0 }}>
              {paragraph}
            </Text>
          ))}
          {details.early_users_note ? (
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primaryDark, marginTop: 10 }}>{details.early_users_note}</Text>
          ) : null}
        </View>

        {/* UPI payment */}
        {hasPaymentDetails ? (
          <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, marginTop: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text }}>Pay with UPI</Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>
              Any amount is welcome. Donations are voluntary and do not unlock features.
            </Text>

            {details.qr_url ? (
              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <View style={{ padding: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fff' }}>
                  <Image source={{ uri: details.qr_url }} style={{ width: 220, height: 220 }} resizeMode="contain" accessibilityLabel="JodTod UPI QR code" />
                </View>
                <TouchableOpacity
                  onPress={saveQr}
                  disabled={saving}
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primary, opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="download-outline" size={18} color="#fff" />}
                  <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Save QR to Gallery</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={{ marginTop: 16 }}>
              {details.pay_steps.map((step, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primaryDark }}>{index + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 21 }}>{step}</Text>
                </View>
              ))}
            </View>

            {details.upi_id ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textMuted }}>UPI ID</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background }}>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text }} numberOfLines={1} selectable>
                    {details.upi_id}
                  </Text>
                  <TouchableOpacity onPress={copyUpiId} style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
                    <Ionicons name="copy-outline" size={16} color={Colors.primary} />
                    <Text style={{ color: Colors.primary, fontWeight: '600', marginLeft: 4 }}>Copy</Text>
                  </TouchableOpacity>
                </View>
                {details.payee_name ? (
                  <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 4 }}>Payee: {details.payee_name}</Text>
                ) : null}

                {details.upi_link ? (
                  <TouchableOpacity
                    onPress={openUpiApp}
                    style={{ marginTop: 14, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center' }}
                  >
                    <Text style={{ color: Colors.primary, fontWeight: '600' }}>Pay with UPI App</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 16, textAlign: 'center' }}>Thank you for using JodTod. ❤️</Text>
      </ScrollView>
      <BottomNav />
    </View>
  );
}
