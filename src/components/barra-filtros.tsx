import { ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Categoria, Filtros } from '@/lib/restaurantes';

type BarraFiltrosProps = {
  categorias: Categoria[];
  filtros: Filtros;
  onChange: (filtros: Filtros) => void;
};

const FAIXAS = [1, 2, 3, 4];

/** Linhas de chips para filtrar por categoria e por faixa de preço. */
export function BarraFiltros({ categorias, filtros, onChange }: BarraFiltrosProps) {
  function alternarFaixa(faixa: number) {
    const atual = filtros.faixasPreco;
    onChange({
      ...filtros,
      faixasPreco: atual.includes(faixa) ? atual.filter((f) => f !== faixa) : [...atual, faixa],
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.linha}>
        <Chip label="Todas" selected={filtros.categoriaId === null} onPress={() => onChange({ ...filtros, categoriaId: null })} />
        {categorias.map((c) => (
          <Chip
            key={c.id}
            label={c.nome}
            selected={filtros.categoriaId === c.id}
            onPress={() => onChange({ ...filtros, categoriaId: filtros.categoriaId === c.id ? null : c.id })}
          />
        ))}
      </ScrollView>
      <View style={styles.linha}>
        <ThemedText type="small" themeColor="textSecondary">
          Preço
        </ThemedText>
        {FAIXAS.map((f) => (
          <Chip key={f} label={'$'.repeat(f)} selected={filtros.faixasPreco.includes(f)} onPress={() => alternarFaixa(f)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
