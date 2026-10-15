import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = keyof typeof Ionicons.glyphMap;
type TabIconProps = { color: ColorValue; focused: boolean };

function tabIcon(active: IconName, inactive: IconName) {
  function TabIcon({ color, focused }: TabIconProps) {
    return <Ionicons name={focused ? active : inactive} size={24} color={color} />;
  }
  return TabIcon;
}

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primaryDark,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.bodyBold,
          fontSize: 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Para você', tabBarIcon: tabIcon('compass', 'compass-outline') }}
      />
      <Tabs.Screen
        name="mapa"
        options={{ title: 'Mapa', tabBarIcon: tabIcon('map', 'map-outline') }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{ title: 'Favoritos', tabBarIcon: tabIcon('heart', 'heart-outline') }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tabs>
  );
}
