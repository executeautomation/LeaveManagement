import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card, CardDivider } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/status-pill';
import { TypeChip } from '@/components/ui/type-chip';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { formatDateLong } from '@/lib/date';
import {
    deleteLeaveRequest,
    updateLeaveRequestStatus,
} from '@/lib/leave-repo';
import type { LeaveStatus } from '@/lib/types';
import { useLeaveData } from '@/lib/use-leave-data';

export default function LeaveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requests, types } = useLeaveData();

  const req = useMemo(() => requests.find((r) => r.id === id), [requests, id]);
  const [busy, setBusy] = useState(false);

  if (!req) {
    return (
      <ThemedView style={styles.missing}>
        <Stack.Screen options={{ title: 'Request', headerShown: true }} />
        <ThemedText type="subtitle">Request not found</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          It may have been deleted.
        </ThemedText>
        <Button label="Back" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  const type = types.find((t) => t.key === req.typeKey);

  function transition(next: LeaveStatus) {
    if (!req) return;
    setBusy(true);
    try {
      updateLeaveRequestStatus(req.id, next);
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : 'Could not update';
      Alert.alert('Update failed', m);
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!req) return;
    Alert.alert('Delete request?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteLeaveRequest(req.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Leave request', headerShown: true }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.four },
        ]}>
        <View style={styles.inner}>
          <Card>
            <View style={styles.headerRow}>
              {type && <TypeChip type={type} days={req.days} size="lg" />}
              <StatusPill status={req.status} />
            </View>
            <CardDivider />
            <DetailRow label="Start" value={formatDateLong(req.startDate)} />
            <DetailRow label="End" value={formatDateLong(req.endDate)} />
            <DetailRow
              label="Working days"
              value={`${req.days} ${req.days === 1 ? 'day' : 'days'}`}
            />
            <DetailRow
              label="Submitted"
              value={new Date(req.createdAt).toLocaleString()}
            />
            <DetailRow
              label="Last updated"
              value={new Date(req.updatedAt).toLocaleString()}
            />
          </Card>

          {req.reason ? (
            <Card>
              <ThemedText type="small" themeColor="textSecondary">
                Reason
              </ThemedText>
              <ThemedText>{req.reason}</ThemedText>
            </Card>
          ) : null}

          <View style={styles.actions}>
            {req.status === 'pending' && (
              <>
                <Button
                  label="Mark approved"
                  variant="success"
                  fullWidth
                  disabled={busy}
                  onPress={() => transition('approved')}
                />
                <Button
                  label="Mark rejected"
                  variant="danger"
                  fullWidth
                  disabled={busy}
                  onPress={() => transition('rejected')}
                />
              </>
            )}
            {req.status === 'approved' && (
              <Button
                label="Mark pending"
                variant="secondary"
                fullWidth
                disabled={busy}
                onPress={() => transition('pending')}
              />
            )}
            {req.status === 'rejected' && (
              <Button
                label="Mark pending"
                variant="secondary"
                fullWidth
                disabled={busy}
                onPress={() => transition('pending')}
              />
            )}
            {req.status !== 'cancelled' && (
              <Pressable onPress={confirmDelete}>
                <ThemedText type="linkPrimary" style={styles.deleteLink}>
                  Delete request
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  actions: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  deleteLink: {
    marginTop: Spacing.two,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
});
