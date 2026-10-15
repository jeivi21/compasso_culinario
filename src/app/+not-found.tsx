import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Tela para rotas inexistentes (ex.: link antigo de um restaurante removido). */
export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.centro}>
        <Ionicons name="compass-outline" size={64} color={theme.textMuted} />
        <ThemedText type="title" style={styles.texto}>
          Página não encontrada
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.texto}>
          A bússola se perdeu. Vamos voltar para o início.
        </ThemedText>
        <Button title="Ir para o início" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  texto: {
    textAlign: 'center',
  },
});
