import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <ThemedView type="surfaceMuted" style={styles.container}>
      <View style={styles.glyph}>
        <ThemedText style={styles.glyphText}>∅</ThemedText>
      </View>
      <ThemedText type="smallBold">{title}</ThemedText>
      {description ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
          {description}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  glyph: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(127,127,127,0.15)',
    marginBottom: Spacing.one,
  },
  glyphText: {
    fontSize: 20,
    fontWeight: '700',
  },
  description: {
    textAlign: 'center',
  },
});
