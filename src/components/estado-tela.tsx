import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EstadoTelaProps = {
  /** Mostra só o indicador de carregamento. */
  carregando?: boolean;
  icone?: ComponentProps<typeof Ionicons>['name'];
  titulo?: string;
  mensagem?: string;
  acao?: { titulo: string; onPress: () => void };
  /** Erro usa a cor de perigo no ícone e é anunciado como alerta. */
  erro?: boolean;
};

/** Bloco centralizado para carregamento, lista vazia e erro, igual em todas as telas. */
export function EstadoTela({ carregando, icone, titulo, mensagem, acao, erro }: EstadoTelaProps) {
  const theme = useTheme();

  if (carregando) {
    return (
      <View style={styles.centro} accessibilityLabel="Carregando" accessible>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.centro}>
      {icone ? <Ionicons name={icone} size={48} color={erro ? theme.danger : theme.textMuted} /> : null}
      {titulo ? (
        <ThemedText type="subtitle" style={styles.texto} accessibilityRole="header">
          {titulo}
        </ThemedText>
      ) : null}
      {mensagem ? (
        <ThemedText
          themeColor="textSecondary"
          style={styles.texto}
          accessibilityRole={erro ? 'alert' : undefined}
          accessibilityLiveRegion="polite">
          {mensagem}
        </ThemedText>
      ) : null}
      {acao ? <Button title={acao.titulo} variant="secondary" onPress={acao.onPress} /> : null}
    </View>
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
