import { View, Text } from 'react-native';
import { Colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/format';

// Money I gave out is red, money I got back is green (same for balances: will get = green).
export const LEDGER_GET_COLOR = '#16a34a';
export const LEDGER_GIVE_COLOR = '#dc2626';

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
