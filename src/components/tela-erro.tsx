import Ionicons from '@expo/vector-icons/Ionicons';
import type { ErrorBoundaryProps } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Tela mostrada quando uma rota lança um erro não tratado.
 * Exportada como `ErrorBoundary` no layout raiz, cobre todas as telas.
 */
export function TelaErro({ error, retry }: ErrorBoundaryProps) {
  const theme = useTheme();

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.centro}>
        <Ionicons name="warning-outline" size={64} color={theme.danger} />
        <ThemedText type="title" style={styles.texto}>
          Algo deu errado
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.texto}>
          Ocorreu um erro inesperado. Tente de novo; se continuar, feche e abra o app.
        </ThemedText>
        {__DEV__ ? (
          <ThemedText type="small" themeColor="textMuted" style={styles.texto}>
            {error.message}
          </ThemedText>
        ) : null}
        <Button title="Tentar de novo" onPress={retry} />
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
