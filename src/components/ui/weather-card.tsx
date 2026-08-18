// filepath: src/components/ui/weather-card.tsx
//
// Small weather card for the dashboard. Renders a location, temperature, and
// a single animated emoji whose motion depends on the current condition
// (sun rotates, rain drops fall, clouds drift, snow drifts, etc).
//
// Animation is done via react-native-reanimated which is already a project
// dependency for the splash screen. We use `useSharedValue` + `withRepeat`
// so the worklet runs entirely on the UI thread — no JS bridge per frame.

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
    fetchCurrentWeather,
    type CurrentWeather,
    type WeatherCondition,
} from '@/lib/weather';

const CONDITION_GLYPH: Record<WeatherCondition, string> = {
  clear: '☀️',
  'partly-cloudy': '⛅',
  cloudy: '☁️',
  fog: '🌫️',
  rain: '🌧️',
  drizzle: '🌦️',
  snow: '❄️',
  thunderstorm: '⛈️',
  unknown: '🌤️',
};

const CONDITION_ACCENT: Record<WeatherCondition, WeatherAccentKey> = {
  clear: 'warning',
  'partly-cloudy': 'info',
  cloudy: 'info',
  fog: 'info',
  rain: 'info',
  drizzle: 'info',
  snow: 'info',
  thunderstorm: 'danger',
  unknown: 'info',
};

type WeatherAccentKey = 'warning' | 'info' | 'danger';

type Status = 'loading' | 'ready' | 'error';

export interface WeatherCardProps {
  city: string;
}

/**
 * Small weather card for the dashboard. Self-fetches on mount + whenever
 * the city changes; the user can edit the city in Profile.
 */
export function WeatherCard({ city }: WeatherCardProps) {
  const theme = useTheme();
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<CurrentWeather | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchCurrentWeather(city)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setData(result);
          setStatus('ready');
        } else {
          setStatus('error');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  const accentKey = data ? CONDITION_ACCENT[data.condition] : 'info';
  const accentBg =
    accentKey === 'warning'
      ? theme.warningSoft
      : accentKey === 'danger'
        ? theme.dangerSoft
        : theme.infoSoft;
  const accentFg =
    accentKey === 'warning'
      ? theme.warningFg
      : accentKey === 'danger'
        ? theme.dangerFg
        : theme.infoFg;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.left}>
        <WeatherGlyph
          condition={data?.condition ?? 'unknown'}
          loading={status === 'loading'}
        />
      </View>
      <View style={styles.body}>
        <ThemedText type="tiny" themeColor="textSecondary" style={styles.eyebrow}>
          {data?.location ?? city}
        </ThemedText>
        {status === 'ready' && data ? (
          <View style={styles.row}>
            <ThemedText style={styles.temp}>{data.temperature}°</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">{data.label}</ThemedText>
              <ThemedText type="tiny" themeColor="textSecondary">
                Wind {data.windSpeed} km/h
              </ThemedText>
            </View>
          </View>
        ) : status === 'error' ? (
          <View style={styles.row}>
            <ThemedText style={styles.tempError}>—</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">Weather unavailable</ThemedText>
              <ThemedText type="tiny" themeColor="textSecondary">
                Check your city in Profile
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.row}>
            <ThemedText style={styles.tempMuted}>…</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Loading weather
              </ThemedText>
              <ThemedText type="tiny" themeColor="textMuted">
                Fetching from open-meteo
              </ThemedText>
            </View>
          </View>
        )}
      </View>
      <View style={[styles.tag, { backgroundColor: accentBg }]}>
        <ThemedText style={[styles.tagText, { color: accentFg }]}>
          {data?.label ?? 'Weather'}
        </ThemedText>
      </View>
    </View>
  );
}

function WeatherGlyph({
  condition,
  loading,
}: {
  condition: WeatherCondition;
  loading: boolean;
}) {
  const theme = useTheme();
  const glyph = CONDITION_GLYPH[condition];

  // Sun: gentle rotate. Cloud: gentle x drift. Rain: drop with reused falling
  // tweens. Snow: slower fall + sway. Thunderstorm: small shake.
  const sun = useSharedValue(0);
  const cloud = useSharedValue(0);
  const drop = useSharedValue(0);
  const snow = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    // Reset all values whenever the condition changes.
    sun.value = 0;
    cloud.value = 0;
    drop.value = 0;
    snow.value = 0;
    shake.value = 0;

    cancelAnimation(sun);
    cancelAnimation(cloud);
    cancelAnimation(drop);
    cancelAnimation(snow);
    cancelAnimation(shake);

    if (loading) {
      // A subtle pulse while loading.
      drop.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
      return;
    }

    switch (condition) {
      case 'clear':
      case 'partly-cloudy':
        sun.value = withRepeat(
          withTiming(1, { duration: 12_000, easing: Easing.linear }),
          -1,
          false,
        );
        break;
      case 'cloudy':
      case 'fog':
        cloud.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 2_400, easing: Easing.inOut(Easing.quad) }),
            withTiming(-1, { duration: 2_400, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 2_400, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          false,
        );
        break;
      case 'rain':
      case 'drizzle':
        drop.value = withRepeat(
          withTiming(1, { duration: 900, easing: Easing.in(Easing.quad) }),
          -1,
          false,
        );
        break;
      case 'snow':
        snow.value = withRepeat(
          withTiming(1, { duration: 2_500, easing: Easing.inOut(Easing.quad) }),
          -1,
          false,
        );
        break;
      case 'thunderstorm':
        shake.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 80 }),
            withTiming(-1, { duration: 80 }),
            withTiming(0.6, { duration: 80 }),
            withTiming(-0.6, { duration: 80 }),
            withTiming(0, { duration: 1200 }),
          ),
          -1,
          false,
        );
        break;
      case 'unknown':
      default:
        // no animation
        break;
    }
  }, [condition, loading, sun, cloud, drop, snow, shake]);

  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sun.value * 360}deg` }],
  }));
  const cloudStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cloud.value * 4 }],
  }));
  const dropStyle = useAnimatedStyle(() => {
    // Move the glyph from 0 to +12 then snap back via repeat
    const translateY = drop.value * 12;
    const opacity = 1 - drop.value * 0.3;
    return { transform: [{ translateY }], opacity };
  });
  const snowStyle = useAnimatedStyle(() => {
    const translateY = snow.value * 14;
    const translateX = Math.sin(snow.value * Math.PI * 2) * 3;
    const opacity = 0.4 + (1 - snow.value) * 0.6;
    return { transform: [{ translateY }, { translateX }], opacity };
  });
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value * 4 }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + drop.value * 0.4,
  }));

  const pickStyle = (condition: WeatherCondition) => {
    if (loading) return pulseStyle;
    switch (condition) {
      case 'clear':
      case 'partly-cloudy':
        return sunStyle;
      case 'cloudy':
      case 'fog':
        return cloudStyle;
      case 'rain':
      case 'drizzle':
        return dropStyle;
      case 'snow':
        return snowStyle;
      case 'thunderstorm':
        return shakeStyle;
      default:
        return undefined;
    }
  };

  const animatedStyle = pickStyle(condition);

  return (
    <View
      style={[
        styles.glyphWrap,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
      ]}
    >
      <Animated.Text
        style={[styles.glyph, { color: theme.text }, animatedStyle]}
        allowFontScaling={false}
      >
        {glyph}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  left: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  temp: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tempMuted: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -1,
    opacity: 0.4,
  },
  tempError: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -1,
    opacity: 0.3,
  },
  tag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    maxWidth: 110,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  glyphWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  glyph: {
    fontSize: 32,
    lineHeight: 36,
    textAlign: 'center',
  },
});
