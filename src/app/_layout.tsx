import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  useFonts,
} from '@expo-google-fonts/fredoka';
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from '@expo-google-fonts/nunito-sans';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth-context';

SplashScreen.preventAutoHideAsync();

/** Erros não tratados em qualquer rota caem nesta tela em vez de fechar o app. */
export { TelaErro as ErrorBoundary } from '@/components/tela-erro';

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  if (!fontsLoaded && !fontsError) {
    return null;
  }

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const scheme = useColorScheme();
  const { session, perfil, isLoading } = useAuth();

  useEffect(() => {
    // Só esconde a splash quando fontes e sessão estão prontas, evitando piscar a tela de login.
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  const isDark = scheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: colors.primaryDark,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
  };

  const opcoesComCabecalho = {
    headerShown: true,
    headerTitleStyle: { fontFamily: Fonts.display, fontSize: 18 },
    headerTintColor: colors.primaryDark,
    headerBackTitle: 'Voltar',
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!session && !!perfil && !perfil.onboarding_concluido}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={!!session && (!perfil || perfil.onboarding_concluido)}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="restaurante/[id]/index" options={opcoesComCabecalho} />
          <Stack.Screen name="restaurante/[id]/avaliar" options={opcoesComCabecalho} />
          <Stack.Screen name="minhas-avaliacoes" options={opcoesComCabecalho} />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
