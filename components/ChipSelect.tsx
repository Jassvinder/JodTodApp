import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';

export interface ChipOption<T extends string> {
  key: T;
  label: string;
  color?: string;
  count?: number;
}

interface ChipSelectProps<T extends string> {
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  // One scrolling row (filters) instead of wrapping lines (form fields).
  scroll?: boolean;
}

// Single-choice row of pill buttons.
export default function ChipSelect<T extends string>({ options, value, onChange, scroll = false }: ChipSelectProps<T>) {
  const chips = options.map((option) => {
    const selected = option.key === value;
    const color = option.color ?? Colors.primary;
    return (
      <TouchableOpacity
        key={option.key}
        onPress={() => onChange(option.key)}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: selected ? color : Colors.border,
          backgroundColor: selected ? color : Colors.surface,
          marginRight: 8,
          marginBottom: scroll ? 0 : 8,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? '#fff' : Colors.text }}>
          {option.label}
          {option.count !== undefined ? ` (${option.count})` : ''}
        </Text>
      </TouchableOpacity>
    );
  });

  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 2 }}>
        {chips}
      </ScrollView>
    );
  }

  return <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{chips}</View>;
}
