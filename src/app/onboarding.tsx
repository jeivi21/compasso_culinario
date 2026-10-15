import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Estrelas } from '@/components/estrelas';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import {
  buscarRestaurantesPopulares,
  formatarFaixaPreco,
  salvarAvaliacoesRapidas,
  type RestaurantePopular,
} from '@/lib/restaurantes';

/** Quantas avaliações o usuário precisa dar para a recomendação ter base. */
const META = 5;

/**
 * Primeiro acesso: o usuário avalia lugares conhecidos para o app aprender seu gosto
 * (resolve o cold start do UBCF). Pode pular e avaliar depois.
 */
export default function OnboardingScreen() {
  const theme = useTheme();
  const { session, concluirOnboarding } = useAuth();
  const [restaurantes, setRestaurantes] = useState<RestaurantePopular[] | null>(null);
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    buscarRestaurantesPopulares()
      .then((r) => ativo && setRestaurantes(r))
      .catch(() => ativo && setErro('Não foi possível carregar os restaurantes.'));
    return () => {
      ativo = false;
    };
  }, []);

  const avaliados = Object.keys(notas).length;
  const progresso = Math.min(1, avaliados / META);

  async function finalizar(pular: boolean) {
    if (!session) return;
    setErro(null);
    setSalvando(true);
    try {
      if (!pular) {
        await salvarAvaliacoesRapidas(
          session.user.id,
          Object.entries(notas).map(([restauranteId, nota]) => ({ restauranteId, nota })),
        );
      }
      await concluirOnboarding();
      // O guard de rotas troca para as abas quando o perfil muda.
    } catch {
      setErro('Não foi possível salvar. Verifique sua conexão e tente de novo.');
      setSalvando(false);
    }
  }

  const cabecalho = (
    <View style={styles.cabecalho}>
      <ThemedText type="label" themeColor="primaryDark">
        Primeiro acesso
      </ThemedText>
      <ThemedText type="title">Avalie lugares que você conhece</ThemedText>
      <ThemedText themeColor="textSecondary">
        Dê uma nota geral para pelo menos {META} restaurantes. É assim que o app encontra pessoas com gosto
        parecido com o seu.
      </ThemedText>
      <View style={styles.progresso}>
        <View style={[styles.trilho, { backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.barra, { width: `${progresso * 100}%`, backgroundColor: theme.primary }]} />
        </View>
        <ThemedText type="bold">
          {Math.min(avaliados, META)} de {META}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      {restaurantes === null && !erro ? (
        <>
          {cabecalho}
          <View style={styles.centro}>
            <ActivityIndicator color={theme.primary} size="large" />
          </View>
        </>
      ) : (
        <FlatList
          data={restaurantes ?? []}
          keyExtractor={(r) => r.id}
          ListHeaderComponent={cabecalho}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          renderItem={({ item }) => (
            <View
              style={[
                styles.item,
                {
                  backgroundColor: theme.backgroundCard,
                  borderColor: notas[item.id] ? theme.primary : theme.border,
                },
              ]}>
              <View style={styles.itemTexto}>
                <ThemedText type="bold" numberOfLines={1}>
                  {item.nome}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {[item.categoria, formatarFaixaPreco(item.faixa_preco)].filter(Boolean).join(' · ')}
                </ThemedText>
              </View>
              <Estrelas
                valor={notas[item.id] ?? 0}
                tamanho={28}
                onChange={(v) => setNotas((n) => ({ ...n, [item.id]: v }))}
              />
            </View>
          )}
          ListEmptyComponent={
            erro ? (
              <View style={styles.centro}>
                <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
                <ThemedText themeColor="textSecondary">{erro}</ThemedText>
              </View>
            ) : null
          }
          ListFooterComponent={
            <View style={styles.rodape}>
              {erro && restaurantes ? <ThemedText themeColor="danger">{erro}</ThemedText> : null}
              <Button
                title={avaliados >= META ? 'Começar' : `Avalie mais ${META - avaliados}`}
                onPress={() => finalizar(false)}
                disabled={avaliados < META}
                loading={salvando}
              />
              <Button title="Pular por enquanto" variant="ghost" onPress={() => finalizar(true)} disabled={salvando} />
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
    paddingVertical: Spacing.four,
  },
  progresso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  trilho: {
    flex: 1,
    height: 10,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  barra: {
    height: '100%',
    borderRadius: Radius.pill,
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
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  itemTexto: {
    flex: 1,
    gap: Spacing.half,
  },
  rodape: {
    gap: Spacing.two,
    paddingTop: Spacing.four,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
});
