import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { leaveTypeColor } from '@/lib/leave-color';
import type { LeaveType } from '@/lib/types';
import { ThemedText } from '../themed-text';

export function TypeChip({
  type,
  days,
  size = 'md',
}: {
  type: LeaveType;
  days?: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const theme = useTheme();
  const dotSize = size === 'lg' ? 14 : size === 'sm' ? 8 : 10;
  const dotColor = leaveTypeColor(theme, type.key);

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: dotColor,
          },
        ]}
      />
      <ThemedText
        style={[
          size === 'lg' ? styles.lg : styles.md,
          size === 'sm' && { color: theme.textSecondary },
        ]}
      >
        {type.label}
      </ThemedText>
      {typeof days === 'number' && (
        <View style={[styles.badge, { backgroundColor: theme.surfaceMuted }]}>
          <ThemedText style={styles.badgeText}>
            {days} {days === 1 ? 'day' : 'days'}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    borderRadius: 999,
  },
  md: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  lg: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
