import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card, CardDivider } from '@/components/ui/card';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { countWorkingDays, formatDateLong } from '@/lib/date';
import { leaveTypeColor } from '@/lib/leave-color';
import { createLeaveRequest } from '@/lib/leave-repo';
import type { LeaveTypeKey } from '@/lib/types';
import { useLeaveData } from '@/lib/use-leave-data';

const SUBMIT_ICON = { ios: 'paperplane.fill', android: 'send', web: 'send' } as const;

export default function ApplyLeaveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { types, summaries, annualTotal } = useLeaveData();

  const [typeKey, setTypeKey] = useState<LeaveTypeKey>('annual');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const selectedType = types.find((t) => t.key === typeKey);
  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return countWorkingDays(startDate, endDate);
  }, [startDate, endDate]);

  const summary = summaries.find((s) => s.typeKey === typeKey);
  const overdraw = useMemo(() => {
    if (typeKey === 'annual') {
      return days + (summary?.used ?? 0) > annualTotal;
    }
    if (!summary || summary.allocated === 0) return false;
    return days + summary.used > summary.allocated;
  }, [summary, days, typeKey, annualTotal]);

  const reasonMissing =
    (selectedType?.requiresReason ?? false) && reason.trim().length === 0;
  const canSubmit = !!startDate && !!endDate && days > 0 && !reasonMissing;

  function onStartValueChange(_event: DateTimePickerChangeEvent, value: Date) {
    setStartDate(value);
    if (endDate && endDate.getTime() < value.getTime()) {
      setEndDate(value);
    }
  }

  function onStartDismiss() {
    if (Platform.OS !== 'ios') setShowStart(false);
  }

  function onEndValueChange(_event: DateTimePickerChangeEvent, value: Date) {
    setEndDate(value);
  }

  function onEndDismiss() {
    if (Platform.OS !== 'ios') setShowEnd(false);
  }

  function submit() {
    if (!startDate || !endDate) return;
    try {
      const created = createLeaveRequest({
        typeKey,
        startDate,
        endDate,
        reason,
        status: 'pending',
      });
      router.replace(`/leave/${created.id}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create leave request';
      Alert.alert('Could not submit', message);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Apply for Leave',
          headerShown: true,
          presentation: 'modal',
          headerStyle: { backgroundColor: theme.background },
          headerTitleStyle: { color: theme.text },
          headerTintColor: theme.accent,
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Spacing.three,
            paddingBottom: insets.bottom + Spacing.four,
          },
        ]}
      >
        <View style={styles.inner}>
          <Card>
            <ThemedText type="title">Leave type</ThemedText>
            <CardDivider />
            <View style={styles.typeGrid}>
              {types.map((t) => {
                const isActive = typeKey === t.key;
                const s = summaries.find((x) => x.typeKey === t.key);
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setTypeKey(t.key)}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <ThemedView
                      type={isActive ? 'surfaceSelected' : 'surfaceMuted'}
                      style={[
                        styles.typeChip,
                        isActive && {
                          borderColor: leaveTypeColor(theme, t.key),
                          borderWidth: 2,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.typeDot,
                          { backgroundColor: leaveTypeColor(theme, t.key) },
                        ]}
                      />
                      <View>
                        <ThemedText type="smallBold">{t.label}</ThemedText>
                        {s ? (
                          <ThemedText type="small" themeColor="textSecondary">
                            {s.remaining} day{s.remaining === 1 ? '' : 's'} left
                          </ThemedText>
                        ) : null}
                      </View>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card>
            <ThemedText type="title">Dates</ThemedText>
            <CardDivider />
            <View style={styles.datesRow}>
              <DateField
                label="Start"
                value={startDate}
                onPress={() => {
                  setShowEnd(false);
                  setShowStart(true);
                }}
              />
              <DateField
                label="End"
                value={endDate}
                onPress={() => {
                  setShowStart(false);
                  setShowEnd(true);
                }}
              />
            </View>
            {startDate && endDate ? (
              <View
                style={[
                  styles.daySummary,
                  { backgroundColor: theme.surfaceMuted },
                ]}
              >
                <ThemedText type="smallBold">
                  {days} working {days === 1 ? 'day' : 'days'}
                </ThemedText>
                {overdraw ? (
                  <ThemedText
                    type="small"
                    style={[styles.warning, { color: theme.dangerFg }]}
                  >
                    Exceeds your annual balance for this type
                  </ThemedText>
                ) : null}
              </View>
            ) : null}
          </Card>

          <Card>
            <ThemedText type="title">Reason</ThemedText>
            <CardDivider />
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder={
                selectedType?.requiresReason
                  ? 'Required for this leave type'
                  : 'Optional'
              }
              placeholderTextColor={theme.textMuted}
              multiline
              style={[
                styles.textInput,
                {
                  color: theme.text,
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}
            />
          </Card>

          {showStart ? (
            <DateTimePicker
              value={startDate ?? new Date()}
              mode="date"
              minimumDate={new Date()}
              onValueChange={onStartValueChange}
              onDismiss={onStartDismiss}
            />
          ) : null}
          {showEnd ? (
            <DateTimePicker
              value={endDate ?? startDate ?? new Date()}
              mode="date"
              minimumDate={startDate ?? new Date()}
              onValueChange={onEndValueChange}
              onDismiss={onEndDismiss}
            />
          ) : null}

          <View style={styles.spacer} />
          <Button
            label="Submit request"
            fullWidth
            size="lg"
            leadingIcon={SUBMIT_ICON}
            disabled={!canSubmit}
            onPress={submit}
          />
          {reasonMissing ? (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.helper}
            >
              This leave type requires a reason.
            </ThemedText>
          ) : null}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function DateField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: Date | null;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <ThemedView
        type="surfaceMuted"
        style={[styles.dateField, { borderColor: theme.border }]}
      >
        <ThemedText type="tiny" themeColor="textSecondary">
          {label.toUpperCase()}
        </ThemedText>
        <ThemedText type="default" style={{ fontWeight: '600' }}>
          {value ? formatDateLong(value) : 'Select date'}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { width: '100%', alignItems: 'center', gap: Spacing.three },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  typeChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  datesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  dateField: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    gap: Spacing.one,
    borderWidth: 1,
  },
  daySummary: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  warning: { fontWeight: '600' },
  textInput: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 96,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  spacer: { height: Spacing.three },
  helper: { textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
