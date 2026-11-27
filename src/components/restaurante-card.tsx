import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Tocavel } from '@/components/tocavel';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatarDistancia } from '@/lib/location';
import { formatarFaixaPreco, formatarNota, type RestauranteProximo } from '@/lib/restaurantes';

type RestauranteCardProps = {
  restaurante: RestauranteProximo;
  onPress?: () => void;
};

export function RestauranteCard({ restaurante, onPress }: RestauranteCardProps) {
  const theme = useTheme();
  const faixa = formatarFaixaPreco(restaurante.faixa_preco);

  return (
    <Tocavel
      escala={0.98}
      accessibilityRole="button"
      accessibilityLabel={[
        restaurante.nome,
        restaurante.categoria,
        faixa ? `preço ${faixa.length} de 4` : null,
        restaurante.total_avaliacoes > 0
          ? `nota ${formatarNota(restaurante.media_geral)}, ${restaurante.total_avaliacoes} ${restaurante.total_avaliacoes > 1 ? 'avaliações' : 'avaliação'}`
          : 'sem avaliações',
        `a ${formatarDistancia(restaurante.distancia_m)}`,
      ]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint="Abre os detalhes do restaurante"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundCard, borderColor: theme.border, opacity: pressed ? 0.92 : 1 },
      ]}>
      <View style={styles.header}>
        <ThemedText type="bold" style={styles.nome} numberOfLines={1}>
          {restaurante.nome}
        </ThemedText>
        <View style={[styles.nota, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="star" size={14} color={theme.star} />
          <ThemedText type="small">
            {formatarNota(restaurante.media_geral)}
            {restaurante.total_avaliacoes > 0 ? ` (${restaurante.total_avaliacoes})` : ''}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {[restaurante.categoria, faixa].filter(Boolean).join(' · ')}
      </ThemedText>
      <View style={styles.footer}>
        <Ionicons name="navigate-outline" size={14} color={theme.primaryDark} />
        <ThemedText type="small" themeColor="primaryDark">
          {formatarDistancia(restaurante.distancia_m)}
        </ThemedText>
        {restaurante.endereco ? (
          <ThemedText type="small" themeColor="textMuted" numberOfLines={1} style={styles.endereco}>
            · {restaurante.endereco}
          </ThemedText>
        ) : null}
      </View>
    </Tocavel>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nome: {
    flex: 1,
  },
  nota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  endereco: {
    flex: 1,
  },
});
