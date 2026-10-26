import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { homeRouteFor } from '../constants/navigation';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    return <Redirect href={homeRouteFor(user?.app_mode) as any} />;
  }

  return <Redirect href="/(auth)/login" />;
}
