import { SymbolView } from 'expo-symbols';
import { Platform, StyleSheet, Text, type TextStyle, View } from 'react-native';

/**
 * Cross-platform icon. Renders an SF Symbol on iOS, Material Symbols-equivalent
 * on Android, and a Unicode glyph on web (where `expo-symbols` does not run).
 *
 * The `name` prop follows the same triple shape as the rest of the app. On web
 * we look up a Unicode fallback in `WEB_GLYPHS` so the UI still has a visible
 * icon — Material Symbols requires a font, which we deliberately avoid shipping.
 */

export type SymbolTriple = { ios: string; android: string; web: string };

const WEB_GLYPHS: Record<string, string> = {
  chevron_left: '‹',
  chevron_right: '›',
  chevron_right_solid: '›',
  chevron_left_solid: '‹',
  checkmark: '✓',
  check: '✓',
  plus: '+',
  add: '+',
  minus: '−',
  remove: '−',
  pencil: '✎',
  edit: '✎',
  paperplane_fill: '➤',
  send: '➤',
  arrow_right: '→',
  arrow_down: '↓',
  forward: '→',
  calendar: '📅',
  calendar_month: '📅',
  square_grid_2x2: '▦',
  dashboard: '▦',
  tray: '✉',
  inbox: '✉',
  event_available: '✓',
  person_crop_circle: '◯',
  account_circle: '◯',
};

function lookupGlyph(name: string): string {
  const exact = WEB_GLYPHS[name];
  if (exact) return exact;
  const base = name.split('.')[0];
  return WEB_GLYPHS[base] ?? '•';
}

export type PlatformIconWeight =
  | 'ultralight'
  | 'thin'
  | 'light'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy'
  | 'black';

export function PlatformIcon({
  name,
  size = 16,
  tintColor,
  weight,
  style,
}: {
  name: SymbolTriple;
  size?: number;
  tintColor?: string;
  weight?: PlatformIconWeight;
  style?: TextStyle;
}) {
  if (Platform.OS === 'web') {
    const glyph = lookupGlyph(name.web);
    return (
      <View
        style={[
          styles.webWrap,
          { height: size, width: size, justifyContent: 'center' },
        ]}
      >
        <Text
          style={{
            color: tintColor,
            fontSize: Math.round(size * 0.95),
            lineHeight: size,
            textAlign: 'center',
            fontWeight: weight === 'bold' || weight === 'heavy' ? '700' : '500',
            ...(style as object),
          }}
          allowFontScaling={false}
        >
          {glyph}
        </Text>
      </View>
    );
  }
  return (
    <SymbolView
      tintColor={tintColor}
      name={name as any}
      size={size}
      weight={weight as any}
      style={style as any}
    />
  );
}

const styles = StyleSheet.create({
  webWrap: {
    alignItems: 'center',
  },
});