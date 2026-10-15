import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatarDistancia } from '@/lib/location';
import type { Recomendacao } from '@/lib/recomendacao';
import { formatarFaixaPreco, formatarNota } from '@/lib/restaurantes';

type RecomendacaoCardProps = {
  recomendacao: Recomendacao;
  posicao: number;
  onPress?: () => void;
};

/** Texto curto que explica por que o restaurante foi recomendado. */
function explicar(recomendacao: Recomendacao): string {
  const { explicacao } = recomendacao;
  if (explicacao.tipo === 'popular') return 'Bem avaliado e perto de você';
  const nomes = explicacao.vizinhos.map((v) => `${v.nome.split(' ')[0]} (${Math.round(v.similaridade * 100)}%)`);
  return `Usuários com gosto parecido: ${nomes.join(', ')}`;
}

export function RecomendacaoCard({ recomendacao, posicao, onPress }: RecomendacaoCardProps) {
  const theme = useTheme();
  const { restaurante, notaPrevista, explicacao } = recomendacao;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundCard, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={[styles.posicao, { backgroundColor: posicao === 1 ? theme.primary : theme.backgroundElement }]}>
        <ThemedText type="bold" style={{ color: posicao === 1 ? theme.onPrimary : theme.textSecondary }}>
          {posicao}
        </ThemedText>
      </View>
      <View style={styles.corpo}>
        <ThemedText type="bold" numberOfLines={1}>
          {restaurante.nome}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {[restaurante.categoria, formatarFaixaPreco(restaurante.faixa_preco), formatarDistancia(restaurante.distancia_m)]
            .filter(Boolean)
            .join(' · ')}
        </ThemedText>
        <View style={styles.explicacao}>
          <Ionicons
            name={explicacao.tipo === 'ubcf' ? 'people-outline' : 'trending-up-outline'}
            size={14}
            color={theme.primaryDark}
          />
          <ThemedText type="small" themeColor="primaryDark" style={styles.explicacaoTexto} numberOfLines={2}>
            {explicar(recomendacao)}
          </ThemedText>
        </View>
      </View>
      <View style={styles.nota}>
        <ThemedText type="subtitle">{formatarNota(notaPrevista)}</ThemedText>
        <ThemedText type="small" themeColor="textMuted">
          {explicacao.tipo === 'ubcf' ? 'prevista' : 'média'}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  posicao: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corpo: {
    flex: 1,
    gap: Spacing.half,
  },
  explicacao: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.one,
    paddingTop: Spacing.half,
  },
  explicacaoTexto: {
    flex: 1,
  },
  nota: {
    alignItems: 'center',
    minWidth: 52,
  },
});
