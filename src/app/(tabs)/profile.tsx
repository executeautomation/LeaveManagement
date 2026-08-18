import { useCallback, useMemo, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { PlatformIcon } from '@/components/platform-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card, CardDivider } from '@/components/ui/card';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { signOut, useAuth } from '@/lib/auth';
import { listBalances } from '@/lib/leave-repo';
import { setAnnualTotal, setWeatherCity } from '@/lib/settings';
import { useLeaveData } from '@/lib/use-leave-data';

const CHECKMARK = {
  ios: 'checkmark',
  android: 'check',
  web: 'check',
} as const;
const EDIT = {
  ios: 'pencil',
  android: 'edit',
  web: 'edit',
} as const;
const PLUS = { ios: 'plus', android: 'add', web: 'add' } as const;
const MINUS = { ios: 'minus', android: 'remove', web: 'remove' } as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { username } = useAuth();
  const { types, year, annualTotal, weatherCity, reload } = useLeaveData();
  const balances = listBalances(year);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(annualTotal));

  const [cityEditing, setCityEditing] = useState(false);
  const [cityDraft, setCityDraft] = useState(weatherCity);

  // Keep draft in sync when annualTotal changes (after save).
  const lastTotal = useMemo(() => annualTotal, [annualTotal]);

  const beginEdit = useCallback(() => {
    setDraft(String(lastTotal));
    setEditing(true);
  }, [lastTotal]);

  const cancelEdit = useCallback(() => {
    setDraft(String(lastTotal));
    setEditing(false);
  }, [lastTotal]);

  const commitEdit = useCallback(() => {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      setAnnualTotal(parsed);
      reload();
    }
    setEditing(false);
  }, [draft, reload]);

  const adjust = useCallback(
    (delta: number) => {
      setDraft((prev) => {
        const next = Math.max(0, Math.min(365, (Number.parseInt(prev, 10) || 0) + delta));
        return String(next);
      });
    },
    [],
  );

  const beginCityEdit = useCallback(() => {
    setCityDraft(weatherCity);
    setCityEditing(true);
  }, [weatherCity]);

  const cancelCityEdit = useCallback(() => {
    setCityDraft(weatherCity);
    setCityEditing(false);
  }, [weatherCity]);

  const commitCityEdit = useCallback(() => {
    const trimmed = cityDraft.trim();
    if (trimmed.length > 0) {
      setWeatherCity(trimmed);
      reload();
    }
    setCityEditing(false);
  }, [cityDraft, reload]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          },
        ]}
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.accent },
              ]}
            >
              <ThemedText
                style={[styles.avatarInitials, { color: theme.accentFg }]}
              >
                YOU
              </ThemedText>
            </View>
            <View>
              <ThemedText type="subtitle">You</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Leave year {year}
              </ThemedText>
            </View>
          </View>

          {/* Weather city — feeds the dashboard's weather card */}
          <Card>
            <View style={styles.cardHeader}>
              <ThemedText type="title">Weather city</ThemedText>
              {cityEditing ? null : (
                <Pressable onPress={beginCityEdit} hitSlop={10}>
                  <View style={styles.editBtn}>
                    <PlatformIcon
                      tintColor={theme.accent}
                      name={EDIT}
                      size={14}
                    />
                    <ThemedText style={[styles.editBtnText, { color: theme.accent }]}>
                      Edit
                    </ThemedText>
                  </View>
                </Pressable>
              )}
            </View>

            {cityEditing ? (
              <View style={styles.editor}>
                <TextInput
                  value={cityDraft}
                  onChangeText={setCityDraft}
                  placeholder="City name"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="words"
                  selectTextOnFocus
                  style={[
                    styles.cityInput,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.surfaceMuted,
                    },
                  ]}
                />
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={{ textAlign: 'center' }}
                >
                  Used by the dashboard&apos;s weather card
                </ThemedText>
                <View style={styles.editorActions}>
                  <Button
                    label="Cancel"
                    variant="ghost"
                    size="sm"
                    onPress={cancelCityEdit}
                  />
                  <Button
                    label="Save"
                    size="sm"
                    leadingIcon={CHECKMARK}
                    onPress={commitCityEdit}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.quotaRow}>
                <View
                  style={[
                    styles.cityBadge,
                    { backgroundColor: theme.accentSoft },
                  ]}
                >
                  <ThemedText
                    style={[styles.cityBadgeText, { color: theme.accentFg }]}
                    numberOfLines={1}
                  >
                    {weatherCity}
                  </ThemedText>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText type="smallBold">dashboard weather</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Open-Meteo looks up the city and shows the current
                    temperature with a small animation.
                  </ThemedText>
                </View>
              </View>
            )}
          </Card>

          {/* Editable annual total — main control of the screen */}
          <Card>
            <View style={styles.cardHeader}>
              <ThemedText type="title">Annual leave quota</ThemedText>
              {editing ? null : (
                <Pressable onPress={beginEdit} hitSlop={10}>
                  <View style={styles.editBtn}>
                    <PlatformIcon
                      tintColor={theme.accent}
                      name={EDIT}
                      size={14}
                    />
                    <ThemedText style={[styles.editBtnText, { color: theme.accent }]}>
                      Edit
                    </ThemedText>
                  </View>
                </Pressable>
              )}
            </View>

            {editing ? (
              <View style={styles.editor}>
                <View style={styles.editorRow}>
                  <Pressable
                    onPress={() => adjust(-1)}
                    hitSlop={8}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <ThemedView type="surfaceMuted" style={styles.stepBtn}>
                      <PlatformIcon tintColor={theme.text} name={MINUS} size={18} />
                    </ThemedView>
                  </Pressable>
                  <TextInput
                    value={draft}
                    onChangeText={(t) => setDraft(t.replace(/[^0-9]/g, ''))}
                    keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                    selectTextOnFocus
                    style={[
                      styles.editorInput,
                      {
                        color: theme.text,
                        borderColor: theme.border,
                        backgroundColor: theme.surfaceMuted,
                      },
                    ]}
                  />
                  <Pressable
                    onPress={() => adjust(1)}
                    hitSlop={8}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <ThemedView type="surfaceMuted" style={styles.stepBtn}>
                      <PlatformIcon tintColor={theme.text} name={PLUS} size={18} />
                    </ThemedView>
                  </Pressable>
                </View>
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={{ textAlign: 'center' }}
                >
                  Days available for {year}
                </ThemedText>
                <View style={styles.editorActions}>
                  <Button
                    label="Cancel"
                    variant="ghost"
                    size="sm"
                    onPress={cancelEdit}
                  />
                  <Button
                    label="Save"
                    size="sm"
                    leadingIcon={CHECKMARK}
                    onPress={commitEdit}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.quotaRow}>
                <ThemedText style={styles.quotaNumber}>
                  {annualTotal}
                </ThemedText>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText type="smallBold">days / year</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Total annual leave you&apos;re entitled to. Affects the
                    dashboard&apos;s &ldquo;Annual days left&rdquo;.
                  </ThemedText>
                </View>
              </View>
            )}
          </Card>

          <Card>
            <ThemedText type="title">Leave types</ThemedText>
            <CardDivider />
            {types.map((t, idx) => {
              const allocated = balances.find((b) => b.typeKey === t.key)?.allocated ?? 0;
              return (
                <View key={t.key}>
                  {idx > 0 && <CardDivider />}
                  <View style={styles.typeRow}>
                    <View
                      style={[styles.dot, { backgroundColor: t.color }]}
                    />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">{t.label}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {t.paid ? 'Paid' : 'Unpaid'}
                        {t.requiresReason ? ' · Reason required' : ''}
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold">
                      {allocated === 0 ? '∞' : `${allocated}d`}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </Card>

          <Card>
            <ThemedText type="title">About</ThemedText>
            <CardDivider />
            <ThemedText type="small" themeColor="textSecondary">
              All leave data is stored locally on this device using SQLite.
            </ThemedText>
            <ThemedText type="small" themeColor="textMuted">
              Expo SDK 57 · React Native 0.86 · expo-router v6
            </ThemedText>
          </Card>

          <Card>
            <ThemedText type="title">Account</ThemedText>
            <CardDivider />
            <ThemedText type="small" themeColor="textSecondary">
              Signed in as
            </ThemedText>
            <ThemedText type="smallBold">{username ?? 'admin'}</ThemedText>
            <View style={styles.signOutWrap}>
              <Button
                label="Sign out"
                variant="danger"
                fullWidth
                onPress={() => {
                  signOut();
                  router.replace('/login');
                }}
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { width: '100%', alignItems: 'center' },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  signOutWrap: {
    marginTop: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: Radius.pill,
  },
  editBtnText: { fontSize: 13, fontWeight: '700' },
  quotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  quotaNumber: {
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '800',
    letterSpacing: -2,
  },
  editor: { gap: Spacing.two },
  editorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorInput: {
    minWidth: 100,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  cityInput: {
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    fontSize: 16,
    fontWeight: '600',
  },
  cityBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  pressed: { opacity: 0.7 },
});
