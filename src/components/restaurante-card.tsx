import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
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
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundCard, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
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
    </Pressable>
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
