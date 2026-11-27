import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { EstadoTela } from '@/components/estado-tela';
import { Estrelas } from '@/components/estrelas';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { PressedOpacity, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { formatarNota } from '@/lib/formatacao';
import { buscarMinhasAvaliacoes, formatarData, type AvaliacaoComRestaurante } from '@/lib/restaurantes';

export default function MinhasAvaliacoesScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoComRestaurante[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [atualizando, setAtualizando] = useState(false);

  // Recarrega ao voltar da tela de edição/exclusão.
  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let ativo = true;
      buscarMinhasAvaliacoes(session.user.id)
        .then((a) => {
          if (!ativo) return;
          setAvaliacoes(a);
          setErro(null);
        })
        .catch(() => ativo && setErro('Não foi possível carregar suas avaliações.'))
        .finally(() => ativo && setAtualizando(false));
      return () => {
        ativo = false;
      };
      // `tentativa` força nova busca no "Tentar de novo".
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, tentativa]),
  );

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Minhas avaliações' }} />
      {avaliacoes === null && !erro ? (
        <EstadoTela carregando />
      ) : erro && !avaliacoes ? (
        <EstadoTela
          erro
          icone="cloud-offline-outline"
          mensagem={erro}
          acao={{ titulo: 'Tentar de novo', onPress: () => setTentativa((t) => t + 1) }}
        />
      ) : (
        <FlatList
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
          data={avaliacoes}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          ListEmptyComponent={
            <EstadoTela icone="star-outline" mensagem="Você ainda não avaliou nenhum restaurante." />
          }
          renderItem={({ item }) => (
            // O botão Editar fica fora do Pressable do card para não aninhar botões.
            <View style={[styles.item, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Abre os detalhes do restaurante"
                onPress={() => router.push(`/restaurante/${item.restaurante_id}`)}
                style={({ pressed }) => [styles.corpo, { opacity: pressed ? PressedOpacity : 1 }]}>
                <View style={styles.cabecalho}>
                  <ThemedText type="bold" style={styles.nome} numberOfLines={1}>
                    {item.restaurante?.nome ?? 'Restaurante'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textMuted">
                    {formatarData(item.criado_em)}
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.restaurante?.categoria?.nome ?? ''}
                </ThemedText>
                <View style={styles.nota}>
                  <Estrelas valor={Number(item.nota_geral)} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatarNota(Number(item.nota_geral))}
                  </ThemedText>
                </View>
                {item.comentario ? <ThemedText numberOfLines={2}>{item.comentario}</ThemedText> : null}
              </Pressable>
              <View style={styles.acoes}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Editar avaliação de ${item.restaurante?.nome ?? 'restaurante'}`}
                  onPress={() => router.push(`/restaurante/${item.restaurante_id}/avaliar`)}
                  style={({ pressed }) => [styles.editar, { opacity: pressed ? PressedOpacity : 1 }]}>
                  <Ionicons name="pencil-outline" size={16} color={theme.primaryDark} />
                  <ThemedText type="link">Editar</ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  nota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  lista: {
    flexGrow: 1,
    paddingVertical: Spacing.three,
  },
  separador: {
    height: Spacing.two,
  },
  item: {
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  corpo: {
    gap: Spacing.one,
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
  acoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginRight: -Spacing.two,
    marginBottom: -Spacing.two,
  },
  editar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
  },
});
