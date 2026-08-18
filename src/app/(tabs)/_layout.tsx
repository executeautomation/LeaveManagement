import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { isSignedIn, useAuth } from '@/lib/auth';

export default function TabsLayout() {
  // Seed the cached value before the first listener fires so the first
  // paint already knows whether to render the tabs or bounce to /login.
  isSignedIn();
  const { signedIn } = useAuth();

  if (!signedIn) {
    return <Redirect href="/login" />;
  }
  return <AppTabs />;
}
