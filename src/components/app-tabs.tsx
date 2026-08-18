import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { PlatformIcon, type SymbolTriple } from '@/components/platform-icon';
import { useTheme } from '@/hooks/use-theme';
import { useLeaveData } from '@/lib/use-leave-data';

const TAB_ICONS: Record<string, SymbolTriple> = {
  index: { ios: 'square.grid.2x2', android: 'dashboard', web: 'dashboard' },
  leave: {
    ios: 'calendar.badge.checkmark',
    android: 'event_available',
    web: 'event_available',
  },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  inbox: { ios: 'tray', android: 'inbox', web: 'inbox' },
  profile: {
    ios: 'person.crop.circle',
    android: 'account_circle',
    web: 'account_circle',
  },
};

export default function AppTabs() {
  const theme = useTheme();
  const { requests } = useLeaveData();
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 84,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarItemStyle: styles.item,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={TAB_ICONS.index}
              color={color}
              filled={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: 'Leave',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={TAB_ICONS.leave}
              color={color}
              filled={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={TAB_ICONS.calendar}
              color={color}
              filled={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.accent,
            color: theme.accentFg,
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={TAB_ICONS.inbox}
              color={color}
              filled={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={TAB_ICONS.profile}
              color={color}
              filled={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  name,
  color,
  filled,
}: {
  name: SymbolTriple;
  color: ColorValue;
  filled: boolean;
}) {
  return (
    <View>
      <PlatformIcon
        tintColor={color as string | undefined}
        name={filled ? swapFilled(name) : name}
        size={24}
        weight={filled ? 'medium' : 'regular'}
      />
    </View>
  );
}

function swapFilled(name: SymbolTriple): SymbolTriple {
  // iOS has a `.fill` sibling for many symbols; on android/web we keep the
  // outline variant (we'll let color carry the focus).
  if (!name.ios.includes('.fill')) {
    return { ...name, ios: `${name.ios}.fill` };
  }
  return name;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  item: {
    paddingTop: 4,
  },
});
