import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { RecomendacaoCard } from '@/components/recomendacao-card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { useLocalizacao } from '@/lib/location';
import { recomendar, type ResultadoRecomendacao } from '@/lib/recomendacao';

const MIN_AVALIACOES = 3;

export default function ParaVoceScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { coords, estado: estadoLocalizacao } = useLocalizacao();
  const [resultado, setResultado] = useState<ResultadoRecomendacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  const usuarioId = session?.user.id;

  // Recalcula ao voltar para a aba (novas avaliações mudam as recomendações).
  useFocusEffect(
    useCallback(() => {
      if (!usuarioId || estadoLocalizacao === 'carregando') return;
      let ativo = true;
      recomendar(usuarioId, coords.latitude, coords.longitude)
        .then((r) => {
          if (!ativo) return;
          setResultado(r);
          setErro(null);
        })
        .catch(() => ativo && setErro('Não foi possível gerar as recomendações. Verifique sua conexão.'))
        .finally(() => ativo && setAtualizando(false));
      return () => {
        ativo = false;
      };
      // `tentativa` força nova busca no "Tentar de novo" e no pull to refresh.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuarioId, coords.latitude, coords.longitude, estadoLocalizacao, tentativa]),
  );

  function atualizar() {
    setAtualizando(true);
    setTentativa((t) => t + 1);
  }

  const carregando = resultado === null && !erro;
  const faltam = resultado ? Math.max(0, MIN_AVALIACOES - resultado.totalAvaliacoesDoUsuario) : 0;

  const cabecalho = (
    <View style={styles.cabecalho}>
      <ThemedText type="title">Para você</ThemedText>
      {resultado?.modo === 'ubcf' ? (
        <ThemedText themeColor="textSecondary">
          Previsões feitas a partir de usuários com gosto parecido com o seu.
        </ThemedText>
      ) : resultado ? (
        <View style={[styles.aviso, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="sparkles-outline" size={20} color={theme.primaryDark} />
          <View style={styles.avisoTexto}>
            <ThemedText type="bold">Recomendações personalizadas em breve</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {faltam > 0
                ? `Avalie mais ${faltam} restaurante${faltam > 1 ? 's' : ''} para o app aprender seu gosto. Por enquanto, os mais bem avaliados perto de você.`
                : 'Ainda não encontramos usuários com gosto parecido. Por enquanto, os mais bem avaliados perto de você.'}
            </ThemedText>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen>
      {carregando ? (
        <>
          {cabecalho}
          <View style={styles.centro}>
            <ActivityIndicator color={theme.primary} size="large" />
            <ThemedText themeColor="textSecondary">Calculando recomendações…</ThemedText>
          </View>
        </>
      ) : erro && !resultado ? (
        <>
          {cabecalho}
          <View style={styles.centro}>
            <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
            <ThemedText themeColor="textSecondary" style={styles.centroTexto}>
              {erro}
            </ThemedText>
            <Button title="Tentar de novo" variant="secondary" onPress={atualizar} />
          </View>
        </>
      ) : (
        <FlatList
          data={resultado?.recomendacoes ?? []}
          keyExtractor={(r) => r.restaurante.id}
          ListHeaderComponent={cabecalho}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={atualizar} tintColor={theme.primary} />}
          renderItem={({ item, index }) => (
            <RecomendacaoCard
              recomendacao={item}
              posicao={index + 1}
              onPress={() => router.push(`/restaurante/${item.restaurante.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.centro}>
              <Ionicons name="compass-outline" size={48} color={theme.textMuted} />
              <ThemedText themeColor="textSecondary" style={styles.centroTexto}>
                Nenhum restaurante em 10 km da sua localização.
              </ThemedText>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  avisoTexto: {
    flex: 1,
    gap: Spacing.half,
  },
  lista: {
    flexGrow: 1,
    paddingBottom: Spacing.four,
  },
  separador: {
    height: Spacing.two,
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
