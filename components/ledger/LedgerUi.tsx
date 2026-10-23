import { View, Text, TouchableOpacity, ActivityIndicator, type TextStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/format';

// Money I gave out is red, money I got back is green (same for balances: will get = green).
export const LEDGER_GET_COLOR = '#16a34a';
export const LEDGER_GIVE_COLOR = '#dc2626';

export const ledgerInputStyle: TextStyle = {
  backgroundColor: Colors.background,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 10,
  padding: 12,
  fontSize: 15,
  color: Colors.text,
  marginBottom: 12,
};

// Short label for a person's balance, e.g. "You will get ₹400".
export function LedgerBalanceText({ balance, size = 14 }: { balance: number; size?: number }) {
  if (balance === 0) {
    return <Text style={{ fontSize: size, fontWeight: '600', color: Colors.textMuted }}>Settled</Text>;
  }
  const willGet = balance > 0;
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={{ fontSize: size + 2, fontWeight: '700', color: willGet ? LEDGER_GET_COLOR : LEDGER_GIVE_COLOR }}>
        {formatCurrency(Math.abs(balance))}
      </Text>
      <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{willGet ? 'You will get' : 'You will give'}</Text>
    </View>
  );
}

interface LedgerFormCardProps {
  title: string;
  submitLabel: string;
  submitColor?: string;
  saving: boolean;
  error?: string;
  onSubmit: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}

// Card wrapper with Cancel / Save buttons shared by the person and entry forms.
export function LedgerFormCard({ title, submitLabel, submitColor = Colors.primary, saving, error, onSubmit, onCancel, children }: LedgerFormCardProps) {
  return (
    <View style={{
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      marginBottom: 0,
      borderWidth: 1,
      borderColor: Colors.border,
    }}>
      <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 12 }}>{title}</Text>
      {children}
      {!!error && <Text style={{ color: Colors.error, fontSize: 12, marginBottom: 12 }}>{error}</Text>}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={onCancel}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 10,
            backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSubmit}
          disabled={saving}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: submitColor, alignItems: 'center' }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{submitLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
