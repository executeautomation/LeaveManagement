import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BalanceBar } from '@/components/ui/balance-bar';
import { Button } from '@/components/ui/button';
import { Card, CardDivider } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LeaveTypeInfoModal } from '@/components/ui/leave-type-info-modal';
import { StatusPill } from '@/components/ui/status-pill';
import { TypeChip } from '@/components/ui/type-chip';
import { WeatherCard } from '@/components/ui/weather-card';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateLong, formatDateRange } from '@/lib/date';
import { leaveTypeColor } from '@/lib/leave-color';
import type { BalanceSummary, LeaveType } from '@/lib/types';
import { useCountUp } from '@/lib/use-count-up';
import { useLeaveData } from '@/lib/use-leave-data';

const ADD_ICON = { ios: 'plus', android: 'add', web: 'add' } as const;
const ARROW_ICON = { ios: 'arrow.right', android: 'arrow_right', web: 'arrow_right' } as const;

// Apply alpha to a hex color so the inverse-surface card (dark in light mode,
// white in dark mode) gets a track/border that flips with it instead of being
// hardcoded white.
function withOpacity(hex: string, opacity: number): string {
  const m = hex.replace('#', '');
  const value =
    m.length === 3
      ? m
          .split('')
          .map((c) => c + c)
          .join('')
      : m;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// `Animated.View` entering helper — the dashboard mounts each section in
// sequence (greeting → hero → weather → balances → upcoming → recent) so
// they fade and slide in one after another instead of all at once.
function Section({
  children,
  index,
  style,
}: {
  children: React.ReactNode;
  index: number;
  style?: object;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 110)
        .duration(450)
        .easing(Easing.out(Easing.cubic))}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { requests, summaries, types, year, annualTotal, weatherCity } = useLeaveData();
  const [infoTarget, setInfoTarget] = useState<{
    type: LeaveType;
    summary: BalanceSummary;
  } | null>(null);

  const annual = summaries.find((s) => s.typeKey === 'annual');
  const totalPending = summaries.reduce((acc, s) => acc + s.pending, 0);
  const annualRemaining = Math.max(0, annualTotal - (annual?.used ?? 0));

  const upcoming = requests
    .filter(
      (r) =>
        r.status !== 'cancelled' &&
        r.status !== 'rejected' &&
        new Date(r.endDate) >= new Date(),
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3);

  const recent = requests
    .filter((r) => r.status !== 'cancelled')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);

  const used = annual?.used ?? 0;
  const pending = annual?.pending ?? 0;
  const safeTotal = Math.max(annualTotal, 1);
  const pct = Math.min(100, Math.round((used / safeTotal) * 100));

  // Counters that animate 0 → target on mount so the dashboard numbers
  // visibly tick up rather than snapping in.
  const annualRemainingAnimated = useCountUp(annualRemaining, 800);
  const pctAnimated = useCountUp(Math.round(pct), 800);

  // Hero progress bar fill width — tweens from 0 → pct% on mount.
  const barProgress = useSharedValue(0);
  useEffect(() => {
    barProgress.value = withDelay(
      120,
      withTiming(pct, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);
  const barFillStyle = useAnimatedStyle(() => ({
    width: `${barProgress.value}%`,
  }));

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12
      ? 'Good morning'
      : greetingHour < 18
        ? 'Good afternoon'
        : 'Good evening';

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
          <Animated.View
            entering={FadeInDown.duration(400).easing(Easing.out(Easing.cubic))}
            style={styles.greeting}
          >
            <ThemedText type="small" themeColor="textSecondary">
              {formatDateLong(new Date().toISOString().slice(0, 10))}
            </ThemedText>
            <ThemedText type="subtitle">{greeting}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Here&apos;s how your {year} leave looks today.
            </ThemedText>
          </Animated.View>

          {/* Hero card */}
          <Section index={1}>
          <ThemedView
            type="surfaceInverse"
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <View>
                <ThemedText type="tiny" themeColor="textInverse">
                  Annual Leave
                </ThemedText>
                <View style={styles.heroNumberRow}>
                  <ThemedText
                    style={[
                      styles.heroNumber,
                      { color: theme.accentFg },
                    ]}
                  >
                    {Math.round(annualRemainingAnimated)}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.heroUnit,
                      { color: theme.accentFg },
                    ]}
                  >
                    / {annualTotal} days
                  </ThemedText>
                </View>
                <ThemedText
                  type="small"
                  style={{ color: theme.accentFg, opacity: 0.75 }}
                >
                  Used {used} • Pending {pending}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.heroRing,
                  { borderColor: withOpacity(theme.textInverse, 0.18) },
                ]}
              >
                <ThemedText
                  style={[styles.heroRingNumber, { color: theme.accentFg }]}
                >
                  {Math.round(pctAnimated)}%
                </ThemedText>
                <ThemedText
                  style={[
                    styles.heroRingLabel,
                    { color: theme.accentFg, opacity: 0.7 },
                  ]}
                >
                  used
                </ThemedText>
              </View>
            </View>
            <View style={styles.heroBarRow}>
              <View
                style={[
                  styles.heroBarTrack,
                  { backgroundColor: withOpacity(theme.textInverse, 0.12) },
                ]}
              >
                <Animated.View
                  style={[
                    styles.heroBarFill,
                    {
                      backgroundColor: theme.accent,
                    },
                    barFillStyle,
                  ]}
                />
              </View>
            </View>
            <View style={styles.heroActions}>
              <Button
                label="Apply for leave"
                leadingIcon={ADD_ICON}
                onPress={() => router.navigate('/leave/apply')}
              />
              <Button
                label="View all"
                variant="ghost"
                size="md"
                trailingIcon={ARROW_ICON}
                onPress={() => router.navigate('/leave')}
              />
            </View>
          </ThemedView>
          </Section>

          {/* Weather */}
          <Section index={2} style={styles.section}>
            <WeatherCard city={weatherCity} />
          </Section>

          {/* Pending requests snapshot */}
          <Section index={3} style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="title">Balances</ThemedText>
              {totalPending > 0 ? (
                <View
                  style={[
                    styles.dotWrap,
                    { backgroundColor: theme.warningSoft },
                  ]}
                >
                  <ThemedText
                    type="tiny"
                    style={{ color: theme.warningFg }}
                  >
                    {totalPending} pending
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <Card>
              {summaries.map((summary, idx) => {
                const type = types.find((t) => t.key === summary.typeKey);
                if (!type) return null;
                const color = leaveTypeColor(theme, type.key);
                return (
                  <View key={summary.typeKey}>
                    {idx > 0 && <CardDivider />}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${type.label} balance — tap for details`}
                      onPress={() =>
                        setInfoTarget({ type, summary })
                      }
                      style={({ pressed }) => [
                        styles.balanceRow,
                        pressed && styles.balanceRowPressed,
                      ]}
                    >
                      <View style={styles.balanceTop}>
                        <TypeChip type={type} />
                        <View style={styles.balanceMeta}>
                          <ThemedText type="smallBold">
                            {summary.remaining}
                            <ThemedText
                              type="small"
                              themeColor="textSecondary"
                            >
                              {' '}/ {summary.allocated} days
                            </ThemedText>
                          </ThemedText>
                          <View
                            style={[
                              styles.infoBadge,
                              {
                                backgroundColor: theme.surfaceMuted,
                                borderColor: theme.border,
                              },
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.infoBadgeText,
                                { color },
                              ]}
                            >
                              ⓘ
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                      <BalanceBar
                        used={summary.used}
                        allocated={summary.allocated}
                        pending={summary.pending}
                        color={color}
                        delay={220 + idx * 70}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          </Section>

          {/* Upcoming */}
          <Section index={4} style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="title">Upcoming</ThemedText>
              <ThemedText
                style={[styles.linkText, { color: theme.accent }]}
                onPress={() => router.navigate('/leave')}
              >
                See all
              </ThemedText>
            </View>
            {upcoming.length === 0 ? (
              <EmptyState
                title="No upcoming leave"
                description="When you have approved or pending leave, it will appear here."
              />
            ) : (
              <Card>
                {upcoming.map((req, idx) => (
                  <Pressable
                    key={req.id}
                    onPress={() => router.navigate(`/leave/${req.id}`)}
                  >
                    {idx > 0 && <CardDivider />}
                    <View style={styles.requestRow}>
                      <View style={styles.dateBadge}>
                        <ThemedText
                          type="tiny"
                          themeColor="textSecondary"
                        >
                          {new Date(req.startDate).toLocaleDateString(
                            undefined,
                            { month: 'short' },
                          )}
                        </ThemedText>
                        <ThemedText
                          style={styles.dateBadgeDay}
                        >
                          {new Date(req.startDate).getDate()}
                        </ThemedText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <TypeChip type={req.type} days={req.days} />
                        <ThemedText
                          type="smallBold"
                          style={styles.requestDate}
                        >
                          {formatDateRange(req.startDate, req.endDate)}
                        </ThemedText>
                      </View>
                      <StatusPill status={req.status} size="sm" />
                    </View>
                  </Pressable>
                ))}
              </Card>
            )}
          </Section>

          {/* Recent activity */}
          {recent.length > 0 ? (
            <Section index={5} style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="title">Recent activity</ThemedText>
              </View>
              <Card>
                {recent.map((req, idx) => (
                  <Pressable
                    key={req.id}
                    onPress={() => router.navigate(`/leave/${req.id}`)}
                  >
                    {idx > 0 && <CardDivider />}
                    <View style={styles.requestRow}>
                      <View style={{ flex: 1 }}>
                        <TypeChip type={req.type} />
                        <ThemedText
                          type="small"
                          themeColor="textSecondary"
                          style={styles.activityDate}
                        >
                          {formatDateLong(req.startDate)}
                        </ThemedText>
                      </View>
                      <StatusPill status={req.status} size="sm" />
                    </View>
                  </Pressable>
                ))}
              </Card>
            </Section>
          ) : null}
        </View>
      </ScrollView>

      {infoTarget ? (
        <LeaveTypeInfoModal
          visible={true}
          type={infoTarget.type}
          summary={infoTarget.summary}
          onClose={() => setInfoTarget(null)}
        />
      ) : null}
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
    gap: Spacing.four,
  },
  greeting: { gap: Spacing.one },
  hero: {
    padding: Spacing.four,
    borderRadius: Radius.xl,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroNumberRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  heroNumber: { fontSize: 56, lineHeight: 60, fontWeight: '800' },
  heroUnit: { fontSize: 16, fontWeight: '600' },
  heroRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingNumber: { fontSize: 18, fontWeight: '700' },
  heroRingLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroBarRow: { flexDirection: 'row', alignItems: 'center' },
  heroBarTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  heroBarFill: { height: '100%', borderRadius: 3 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, justifyContent: 'space-between' },
  section: { gap: Spacing.two },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: { fontSize: 13, fontWeight: '700' },
  dotWrap: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  balanceRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.one,
    marginVertical: -Spacing.one,
    marginHorizontal: -Spacing.one,
    borderRadius: Radius.md,
  },
  balanceRowPressed: {
    backgroundColor: 'rgba(127,127,127,0.06)',
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  infoBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBadgeText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    includeFontPadding: false,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  requestDate: { marginTop: Spacing.one },
  activityDate: { marginTop: 2 },
  dateBadge: {
    width: 44,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(127,127,127,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadgeDay: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
});
