import { ActivityIndicator, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';

interface ListSearchBarProps {
  value: string;
  placeholder: string;
  searching: boolean;
  color?: string;
  accessibilityLabel: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export default function ListSearchBar({
  value,
  placeholder,
  searching,
  color = Colors.primary,
  accessibilityLabel,
  onChangeText,
  onSearch,
  onClear,
}: ListSearchBarProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 10, paddingLeft: 12, borderWidth: 1, borderColor: Colors.border }}>
      <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSearch}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        returnKeyType="search"
        style={{ flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 10, paddingHorizontal: 8 }}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} hitSlop={8} style={{ padding: 4 }}>
          <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={onSearch}
        disabled={searching}
        accessibilityLabel={accessibilityLabel}
        style={{ alignSelf: 'stretch', width: 38, justifyContent: 'center', alignItems: 'center', backgroundColor: color, borderTopRightRadius: 9, borderBottomRightRadius: 9, opacity: searching ? 0.7 : 1 }}
      >
        {searching ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="search" size={17} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
}
