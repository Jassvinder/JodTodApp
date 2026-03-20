import { Stack } from 'expo-router';
import { Colors } from '../../../constants/colors';

export default function ExpensesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTitleStyle: { fontWeight: '600', color: Colors.text },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Expenses' }} />
      <Stack.Screen name="add" options={{ title: 'Add Expense', presentation: 'modal' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Expense' }} />
    </Stack>
  );
}
