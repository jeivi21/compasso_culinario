import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Linha de indicadores no topo de um jogo (rodada, tempo, pontos). */
export function PainelJogo({ itens }: { itens: { label: string; valor: string }[] }) {
  const theme = useTheme();
  return (
    <View style={[styles.painel, { backgroundColor: theme.backgroundElement }]}>
      {itens.map((i) => (
        <View key={i.label} style={styles.painelItem}>
          <ThemedText type="label" themeColor="textSecondary">
            {i.label}
          </ThemedText>
          <ThemedText type="subtitle">{i.valor}</ThemedText>
        </View>
      ))}
    </View>
  );
}

/** Mensagem curta de instrução acima da área de jogo. */
export function Instrucao({ children }: { children: string }) {
  return (
    <ThemedText themeColor="textSecondary" style={styles.instrucao}>
      {children}
    </ThemedText>
  );
}

export const estilosJogo = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.three,
  },
  area: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
});

const styles = StyleSheet.create({
  painel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
  },
  painelItem: {
    alignItems: 'center',
  },
  instrucao: {
    textAlign: 'center',
  },
});
