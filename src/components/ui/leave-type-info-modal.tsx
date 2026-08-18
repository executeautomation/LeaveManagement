// filepath: src/components/ui/leave-type-info-modal.tsx
//
// Theme-aware overlay that explains a leave type — used by the dashboard's
// balance rows. Built on a plain absolute-positioned View (instead of
// React Native's Modal) so it renders identically on iOS, Android, and web.
//
// Dismiss: tap the scrim, press Close, or hit Escape on web.

import { useEffect } from 'react';
import {
    Platform,
    Pressable,
    StyleSheet,
    View,
    type ViewProps,
} from 'react-native';

import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { leaveTypeColor } from '@/lib/leave-color';
import { getLeaveTypeInfo } from '@/lib/leave-type-info';
import type { BalanceSummary, LeaveType } from '@/lib/types';

import { ThemedText } from '../themed-text';
import { Button } from './button';

export type LeaveTypeInfoModalProps = ViewProps & {
  visible: boolean;
  onClose: () => void;
  type: LeaveType;
  summary: BalanceSummary;
};

export function LeaveTypeInfoModal({
  visible,
  onClose,
  type,
  summary,
  style,
  ...rest
}: LeaveTypeInfoModalProps) {
  const theme = useTheme();
  const info = getLeaveTypeInfo(type.key);
  const accent = leaveTypeColor(theme, type.key);

  // Escape closes the modal on web.
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <View
      // The outer View sits on top of every screen with a dimmed scrim.
      style={[styles.root, { pointerEvents: 'box-none' }, style]}
      {...rest}
    >
      <Pressable
        accessibilityLabel="Dismiss"
        style={[styles.scrim, { backgroundColor: theme.scrim }]}
        onPress={onClose}
      />

      <View
        // The card is centered horizontally and pinned near the bottom
        // (above safe area on native, viewport-bottom on web).
        style={styles.cardWrap}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
            Shadow.floating as object,
          ]}
        >
          {/* Header: colored accent dot + type label + close button. */}
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <View
                style={[styles.headerDot, { backgroundColor: accent }]}
              />
              <View style={{ flex: 1 }}>
                <ThemedText type="title">{type.label}</ThemedText>
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.tagline}
                >
                  {info.tagline}
                </ThemedText>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Close"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: theme.surfaceMuted },
                pressed && { opacity: 0.7 },
              ]}
            >
              <ThemedText
                style={[styles.closeIcon, { color: theme.text }]}
              >
                ✕
              </ThemedText>
            </Pressable>
          </View>

          {/* Balance block: how much of this leave is left. */}
          <View
            style={[
              styles.balanceBox,
              {
                backgroundColor: theme.surfaceMuted,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.balanceRow}>
              <View style={styles.balanceCell}>
                <ThemedText type="tiny" themeColor="textSecondary">
                  Allocated
                </ThemedText>
                <ThemedText style={styles.balanceNumber}>
                  {summary.allocated}
                </ThemedText>
                <ThemedText type="tiny" themeColor="textMuted">
                  days
                </ThemedText>
              </View>
              <View
                style={[
                  styles.balanceDivider,
                  { backgroundColor: theme.borderStrong },
                ]}
              />
              <View style={styles.balanceCell}>
                <ThemedText type="tiny" themeColor="textSecondary">
                  Used
                </ThemedText>
                <ThemedText style={styles.balanceNumber}>
                  {summary.used}
                </ThemedText>
                <ThemedText type="tiny" themeColor="textMuted">
                  days
                </ThemedText>
              </View>
              <View
                style={[
                  styles.balanceDivider,
                  { backgroundColor: theme.borderStrong },
                ]}
              />
              <View style={styles.balanceCell}>
                <ThemedText type="tiny" themeColor="textSecondary">
                  Pending
                </ThemedText>
                <ThemedText style={styles.balanceNumber}>
                  {summary.pending}
                </ThemedText>
                <ThemedText type="tiny" themeColor="textMuted">
                  days
                </ThemedText>
              </View>
              <View
                style={[
                  styles.balanceDivider,
                  { backgroundColor: theme.borderStrong },
                ]}
              />
              <View style={styles.balanceCell}>
                <ThemedText type="tiny" themeColor="textSecondary">
                  Remaining
                </ThemedText>
                <ThemedText
                  style={[styles.balanceNumber, { color: accent }]}
                >
                  {summary.remaining}
                </ThemedText>
                <ThemedText type="tiny" themeColor="textMuted">
                  days
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Description */}
          <ThemedText style={styles.description}>
                {info.description}
          </ThemedText>

          {/* When to use */}
          {info.whenToUse.length > 0 ? (
            <View style={styles.block}>
              <ThemedText
                type="smallBold"
                themeColor="textSecondary"
                style={styles.blockLabel}
              >
                WHEN TO USE
              </ThemedText>
              <View style={styles.bullets}>
                {info.whenToUse.map((line) => (
                  <View key={line} style={styles.bullet}>
                    <View
                      style={[
                        styles.bulletDot,
                        { backgroundColor: accent },
                      ]}
                    />
                    <ThemedText style={styles.bulletText}>
                      {line}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Notes */}
          {info.notes.length > 0 ? (
            <View style={styles.block}>
              <ThemedText
                type="smallBold"
                themeColor="textSecondary"
                style={styles.blockLabel}
              >
                THINGS TO KNOW
              </ThemedText>
              <View style={styles.bullets}>
                {info.notes.map((line) => (
                  <View key={line} style={styles.bullet}>
                    <View
                      style={[
                        styles.bulletDot,
                        styles.bulletDotOutline,
                        {
                          borderColor: theme.textMuted,
                          backgroundColor: 'transparent',
                        },
                      ]}
                    />
                    <ThemedText style={styles.bulletText}>
                      {line}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Footer action */}
          <View style={styles.footer}>
            <Button
              label="Close"
              variant="primary"
              fullWidth
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 24,
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardWrap: {
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  headerDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  tagline: {
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  balanceBox: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  balanceCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
  },
  balanceDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  balanceNumber: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
  block: {
    gap: Spacing.two,
  },
  blockLabel: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontSize: 11,
    lineHeight: 14,
  },
  bullets: {
    gap: Spacing.one,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  bulletDotOutline: {
    borderWidth: 1.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    marginTop: Spacing.one,
  },
});