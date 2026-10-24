import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatarDistancia, useLocalizacao } from '@/lib/location';
import { buscarRestaurantesProximos, formatarFaixaPreco, formatarNota, type RestauranteProximo } from '@/lib/restaurantes';

type SeletorRestauranteProps = {
  selecionadoId: string | null;
  onSelecionar: (restaurante: RestauranteProximo) => void;
  /** Restaurante que não pode ser escolhido (o do adversário). */
  bloqueadoId?: string | null;
};

/** Lista pesquisável de restaurantes num raio de 15 km para escolher o do duelo. */
export function SeletorRestaurante({ selecionadoId, onSelecionar, bloqueadoId }: SeletorRestauranteProps) {
  const theme = useTheme();
  const { coords, estado } = useLocalizacao();
  const [termo, setTermo] = useState('');
  const [lista, setLista] = useState<RestauranteProximo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (estado === 'carregando') return;
    let ativo = true;
    buscarRestaurantesProximos(coords.latitude, coords.longitude, 15_000)
      .then((r) => ativo && setLista(r))
      .catch(() => ativo && setErro('Não foi possível carregar os restaurantes.'));
    return () => {
      ativo = false;
    };
  }, [coords.latitude, coords.longitude, estado]);

  const filtro = termo.trim().toLowerCase();
  const visiveis = (lista ?? []).filter(
    (r) => !filtro || r.nome.toLowerCase().includes(filtro) || (r.categoria ?? '').toLowerCase().includes(filtro),
  );

  return (
    <View style={styles.container}>
      <View style={[styles.busca, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.textMuted} />
        <TextInput
          value={termo}
          onChangeText={setTermo}
          placeholder="Buscar restaurante"
          placeholderTextColor={theme.textMuted}
          style={[styles.buscaInput, { color: theme.text }]}
        />
      </View>
      {lista === null && !erro ? (
        <ActivityIndicator color={theme.primary} style={styles.carregando} />
      ) : erro ? (
        <ThemedText themeColor="danger">{erro}</ThemedText>
      ) : (
        <FlatList
          data={visiveis}
          keyExtractor={(r) => r.id}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          ListEmptyComponent={<ThemedText themeColor="textSecondary">Nenhum restaurante encontrado.</ThemedText>}
          renderItem={({ item }) => {
            const selecionado = item.id === selecionadoId;
            const bloqueado = item.id === bloqueadoId;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: selecionado, disabled: bloqueado }}
                disabled={bloqueado}
                onPress={() => onSelecionar(item)}
                style={[
                  styles.item,
                  {
                    backgroundColor: selecionado ? theme.backgroundElement : theme.backgroundCard,
                    borderColor: selecionado ? theme.primary : theme.border,
                    opacity: bloqueado ? 0.45 : 1,
                  },
                ]}>
                <View style={styles.itemTexto}>
                  <ThemedText type="bold" numberOfLines={1}>
                    {item.nome}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {[item.categoria, formatarFaixaPreco(item.faixa_preco), formatarDistancia(item.distancia_m)]
                      .filter(Boolean)
                      .join(' · ')}
                    {bloqueado ? ' · escolhido pelo adversário' : ''}
                  </ThemedText>
                </View>
                <View style={styles.nota}>
                  <Ionicons name="star" size={14} color={theme.star} />
                  <ThemedText type="small">{formatarNota(item.media_geral)}</ThemedText>
                </View>
                <Ionicons
                  name={selecionado ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={selecionado ? theme.primaryDark : theme.textMuted}
                />
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.two,
  },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.small,
    borderWidth: 2,
  },
  buscaInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 16,
    paddingVertical: 10,
  },
  carregando: {
    marginTop: Spacing.four,
  },
  separador: {
    height: Spacing.two,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  itemTexto: {
    flex: 1,
    gap: 2,
  },
  nota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
