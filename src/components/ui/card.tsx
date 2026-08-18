import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Shadow, Spacing } from '@/constants/theme';
import { ThemedView } from '../themed-view';

export type CardProps = ViewProps & {
  variant?: 'default' | 'selected' | 'inverse' | 'ghost';
  padded?: boolean;
};

export function Card({
  style,
  variant = 'default',
  padded = true,
  ...rest
}: CardProps) {
  const backgroundType =
    variant === 'inverse'
      ? 'surfaceInverse'
      : variant === 'selected'
        ? 'surfaceSelected'
        : variant === 'ghost'
          ? 'background'
          : 'surface';

  return (
    <ThemedView
      type={backgroundType}
      style={[styles.card, padded && styles.padded, style]}
      {...rest}
    />
  );
}

export function CardDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...(Shadow.card as object),
  },
  padded: {
    padding: Spacing.three,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(127,127,127,0.18)',
    marginHorizontal: -Spacing.three,
  },
});
