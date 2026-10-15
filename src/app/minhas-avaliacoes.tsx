import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Estrelas } from '@/components/estrelas';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { buscarMinhasAvaliacoes, formatarData, type AvaliacaoComRestaurante } from '@/lib/restaurantes';

export default function MinhasAvaliacoesScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoComRestaurante[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

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
        .catch(() => ativo && setErro('Não foi possível carregar suas avaliações.'));
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
        <View style={styles.centro}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      ) : erro && !avaliacoes ? (
        <View style={styles.centro}>
          <ThemedText themeColor="textSecondary">{erro}</ThemedText>
          <Button title="Tentar de novo" variant="secondary" onPress={() => setTentativa((t) => t + 1)} />
          <Button title="Voltar" variant="ghost" onPress={() => router.back()} />
        </View>
      ) : (
        <FlatList
          data={avaliacoes}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          ListEmptyComponent={
            <View style={styles.centro}>
              <Ionicons name="star-outline" size={48} color={theme.textMuted} />
              <ThemedText themeColor="textSecondary" style={styles.centroTexto}>
                Você ainda não avaliou nenhum restaurante.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            // O botão Editar fica fora do Pressable do card para não aninhar botões.
            <View style={[styles.item, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/restaurante/${item.restaurante_id}`)}
                style={({ pressed }) => [styles.corpo, { opacity: pressed ? 0.7 : 1 }]}>
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
                <Estrelas valor={Number(item.nota_geral)} />
                {item.comentario ? <ThemedText numberOfLines={2}>{item.comentario}</ThemedText> : null}
              </Pressable>
              <View style={styles.acoes}>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => router.push(`/restaurante/${item.restaurante_id}/avaliar`)}>
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
    paddingTop: Spacing.one,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  centroTexto: {
    textAlign: 'center',
  },
});
