import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { EstadoTela } from '@/components/estado-tela';
import { Chip } from '@/components/chip';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { PressedOpacity, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { listarFavoritos, removerFavorito, type Favorito, type TipoFavorito } from '@/lib/favoritos';
import { confirmar } from '@/lib/confirmar';
import { formatarFaixaPreco } from '@/lib/restaurantes';

const ABAS: { tipo: TipoFavorito; label: string; vazio: string }[] = [
  { tipo: 'favorito', label: 'Favoritos', vazio: 'Marque um restaurante como favorito na tela de detalhes.' },
  { tipo: 'quero_ir', label: 'Quero ir', vazio: 'Salve aqui os lugares que você quer conhecer.' },
];

export default function FavoritosScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [tipo, setTipo] = useState<TipoFavorito>('favorito');
  const [itens, setItens] = useState<Favorito[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [atualizando, setAtualizando] = useState(false);

  const usuarioId = session?.user.id;

  // Recarrega ao voltar para a aba e ao trocar entre Favoritos e Quero ir.
  useFocusEffect(
    useCallback(() => {
      if (!usuarioId) return;
      let ativo = true;
      listarFavoritos(usuarioId, tipo)
        .then((f) => {
          if (!ativo) return;
          setItens(f);
          setErro(null);
        })
        .catch(() => ativo && setErro('Não foi possível carregar.'))
        .finally(() => ativo && setAtualizando(false));
      return () => {
        ativo = false;
      };
      // `tentativa` força nova busca no "Tentar de novo".
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuarioId, tipo, tentativa]),
  );

  async function remover(item: Favorito) {
    // Remove da lista na hora e desfaz se a exclusão falhar.
    setItens((lista) => lista?.filter((f) => f.id !== item.id) ?? null);
    try {
      await removerFavorito(item.id);
    } catch {
      setItens((lista) => (lista ? [item, ...lista] : lista));
      setErro('Não foi possível remover. Tente de novo.');
    }
  }

  const aba = ABAS.find((a) => a.tipo === tipo)!;

  return (
    <Screen>
      <View style={styles.cabecalho}>
        <ThemedText type="title">Salvos</ThemedText>
        <View style={styles.chips}>
          {ABAS.map((a) => (
            <Chip
              key={a.tipo}
              label={a.label}
              role="tab"
              selected={tipo === a.tipo}
              onPress={() => {
                if (a.tipo !== tipo) {
                  setItens(null);
                  setTipo(a.tipo);
                }
              }}
            />
          ))}
        </View>
      </View>

      {itens === null && !erro ? (
        <EstadoTela carregando />
      ) : erro && !itens ? (
        <EstadoTela
          erro
          icone="cloud-offline-outline"
          mensagem={erro}
          acao={{ titulo: 'Tentar de novo', onPress: () => setTentativa((t) => t + 1) }}
        />
      ) : (
        <Animated.FlatList
          itemLayoutAnimation={LinearTransition.springify().damping(18)}
          data={itens ?? []}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              tintColor={theme.primary}
              colors={[theme.primaryDark]}
              onRefresh={() => {
                setAtualizando(true);
                setTentativa((t) => t + 1);
              }}
            />
          }
          keyExtractor={(f) => f.id}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          ListHeaderComponent={
            erro ? (
              <ThemedText themeColor="danger" accessibilityRole="alert">
                {erro}
              </ThemedText>
            ) : null
          }
          ListEmptyComponent={
            <EstadoTela icone={tipo === 'favorito' ? 'heart-outline' : 'bookmark-outline'} mensagem={aba.vazio} />
          }
          renderItem={({ item }) => (
            <Animated.View
              exiting={FadeOutLeft.duration(220)}
              style={[styles.item, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Abre os detalhes do restaurante"
                onPress={() => router.push(`/restaurante/${item.restaurante_id}`)}
                style={({ pressed }) => [styles.corpo, { opacity: pressed ? PressedOpacity : 1 }]}>
                <ThemedText type="bold" numberOfLines={1}>
                  {item.restaurante?.nome ?? 'Restaurante'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {[item.restaurante?.categoria?.nome, formatarFaixaPreco(item.restaurante?.faixa_preco ?? null)]
                    .filter(Boolean)
                    .join(' · ')}
                </ThemedText>
                {item.restaurante?.endereco ? (
                  <ThemedText type="small" themeColor="textMuted" numberOfLines={1}>
                    {item.restaurante.endereco}
                  </ThemedText>
                ) : null}
              </Pressable>
              <IconButton
                icon="close-circle"
                size={24}
                color={theme.textMuted}
                accessibilityLabel={`Remover ${item.restaurante?.nome ?? ''} de ${aba.label}`}
                onPress={() =>
                  confirmar(
                    'Remover dos salvos',
                    `${item.restaurante?.nome ?? 'Este restaurante'} sai de ${aba.label}.`,
                    'Remover',
                    () => remover(item),
                  )
                }
              />
            </Animated.View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    gap: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  lista: {
    flexGrow: 1,
    paddingBottom: Spacing.four,
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
  corpo: {
    flex: 1,
    gap: Spacing.half,
  },
});
