import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card, CardDivider } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusPill } from '@/components/ui/status-pill';
import { TypeChip } from '@/components/ui/type-chip';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateRange } from '@/lib/date';
import { leaveTypeColor } from '@/lib/leave-color';
import type { LeaveStatus, LeaveTypeKey } from '@/lib/types';
import { useLeaveData } from '@/lib/use-leave-data';

type StatusFilter = 'all' | LeaveStatus;
type TypeFilter = 'all' | LeaveTypeKey;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
];

const ADD_ICON = { ios: 'plus', android: 'add', web: 'add' } as const;

export default function LeaveListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { requests, types } = useLeaveData();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (typeFilter !== 'all' && r.typeKey !== typeFilter) return false;
      return true;
    });
  }, [requests, statusFilter, typeFilter]);

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
            <View style={{ gap: 2 }}>
              <ThemedText type="subtitle">My leave</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {filtered.length} {filtered.length === 1 ? 'request' : 'requests'}
                {typeFilter !== 'all' || statusFilter !== 'all' ? ' • filtered' : ''}
              </ThemedText>
            </View>
            <Button
              label="Apply"
              size="sm"
              leadingIcon={ADD_ICON}
              onPress={() => router.navigate('/leave/apply')}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {STATUS_FILTERS.map((f) => (
              <FilterPill
                key={f.key}
                label={f.label}
                active={statusFilter === f.key}
                onPress={() => setStatusFilter(f.key)}
                theme={theme}
              />
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <FilterPill
              label="All types"
              active={typeFilter === 'all'}
              onPress={() => setTypeFilter('all')}
              theme={theme}
            />
            {types.map((t) => (
              <FilterPill
                key={t.key}
                label={t.label}
                active={typeFilter === t.key}
                onPress={() => setTypeFilter(t.key)}
                color={t.color}
                theme={theme}
              />
            ))}
          </ScrollView>

          {filtered.length === 0 ? (
            <EmptyState
              title="No matching requests"
              description="Try adjusting the filters or apply for new leave."
            />
          ) : (
            <Card>
              {filtered.map((req, idx) => (
                <Pressable
                  key={req.id}
                  onPress={() => router.navigate(`/leave/${req.id}`)}
                >
                  {idx > 0 && <CardDivider />}
                  <View style={styles.requestRow}>
                    <View
                      style={[
                        styles.leadingBar,
                        { backgroundColor: leaveTypeColor(theme, req.type.key) },
                      ]}
                    />
                    <View style={{ flex: 1, gap: Spacing.one }}>
                      <View style={styles.requestHeader}>
                        <TypeChip type={req.type} />
                        <StatusPill status={req.status} size="sm" />
                      </View>
                      <ThemedText type="smallBold">
                        {formatDateRange(req.startDate, req.endDate)}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {req.days} working day{req.days === 1 ? '' : 's'}
                        {req.reason ? ` • ${req.reason}` : ''}
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

type Theme = ReturnType<typeof useTheme>;

function FilterPill({
  label,
  active,
  onPress,
  color,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
  theme: Theme;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && {
          backgroundColor: theme.accent,
          borderColor: theme.accent,
        },
        pressed && styles.pressed,
      ]}
    >
      {color ? (
        <View style={[styles.pillDot, { backgroundColor: color }]} />
      ) : null}
      <ThemedText
        type="smallBold"
        style={{
          color: active ? theme.accentFg : theme.textSecondary,
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  filterRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.25)',
  },
  pillDot: { width: 8, height: 8, borderRadius: 4 },
  pressed: { opacity: 0.7 },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  requestHeader: {
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
});
