import { Stack } from 'expo-router';
import { Colors } from '../../../constants/colors';

export default function TodosLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTitleStyle: { fontWeight: '600', color: Colors.text },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'My Tasks' }} />
    </Stack>
  );
}
