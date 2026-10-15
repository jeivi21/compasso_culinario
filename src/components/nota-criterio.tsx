import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatarNota } from '@/lib/restaurantes';

type NotaCriterioProps = {
  label: string;
  nota: number | null;
};

/** Linha "Comida ▇▇▇▇░ 4,2" usada no resumo de notas por critério. */
export function NotaCriterio({ label, nota }: NotaCriterioProps) {
  const theme = useTheme();
  const largura = nota ? `${(Number(nota) / 5) * 100}%` : '0%';

  return (
    <View style={styles.linha}>
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
      <View style={[styles.trilho, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.barra, { width: largura as `${number}%`, backgroundColor: theme.primary }]} />
      </View>
      <ThemedText type="bold" style={styles.valor}>
        {formatarNota(nota)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    width: 96,
  },
  trilho: {
    flex: 1,
    height: 10,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  barra: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  valor: {
    width: 36,
    textAlign: 'right',
  },
});
