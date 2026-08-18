import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';

export function BalanceBar({
  used,
  allocated,
  pending,
  color,
  delay = 0,
}: {
  used: number;
  allocated: number;
  pending: number;
  color: string;
  /** Optional delay in ms before the bar fills — used to stagger
   *  per-row animations on the dashboard. */
  delay?: number;
}) {
  const theme = useTheme();
  const safeAllocated = Math.max(allocated, 1);
  const total = used + pending;
  const usedPct = Math.min(100, Math.round((used / safeAllocated) * 100));
  const pendingPct = Math.min(
    100 - usedPct,
    Math.round((pending / safeAllocated) * 100),
  );

  // Animate fill widths from 0 → target so the dashboard bars visibly
  // grow in when the page mounts.
  const usedProgress = useSharedValue(0);
  const pendingProgress = useSharedValue(0);
  useEffect(() => {
    usedProgress.value = withDelay(
      delay,
      withTiming(usedPct, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      }),
    );
    pendingProgress.value = withDelay(
      delay,
      withTiming(pendingPct, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedPct, pendingPct, delay]);

  const usedAnimatedStyle = useAnimatedStyle(() => ({
    width: `${usedProgress.value}%`,
  }));
  const pendingAnimatedStyle = useAnimatedStyle(() => ({
    width: `${pendingProgress.value}%`,
  }));

  return (
    <View style={styles.wrapper}>
      <View
        style={[styles.track, { backgroundColor: theme.surfaceMuted }]}
      >
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: color },
            usedAnimatedStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              opacity: 0.4,
            },
            pendingAnimatedStyle,
          ]}
        />
      </View>
      <View style={styles.legendRow}>
        <ThemedText type="tiny" themeColor="textSecondary">
          {used}/{allocated} used
        </ThemedText>
        {pending > 0 ? (
          <ThemedText type="tiny" themeColor="warningFg">
            {pending} pending
          </ThemedText>
        ) : total > 0 ? (
          <ThemedText type="tiny" themeColor="textSecondary">
            Fully booked
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.one + 2,
  },
  track: {
    height: 8,
    width: '100%',
    borderRadius: Radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  fill: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
