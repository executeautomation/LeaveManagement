import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LeaveStatus } from '@/lib/types';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

const STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export function StatusPill({
  status,
  size = 'md',
}: {
  status: LeaveStatus;
  size?: 'sm' | 'md';
}) {
  const theme = useTheme();
  const palette = STATUS_PALETTE[status];
  const isSmall = size === 'sm';

  return (
    <ThemedView
      style={[
        styles.pill,
        isSmall && styles.pillSmall,
        { backgroundColor: palette.bg(theme) },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: palette.fg(theme) }]} />
      <ThemedText
        style={[
          styles.label,
          isSmall && styles.labelSmall,
          { color: palette.fg(theme) },
        ]}
      >
        {STATUS_LABELS[status]}
      </ThemedText>
    </ThemedView>
  );
}

const STATUS_PALETTE: Record<
  LeaveStatus,
  { bg: (t: ReturnType<typeof useTheme>) => string; fg: (t: ReturnType<typeof useTheme>) => string }
> = {
  pending: {
    bg: (t) => t.warningSoft,
    fg: (t) => t.warningFg,
  },
  approved: {
    bg: (t) => t.successSoft,
    fg: (t) => t.successFg,
  },
  rejected: {
    bg: (t) => t.dangerSoft,
    fg: (t) => t.dangerFg,
  },
  cancelled: {
    bg: (t) => t.surfaceMuted,
    fg: (t) => t.textSecondary,
  },
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  pillSmall: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontSize: 11,
  },
});
