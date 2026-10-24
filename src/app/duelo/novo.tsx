import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { SeletorRestaurante } from '@/components/seletor-restaurante';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listarVinculos, type Vinculo } from '@/lib/amigos';
import { useAuth } from '@/lib/auth-context';
import { criarDuelo, traduzirErroDuelo } from '@/lib/duelos';
import type { RestauranteProximo } from '@/lib/restaurantes';

/** Novo duelo: escolher o amigo (se não veio na rota) e o restaurante que você defende. */
export default function NovoDueloScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { amigoId } = useLocalSearchParams<{ amigoId?: string }>();
  const meuId = session?.user.id;

  const [amigos, setAmigos] = useState<Vinculo[] | null>(null);
  const [amigoSelecionado, setAmigoSelecionado] = useState<string | null>(amigoId ?? null);
  const [restaurante, setRestaurante] = useState<RestauranteProximo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!meuId) return;
    let ativo = true;
    listarVinculos(meuId)
      .then((v) => ativo && setAmigos(v.filter((x) => x.status === 'aceita')))
      .catch(() => ativo && setErro('Não foi possível carregar seus amigos.'));
    return () => {
      ativo = false;
    };
  }, [meuId]);

  async function desafiar() {
    if (!meuId || !amigoSelecionado || !restaurante || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const id = await criarDuelo(meuId, amigoSelecionado, restaurante.id);
      router.replace(`/duelo/${id}`);
    } catch (e) {
      setErro(traduzirErroDuelo(e instanceof Error ? e.message : ''));
      setEnviando(false);
    }
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Novo duelo' }} />
      <View style={styles.conteudo}>
        <View style={styles.passo}>
          <ThemedText type="label" themeColor="primaryDark">
            1 · Quem você desafia?
          </ThemedText>
          {amigos === null ? (
            <ThemedText themeColor="textSecondary">Carregando amigos…</ThemedText>
          ) : amigos.length === 0 ? (
            <ThemedText themeColor="textSecondary">Você ainda não tem amigos. Adicione alguém na aba Amigos.</ThemedText>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.amigos}>
              {amigos.map((v) => {
                const ativo = v.outro.id === amigoSelecionado;
                return (
                  <Pressable
                    key={v.amizadeId}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativo }}
                    onPress={() => setAmigoSelecionado(v.outro.id)}
                    style={[
                      styles.amigo,
                      {
                        backgroundColor: ativo ? theme.primary : theme.backgroundCard,
                        borderColor: ativo ? theme.primary : theme.border,
                      },
                    ]}>
                    <ThemedText type="bold" style={{ color: ativo ? theme.onPrimary : theme.text }} numberOfLines={1}>
                      {v.outro.nome}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={[styles.passo, styles.flex]}>
          <ThemedText type="label" themeColor="primaryDark">
            2 · Qual restaurante você defende?
          </ThemedText>
          <SeletorRestaurante selecionadoId={restaurante?.id ?? null} onSelecionar={setRestaurante} />
        </View>

        {erro ? <ThemedText themeColor="danger">{erro}</ThemedText> : null}
        <Button
          title={restaurante ? `Desafiar com ${restaurante.nome}` : 'Desafiar'}
          onPress={desafiar}
          disabled={!amigoSelecionado || !restaurante}
          loading={enviando}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flex: 1,
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  passo: {
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  amigos: {
    gap: Spacing.two,
  },
  amigo: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: 180,
  },
});
