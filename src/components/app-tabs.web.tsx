import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const TAB_GLYPH: Record<string, string> = {
  index: '◧',
  leave: '✓',
  calendar: '▦',
  inbox: '✉',
  profile: '◯',
};

export default function AppTabs() {
  const theme = useTheme();
  const baseStyle = {
    backgroundColor: theme.surface,
    borderTopColor: theme.border,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [styles.bar, baseStyle],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }: { color: ColorValue }) => (
            <Glyph color={color} char={TAB_GLYPH.index} />
          ),
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: 'Leave',
          tabBarIcon: ({ color }: { color: ColorValue }) => (
            <Glyph color={color} char={TAB_GLYPH.leave} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }: { color: ColorValue }) => (
            <Glyph color={color} char={TAB_GLYPH.calendar} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }: { color: ColorValue }) => (
            <Glyph color={color} char={TAB_GLYPH.inbox} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: ColorValue }) => (
            <Glyph color={color} char={TAB_GLYPH.profile} />
          ),
        }}
      />
    </Tabs>
  );
}

function Glyph({ color, char }: { color: ColorValue; char: string }) {
  return (
    <View>
      <Text style={[styles.glyph, { color: color as any }]}>{char}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 64,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  glyph: {
    fontSize: 22,
    lineHeight: 24,
  },
});
