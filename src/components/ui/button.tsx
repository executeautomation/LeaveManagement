import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { PlatformIcon, type SymbolTriple } from '@/components/platform-icon';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leadingIcon?: SymbolTriple;
  trailingIcon?: SymbolTriple;
};

type Palette = { bg: string; fg: string };

function variantPalette(
  variant: NonNullable<ButtonProps['variant']>,
  theme: ReturnType<typeof useTheme>,
): Palette {
  switch (variant) {
    case 'primary':
      return { bg: theme.accent, fg: theme.accentFg };
    case 'success':
      return { bg: theme.success, fg: '#FFFFFF' };
    case 'danger':
      return { bg: theme.danger, fg: '#FFFFFF' };
    case 'secondary':
      return { bg: theme.surfaceMuted, fg: theme.text };
    case 'ghost':
    default:
      return { bg: 'transparent', fg: theme.accent };
  }
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  leadingIcon,
  trailingIcon,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const palette = variantPalette(variant, theme);
  const pad = PADDING[size];

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => [
        styles.outer,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
      ]}
    >
      <ThemedView
        style={[
          styles.base,
          pad,
          fullWidth && styles.fullWidth,
          { backgroundColor: disabled ? theme.surfaceMuted : palette.bg },
        ]}
      >
        {leadingIcon ? (
          <PlatformIcon
            tintColor={disabled ? theme.textMuted : palette.fg}
            name={leadingIcon}
            size={size === 'lg' ? 18 : size === 'sm' ? 14 : 16}
          />
        ) : null}
        <ThemedText
          style={[
            styles.label,
            size === 'lg' && styles.labelLg,
            size === 'sm' && styles.labelSm,
            { color: disabled ? theme.textMuted : palette.fg },
          ]}
        >
          {label}
        </ThemedText>
        {trailingIcon ? (
          <PlatformIcon
            tintColor={disabled ? theme.textMuted : palette.fg}
            name={trailingIcon}
            size={size === 'lg' ? 18 : size === 'sm' ? 14 : 16}
          />
        ) : null}
      </ThemedView>
    </Pressable>
  );
}

const PADDING = {
  sm: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  md: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two + 2 },
  lg: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
} as const;

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'flex-start',
    borderRadius: Radius.md,
    ...(Shadow.card as object),
  },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  labelSm: { fontSize: 13 },
  labelLg: { fontSize: 16 },
});
