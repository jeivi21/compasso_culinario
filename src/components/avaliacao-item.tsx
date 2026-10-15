import { StyleSheet, View } from 'react-native';

import { Estrelas } from '@/components/estrelas';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatarData, type Avaliacao } from '@/lib/restaurantes';

type AvaliacaoItemProps = {
  avaliacao: Avaliacao;
  /** Destaca a avaliação do próprio usuário. */
  minha?: boolean;
};

export function AvaliacaoItem({ avaliacao, minha }: AvaliacaoItemProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.item,
        { backgroundColor: theme.backgroundCard, borderColor: minha ? theme.primary : theme.border },
      ]}>
      <View style={styles.cabecalho}>
        <ThemedText type="bold" style={styles.nome} numberOfLines={1}>
          {minha ? 'Você' : (avaliacao.usuario?.nome ?? 'Usuário')}
        </ThemedText>
        <ThemedText type="small" themeColor="textMuted">
          {formatarData(avaliacao.criado_em)}
        </ThemedText>
      </View>
      <View style={styles.notas}>
        <Estrelas valor={Number(avaliacao.nota_geral)} />
        <ThemedText type="small" themeColor="textSecondary">
          Comida {avaliacao.comida} · Atend. {avaliacao.atendimento} · Preço {avaliacao.preco} · Amb.{' '}
          {avaliacao.ambiente}
        </ThemedText>
      </View>
      {avaliacao.comentario ? <ThemedText>{avaliacao.comentario}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nome: {
    flex: 1,
  },
  notas: {
    gap: Spacing.one,
  },
});
