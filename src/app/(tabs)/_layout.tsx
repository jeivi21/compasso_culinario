import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { IconePulsante } from '@/components/icone-pulsante';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = keyof typeof Ionicons.glyphMap;
type TabIconProps = { color: ColorValue; focused: boolean };

function tabIcon(active: IconName, inactive: IconName) {
  function TabIcon({ color, focused }: TabIconProps) {
    return <IconePulsante ativo={focused} repouso={1.08} pico={1.22} name={focused ? active : inactive} size={24} color={color} />;
  }
  return TabIcon;
}

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Esconde a barra de abas enquanto o teclado está aberto (busca de amigos).
        tabBarHideOnKeyboard: true,
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
        name="amigos"
        options={{ title: 'Amigos', tabBarIcon: tabIcon('people', 'people-outline') }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{ title: 'Salvos', tabBarIcon: tabIcon('heart', 'heart-outline') }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tabs>
  );
}
