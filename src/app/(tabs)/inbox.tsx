import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, CardDivider } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusPill } from '@/components/ui/status-pill';
import { TypeChip } from '@/components/ui/type-chip';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateRange } from '@/lib/date';
import { leaveTypeColor } from '@/lib/leave-color';
import type { LeaveRequestWithType } from '@/lib/types';
import { useLeaveData } from '@/lib/use-leave-data';

interface Group {
  label: string;
  key: string;
  items: LeaveRequestWithType[];
}

export default function InboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { requests } = useLeaveData();

  const groups = useMemo<Group[]>(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const buckets: Record<string, LeaveRequestWithType[]> = {
      Today: [],
      'This week': [],
      'This month': [],
      Earlier: [],
    };
    for (const req of requests) {
      const ts = new Date(req.updatedAt).getTime();
      const diff = now - ts;
      if (diff < oneDay) buckets.Today.push(req);
      else if (diff < 7 * oneDay) buckets['This week'].push(req);
      else if (diff < 30 * oneDay) buckets['This month'].push(req);
      else buckets.Earlier.push(req);
    }
    return Object.entries(buckets)
      .filter(([, items]) => items.length > 0)
      .map(([label, items]) => ({ label, key: label, items }));
  }, [requests]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;
  const cancelledCount = requests.filter((r) => r.status === 'cancelled').length;

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
          <View style={styles.greeting}>
            <ThemedText type="subtitle">Inbox</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Status updates and history
            </ThemedText>
          </View>

          <Card>
            <View style={styles.statRow}>
              <StatBlock
                label="Pending"
                value={pendingCount}
                color={theme.warningFg}
              />
              <Divider />
              <StatBlock
                label="Approved"
                value={approvedCount}
                color={theme.successFg}
              />
              <Divider />
              <StatBlock
                label="Rejected"
                value={rejectedCount}
                color={theme.dangerFg}
              />
              <Divider />
              <StatBlock
                label="Cancelled"
                value={cancelledCount}
                color={theme.textMuted}
              />
            </View>
          </Card>

          {groups.length === 0 ? (
            <EmptyState
              title="No updates yet"
              description="When your leave status changes, you'll see it here."
            />
          ) : (
            groups.map((group) => (
              <View key={group.key} style={styles.section}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {group.label.toUpperCase()} · {group.items.length}
                </ThemedText>
                <Card>
                  {group.items.map((req, idx) => (
                    <Pressable
                      key={req.id}
                      onPress={() => router.navigate(`/leave/${req.id}`)}
                    >
                      {idx > 0 && <CardDivider />}
                      <View style={styles.row}>
                        <View
                          style={[
                            styles.leadingBar,
                            { backgroundColor: leaveTypeColor(theme, req.type.key) },
                          ]}
                        />
                        <View style={{ flex: 1, gap: Spacing.one }}>
                          <View style={styles.rowHeader}>
                            <TypeChip type={req.type} />
                            <StatusPill status={req.status} size="sm" />
                          </View>
                          <ThemedText type="smallBold">
                            {formatDateRange(req.startDate, req.endDate)}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {new Date(req.updatedAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </ThemedText>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </Card>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function StatBlock({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
      <ThemedText style={[styles.statValue, { color }]}>
        {value}
      </ThemedText>
      <ThemedText type="tiny" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return (
    <View
      style={{
        width: StyleSheet.hairlineWidth,
        alignSelf: 'stretch',
        backgroundColor: theme.border,
      }}
    />
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
  greeting: { gap: 2 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  stat: { flex: 1, alignItems: 'center', gap: Spacing.one },
  statValue: { fontSize: 22, fontWeight: '700' },
  section: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  leadingBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    minHeight: 36,
  },
  pressed: { opacity: 0.7 },
});
