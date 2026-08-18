import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlatformIcon } from '@/components/platform-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, CardDivider } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusPill } from '@/components/ui/status-pill';
import { TypeChip } from '@/components/ui/type-chip';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addMonths, daysInMonth, formatDateLong, isWeekend, monthLabel, parseIsoDate } from '@/lib/date';
import { leaveTypeColor } from '@/lib/leave-color';
import { listLeaveRequestsByMonth } from '@/lib/leave-repo';
import type { LeaveRequestWithType } from '@/lib/types';
import { useLeaveData } from '@/lib/use-leave-data';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { types } = useLeaveData();
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDay, setSelectedDay] = useState<string | null>(isoDay(today));

  const requests = useMemo(
    () => listLeaveRequestsByMonth(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  const eventsByDay = useMemo(() => buildEventsByDay(requests), [requests]);
  const dayList = useMemo(
    () => buildDayList(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  const selectedRequests = selectedDay ? eventsByDay.get(selectedDay) ?? [] : [];

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
          <View>
            <ThemedText type="subtitle">Calendar</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Tap a day to see leave
            </ThemedText>
          </View>

          <View style={styles.header}>
            <NavButton
              direction="left"
              onPress={() => setCursor((c) => addMonths(c.year, c.month, -1))}
            />
            <ThemedText type="title">{monthLabel(cursor.year, cursor.month)}</ThemedText>
            <NavButton
              direction="right"
              onPress={() => setCursor((c) => addMonths(c.year, c.month, 1))}
            />
          </View>

          <Card padded>
            <View style={styles.weekRow}>
              {WEEKDAY_LABELS.map((w, i) => (
                <View key={`${w}-${i}`} style={styles.weekCell}>
                  <ThemedText type="tiny" themeColor="textMuted">
                    {w}
                  </ThemedText>
                </View>
              ))}
            </View>

            <View style={styles.grid}>
              {dayList.map((cell, idx) => (
                <DayCell
                  key={cell ?? `pad-${idx}`}
                  iso={cell}
                  isToday={cell != null && isSameDay(parseIsoDate(cell), today)}
                  isSelected={cell != null && cell === selectedDay}
                  isWeekend={cell != null && isWeekend(parseIsoDate(cell))}
                  dots={cell
                    ? (eventsByDay.get(cell) ?? []).map((e) =>
                        leaveTypeColor(theme, e.type.key),
                      )
                    : []}
                  onPress={() => cell && setSelectedDay(cell)}
                />
              ))}
            </View>
          </Card>

          <View style={styles.legend}>
            {types
              .filter((t) => t.key !== 'unpaid')
              .map((t) => (
                <View key={t.key} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: leaveTypeColor(theme, t.key) },
                    ]}
                  />
                  <ThemedText type="small">{t.label}</ThemedText>
                </View>
              ))}
          </View>

          <View style={styles.section}>
            <ThemedText type="title">
              {selectedDay ? formatDateLong(selectedDay) : 'Select a day'}
            </ThemedText>
            {selectedRequests.length === 0 ? (
              <EmptyState
                title="No leave on this day"
                description="Pick another day with a colored dot to see leave events."
              />
            ) : (
              <Card>
                {selectedRequests.map((req, idx) => (
                  <Pressable
                    key={req.id}
                    onPress={() => router.navigate(`/leave/${req.id}`)}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    {idx > 0 && <CardDivider />}
                    <View style={styles.eventRow}>
                      <View
                        style={[
                          styles.leadingBar,
                          { backgroundColor: leaveTypeColor(theme, req.type.key) },
                        ]}
                      />
                      <View style={{ flex: 1, gap: Spacing.one }}>
                        <TypeChip type={req.type} />
                        <ThemedText type="small" themeColor="textSecondary">
                          {req.startDate === req.endDate
                            ? formatDateLong(req.startDate)
                            : `${formatDateLong(req.startDate)} – ${formatDateLong(req.endDate)}`}
                        </ThemedText>
                      </View>
                      <StatusPill status={req.status} size="sm" />
                    </View>
                  </Pressable>
                ))}
              </Card>
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function NavButton({
  direction,
  onPress,
}: {
  direction: 'left' | 'right';
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed, hovered }) => [
        styles.navBtnWrap,
        pressed && styles.pressed,
        // Web-specific hover/focus feedback; harmless on native
        Platform.OS === 'web'
          ? { backgroundColor: hovered ? theme.surfaceSelected : undefined }
          : null,
      ]}
    >
      <ThemedView type="surface" style={[styles.iconBtn, { borderColor: theme.border }]}>
        <PlatformIcon
          name={
            direction === 'left'
              ? { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }
              : { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }
          }
          size={18}
          tintColor={theme.text}
        />
      </ThemedView>
    </Pressable>
  );
}

function DayCell({
  iso,
  isToday,
  isSelected,
  isWeekend,
  dots,
  onPress,
}: {
  iso: string | null;
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
  dots: string[];
  onPress: () => void;
}) {
  const theme = useTheme();
  const date = iso ? parseIsoDate(iso) : null;

  let bg: string;
  let fg: string;
  if (isSelected) {
    bg = theme.accent;
    fg = theme.accentFg;
  } else if (isToday) {
    bg = theme.surfaceSelected;
    fg = theme.accent;
  } else {
    bg = theme.background;
    fg = isWeekend ? theme.textMuted : theme.text;
  }

  const ringColor = isToday && !isSelected ? theme.accent : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.cellWrap,
        // Web hover: gentle surface tint when not selected
        Platform.OS === 'web' && !isSelected
          ? { backgroundColor: hovered ? theme.surfaceMuted : undefined }
          : null,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.dayCell,
          {
            backgroundColor: bg,
            borderColor: ringColor,
          },
        ]}
      >
        {iso ? (
          <>
            <ThemedText
              type="smallBold"
              style={{ color: fg }}
            >
              {date!.getDate()}
            </ThemedText>
            {dots.length > 0 ? (
              <View style={styles.dotRow}>
                {dots.slice(0, 3).map((c, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dayDot,
                      {
                        backgroundColor: c,
                        // On web, when cell is selected, brighten dot edges
                        opacity: isSelected ? 0.95 : 1,
                      },
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function buildDayList(year: number, month: number): (string | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const total = daysInMonth(year, month);
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let day = 1; day <= total; day++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function buildEventsByDay(
  requests: LeaveRequestWithType[],
): Map<string, LeaveRequestWithType[]> {
  const map = new Map<string, LeaveRequestWithType[]>();
  for (const req of requests) {
    if (req.status === 'cancelled' || req.status === 'rejected') continue;
    const start = parseIsoDate(req.startDate);
    const end = parseIsoDate(req.endDate);
    const cur = new Date(start);
    while (cur.getTime() <= end.getTime()) {
      const key = isoDay(cur);
      const list = map.get(key) ?? [];
      list.push(req);
      map.set(key, list);
      cur.setDate(cur.getDate() + 1);
    }
  }
  return map;
}

const CELL_BASIS = `${100 / 7}%`;

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
    justifyContent: 'space-between',
  },
  navBtnWrap: {
    borderRadius: Radius.md,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: Spacing.one,
  },
  weekCell: {
    flexBasis: CELL_BASIS,
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Subtract margins from width so cells fit cleanly on web
    marginHorizontal: -2,
  },
  cellWrap: {
    flexBasis: CELL_BASIS,
    padding: 2,
    // Web-friendly feedback surfaces
  },
  dayCell: {
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 2,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 6,
  },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  section: { gap: Spacing.two },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  leadingBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    minHeight: 36,
  },
  pressed: { opacity: 0.7 },
});