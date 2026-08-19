// filepath: src/app/login.tsx
//
// Username + password sign-in screen.
//
// On success the gate (see `_layout.tsx`) flips the auth state and routes
// the user into `(tabs)`. There is no real backend — the credentials are
// checked against the hardcoded values in `lib/auth.ts`. We keep the UI
// honest about that with a small "Demo credentials" hint at the bottom.

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CREDENTIALS, signIn, useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signedIn } = useAuth();
  console.log('[LOGIN_SCREEN] mounted, signedIn=', signedIn);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If the gate ever sends us here already signed in (deep-link race),
  // bounce straight back to the tabs. Done in an effect so we don't call
  // `router.replace` during render — that triggers React's setState-during-
  // render warning because the navigation container wants to update.
  useEffect(() => {
    if (signedIn) {
      router.replace('/(tabs)');
    }
  }, [router, signedIn]);

  const onSubmit = useCallback(() => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    // Tiny delay so the button's pressed state has a chance to render
    // before the screen swaps — feels more responsive on web where the
    // route transition is otherwise instant.
    requestAnimationFrame(() => {
      const result = signIn(username, password);
      setSubmitting(false);
      if (result.ok) {
        router.replace('/(tabs)');
      } else {
        setError('Username or password is incorrect.');
      }
    });
  }, [password, router, submitting, username]);

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + Spacing.six,
              paddingBottom: insets.bottom + Spacing.five,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            <View style={styles.brand}>
              <View
                style={[
                  styles.logoDot,
                  { backgroundColor: theme.accent },
                ]}
              />
              <ThemedText type="title">Leave Manager</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Sign in to view your leave dashboard.
              </ThemedText>
            </View>

            <Card style={styles.card}>
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Username
                </ThemedText>
                <TextInput
                  value={username}
                  onChangeText={(value) => {
                    setUsername(value);
                    if (error) setError(null);
                  }}
                  placeholder="admin"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  keyboardType="default"
                  returnKeyType="next"
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.borderStrong,
                      backgroundColor: theme.surfaceMuted,
                    },
                  ]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Password
                </ThemedText>
                <View style={styles.passwordRow}>
                  <TextInput
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    secureTextEntry={!showPassword}
                    returnKeyType="go"
                    onSubmitEditing={onSubmit}
                    style={[
                      styles.input,
                      styles.passwordInput,
                      {
                        color: theme.text,
                        borderColor: theme.borderStrong,
                        backgroundColor: theme.surfaceMuted,
                      },
                    ]}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    onPress={() => setShowPassword((value) => !value)}
                    style={styles.eyeButton}
                  >
                    <ThemedText
                      type="smallBold"
                      style={{ color: theme.accent }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              {error ? (
                <View
                  style={[
                    styles.errorWrap,
                    {
                      backgroundColor: theme.dangerSoft,
                      borderColor: theme.danger,
                    },
                  ]}
                >
                  <ThemedText
                    type="smallBold"
                    style={{ color: theme.dangerFg }}
                  >
                    {error}
                  </ThemedText>
                </View>
              ) : null}

              <Button
                label={submitting ? 'Signing in…' : 'Sign in'}
                onPress={onSubmit}
                disabled={submitting || username.length === 0 || password.length === 0}
                fullWidth
                size="lg"
              />
            </Card>

            <View
              style={[
                styles.hintCard,
                {
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText type="tiny" themeColor="textSecondary">
                Demo credentials
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.hintLine}
              >
                Username:{' '}
                <ThemedText type="smallBold">{CREDENTIALS.username}</ThemedText>
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.hintLine}
              >
                Password:{' '}
                <ThemedText type="smallBold">{CREDENTIALS.password}</ThemedText>
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  brand: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  logoDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: Spacing.one,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  fieldGroup: {
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 15,
    fontWeight: '500',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  passwordInput: { flex: 1 },
  eyeButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  errorWrap: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  hintCard: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.half,
  },
  hintLine: { lineHeight: 20 },
});
