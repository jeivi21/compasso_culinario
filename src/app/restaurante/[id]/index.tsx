import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AvaliacaoItem } from '@/components/avaliacao-item';
import { BotoesMarcacao } from '@/components/botoes-marcacao';
import { Button } from '@/components/button';
import { NotaCriterio } from '@/components/nota-criterio';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import {
  buscarDetalhesRestaurante,
  formatarFaixaPreco,
  formatarNota,
  type DetalhesRestaurante,
} from '@/lib/restaurantes';

export default function RestauranteScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detalhes, setDetalhes] = useState<DetalhesRestaurante | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroMarcacao, setErroMarcacao] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  // Recarrega sempre que a tela volta ao foco (ex.: depois de criar ou editar uma avaliação).
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      buscarDetalhesRestaurante(id)
        .then((d) => {
          if (!ativo) return;
          setDetalhes(d);
          setErro(null);
        })
        .catch(() => ativo && setErro('Não foi possível carregar o restaurante.'));
      return () => {
        ativo = false;
      };
      // `tentativa` só serve para forçar nova busca no botão "Tentar de novo".
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, tentativa]),
  );

  const minhaAvaliacao = detalhes?.avaliacoes.find((a) => a.usuario_id === session?.user.id);
  const outrasAvaliacoes = detalhes?.avaliacoes.filter((a) => a.usuario_id !== session?.user.id) ?? [];

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: detalhes?.restaurante.nome ?? '',
          headerBackTitle: 'Voltar',
        }}
      />
      {!detalhes && !erro ? (
        <View style={styles.centro}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      ) : erro && !detalhes ? (
        <View style={styles.centro}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
          <ThemedText themeColor="textSecondary">{erro}</ThemedText>
          <Button
            title="Tentar de novo"
            variant="secondary"
            onPress={() => {
              setErro(null);
              setTentativa((t) => t + 1);
            }}
          />
        </View>
      ) : detalhes ? (
        <ScrollView contentContainerStyle={styles.conteudo}>
          <View style={styles.cabecalho}>
            <ThemedText type="title">{detalhes.restaurante.nome}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {[detalhes.restaurante.categoria?.nome, formatarFaixaPreco(detalhes.restaurante.faixa_preco)]
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
            {detalhes.restaurante.endereco ? (
              <View style={styles.linhaIcone}>
                <Ionicons name="location-outline" size={16} color={theme.textMuted} />
                <ThemedText type="small" themeColor="textMuted" style={styles.flex}>
                  {detalhes.restaurante.endereco}
                </ThemedText>
              </View>
            ) : null}
          </View>

          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.resumo}>
              <ThemedText type="title" style={styles.notaGrande}>
                {formatarNota(detalhes.resumo.media_geral)}
              </ThemedText>
              <View>
                <ThemedText type="bold">Nota geral</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {detalhes.resumo.total_avaliacoes === 0
                    ? 'Ainda sem avaliações'
                    : `${detalhes.resumo.total_avaliacoes} ${detalhes.resumo.total_avaliacoes > 1 ? 'avaliações' : 'avaliação'}`}
                </ThemedText>
              </View>
            </View>
            <NotaCriterio label="Comida" nota={detalhes.resumo.media_comida} />
            <NotaCriterio label="Atendimento" nota={detalhes.resumo.media_atendimento} />
            <NotaCriterio label="Preço" nota={detalhes.resumo.media_preco} />
            <NotaCriterio label="Ambiente" nota={detalhes.resumo.media_ambiente} />
          </View>

          <View style={styles.acoes}>
            <Button
              title={minhaAvaliacao ? 'Editar minha avaliação' : 'Avaliar este restaurante'}
              onPress={() => router.push(`/restaurante/${id}/avaliar`)}
            />
            {session ? (
              <BotoesMarcacao usuarioId={session.user.id} restauranteId={id} onErro={setErroMarcacao} />
            ) : null}
            {erroMarcacao ? (
              <ThemedText type="small" themeColor="danger" style={styles.erroMarcacao}>
                {erroMarcacao}
              </ThemedText>
            ) : null}
          </View>

          {minhaAvaliacao ? (
            <View style={styles.secao}>
              <ThemedText type="subtitle">Sua avaliação</ThemedText>
              <AvaliacaoItem avaliacao={minhaAvaliacao} minha />
            </View>
          ) : null}

          <View style={styles.secao}>
            <ThemedText type="subtitle">
              {outrasAvaliacoes.length === 0 ? 'Avaliações' : `Avaliações (${outrasAvaliacoes.length})`}
            </ThemedText>
            {outrasAvaliacoes.length === 0 ? (
              <ThemedText themeColor="textSecondary">Seja o primeiro a avaliar.</ThemedText>
            ) : (
              outrasAvaliacoes.map((a) => <AvaliacaoItem key={a.id} avaliacao={a} />)
            )}
          </View>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  conteudo: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  cabecalho: {
    gap: Spacing.one,
  },
  linhaIcone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  flex: {
    flex: 1,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  resumo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  notaGrande: {
    fontSize: 44,
    lineHeight: 50,
  },
  acoes: {
    gap: Spacing.two,
  },
  erroMarcacao: {
    textAlign: 'center',
  },
  secao: {
    gap: Spacing.two,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
});
