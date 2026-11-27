import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { EstadoTela } from '@/components/estado-tela';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Fonts, MinTouchTarget, PressedOpacity, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import {
  buscarUsuarios,
  enviarPedido,
  listarVinculos,
  removerVinculo,
  responderPedido,
  traduzirErroAmizade,
  type UsuarioResumo,
  type Vinculo,
} from '@/lib/amigos';
import { confirmar } from '@/lib/confirmar';

export default function AmigosScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const meuId = session?.user.id;

  const [vinculos, setVinculos] = useState<Vinculo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [atualizando, setAtualizando] = useState(false);
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<UsuarioResumo[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!meuId) return;
      let ativo = true;
      listarVinculos(meuId)
        .then((v) => {
          if (!ativo) return;
          setVinculos(v);
          setErro(null);
        })
        .catch(() => ativo && setErro('Não foi possível carregar seus amigos.'))
        .finally(() => ativo && setAtualizando(false));
      return () => {
        ativo = false;
      };
      // `tentativa` força nova busca após ações e no "Tentar de novo".
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meuId, tentativa]),
  );

  // Busca com atraso de 400 ms depois que o usuário para de digitar.
  useEffect(() => {
    const limpo = termo.trim();
    if (limpo.length < 2) {
      const id = setTimeout(() => setResultados(null), 0);
      return () => clearTimeout(id);
    }
    let ativo = true;
    const id = setTimeout(() => {
      setBuscando(true);
      buscarUsuarios(limpo)
        .then((r) => ativo && setResultados(r))
        .catch(() => ativo && setResultados([]))
        .finally(() => ativo && setBuscando(false));
    }, 400);
    return () => {
      ativo = false;
      clearTimeout(id);
    };
  }, [termo]);

  const recarregar = () => setTentativa((t) => t + 1);

  async function agir(chave: string, acao: () => Promise<void>) {
    setOcupado(chave);
    setErro(null);
    try {
      await acao();
      recarregar();
    } catch (e) {
      setErro(traduzirErroAmizade(e instanceof Error ? e.message : ''));
    } finally {
      setOcupado(null);
    }
  }

  const amigos = vinculos?.filter((v) => v.status === 'aceita') ?? [];
  const recebidos = vinculos?.filter((v) => v.status === 'pendente' && !v.enviadoPorMim) ?? [];
  const enviados = vinculos?.filter((v) => v.status === 'pendente' && v.enviadoPorMim) ?? [];
  const porUsuario = new Map((vinculos ?? []).map((v) => [v.outro.id, v]));

  const cabecalho = (
    <View style={styles.cabecalho}>
      <View style={styles.titulo}>
        <ThemedText type="title">Amigos</ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/duelo')}
          style={({ pressed }) => [styles.botaoDuelos, { backgroundColor: theme.primary, opacity: pressed ? PressedOpacity : 1 }]}>
          <Ionicons name="flash" size={18} color={theme.onPrimary} />
          <ThemedText type="bold" style={{ color: theme.onPrimary }}>
            Duelos
          </ThemedText>
        </Pressable>
      </View>
      <View style={[styles.busca, { backgroundColor: theme.backgroundCard, borderColor: theme.borderStrong }]}>
        <Ionicons name="search" size={20} color={theme.textMuted} />
        <TextInput
          value={termo}
          onChangeText={setTermo}
          placeholder="Nome ou e-mail completo"
          accessibilityLabel="Buscar amigo por nome ou e-mail completo"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.buscaInput, { color: theme.text }]}
        />
        {termo ? (
          <IconButton
            icon="close-circle"
            size={20}
            color={theme.textMuted}
            accessibilityLabel="Limpar busca"
            onPress={() => setTermo('')}
            style={styles.limparBusca}
          />
        ) : null}
      </View>

      {buscando ? <ActivityIndicator color={theme.primary} /> : null}
      {resultados ? (
        <View style={styles.secao}>
          <ThemedText type="label" themeColor="textSecondary" accessibilityRole="header">
            Resultados
          </ThemedText>
          {resultados.length === 0 && !buscando ? (
            <ThemedText themeColor="textSecondary">Ninguém encontrado com “{termo.trim()}”.</ThemedText>
          ) : null}
          {resultados.map((u) => {
            const v = porUsuario.get(u.id);
            return (
              <View key={u.id} style={[styles.item, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                <Avatar nome={u.nome} />
                <View style={styles.itemTexto}>
                  <ThemedText type="bold" numberOfLines={1}>
                    {u.nome}
                  </ThemedText>
                </View>
                {!v ? (
                  <Button
                    title="Adicionar"
                    onPress={() => meuId && agir(u.id, () => enviarPedido(meuId, u.id))}
                    loading={ocupado === u.id}
                    style={styles.botaoPequeno}
                  />
                ) : v.status === 'aceita' ? (
                  <ThemedText type="small" themeColor="primaryDark">
                    Amigos
                  </ThemedText>
                ) : v.status === 'pendente' ? (
                  <ThemedText type="small" themeColor="textMuted">
                    {v.enviadoPorMim ? 'Pedido enviado' : 'Pediu amizade'}
                  </ThemedText>
                ) : (
                  <Button
                    title="Pedir de novo"
                    variant="secondary"
                    onPress={() =>
                      meuId &&
                      agir(u.id, async () => {
                        await removerVinculo(v.amizadeId);
                        await enviarPedido(meuId, u.id);
                      })
                    }
                    loading={ocupado === u.id}
                    style={styles.botaoPequeno}
                  />
                )}
              </View>
            );
          })}
        </View>
      ) : null}

      {erro ? <ThemedText themeColor="danger">{erro}</ThemedText> : null}

      {recebidos.length > 0 ? (
        <View style={styles.secao}>
          <ThemedText type="label" themeColor="textSecondary" accessibilityRole="header">
            Pedidos recebidos ({recebidos.length})
          </ThemedText>
          {recebidos.map((v) => (
            <View key={v.amizadeId} style={[styles.item, { backgroundColor: theme.backgroundElement, borderColor: theme.primary }]}>
              <Avatar nome={v.outro.nome} variante="destaque" />
              <View style={styles.itemTexto}>
                <ThemedText type="bold" numberOfLines={1}>
                  {v.outro.nome}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  quer ser seu amigo
                </ThemedText>
              </View>
              <IconButton
                icon="close"
                size={24}
                color={theme.textSecondary}
                accessibilityLabel={`Recusar ${v.outro.nome}`}
                disabled={ocupado !== null}
                onPress={() => agir(v.amizadeId, () => responderPedido(v.amizadeId, false))}
              />
              <IconButton
                icon="checkmark"
                size={24}
                color={theme.onPrimary}
                backgroundColor={theme.primary}
                accessibilityLabel={`Aceitar ${v.outro.nome}`}
                disabled={ocupado !== null}
                onPress={() => agir(v.amizadeId, () => responderPedido(v.amizadeId, true))}
              />
            </View>
          ))}
        </View>
      ) : null}

      {enviados.length > 0 ? (
        <View style={styles.secao}>
          <ThemedText type="label" themeColor="textSecondary" accessibilityRole="header">
            Pedidos enviados ({enviados.length})
          </ThemedText>
          {enviados.map((v) => (
            <View key={v.amizadeId} style={[styles.item, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
              <Avatar nome={v.outro.nome} />
              <View style={styles.itemTexto}>
                <ThemedText type="bold" numberOfLines={1}>
                  {v.outro.nome}
                </ThemedText>
                <ThemedText type="small" themeColor="textMuted">
                  aguardando resposta
                </ThemedText>
              </View>
              <Button
                title="Cancelar"
                variant="ghost"
                disabled={ocupado !== null}
                onPress={() => agir(v.amizadeId, () => removerVinculo(v.amizadeId))}
                style={styles.botaoPequeno}
              />
            </View>
          ))}
        </View>
      ) : null}

      <ThemedText type="label" themeColor="textSecondary" style={styles.tituloLista} accessibilityRole="header">
        Meus amigos ({amigos.length})
      </ThemedText>
    </View>
  );

  return (
    <Screen>
      {vinculos === null && !erro ? (
        <>
          <ThemedText type="title" style={styles.tituloCarregando}>
            Amigos
          </ThemedText>
          <EstadoTela carregando />
        </>
      ) : vinculos === null ? (
        <EstadoTela
          erro
          icone="cloud-offline-outline"
          mensagem={erro ?? undefined}
          acao={{ titulo: 'Tentar de novo', onPress: recarregar }}
        />
      ) : (
        <Animated.FlatList
          itemLayoutAnimation={LinearTransition.springify().damping(18)}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              tintColor={theme.primary}
              colors={[theme.primaryDark]}
              onRefresh={() => {
                setAtualizando(true);
                recarregar();
              }}
            />
          }
          data={amigos}
          keyExtractor={(v) => v.amizadeId}
          ListHeaderComponent={cabecalho}
          contentContainerStyle={styles.lista}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Ionicons name="people-outline" size={48} color={theme.textMuted} />
              <ThemedText themeColor="textSecondary" style={styles.centroTexto}>
                Você ainda não tem amigos no app. Busque alguém pelo nome ou e-mail.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <Animated.View
              exiting={FadeOutLeft.duration(220)}
              style={[styles.item, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
              <Avatar nome={item.outro.nome} />
              <View style={styles.itemTexto}>
                <ThemedText type="bold" numberOfLines={1}>
                  {item.outro.nome}
                </ThemedText>
              </View>
              <IconButton
                icon="flash"
                size={20}
                backgroundColor={theme.backgroundElement}
                accessibilityLabel={`Desafiar ${item.outro.nome}`}
                onPress={() => router.push({ pathname: '/duelo/novo', params: { amigoId: item.outro.id } })}
              />
              <IconButton
                icon="person-remove-outline"
                size={22}
                color={theme.textMuted}
                accessibilityLabel={`Desfazer amizade com ${item.outro.nome}`}
                disabled={ocupado !== null}
                onPress={() =>
                  confirmar(
                    'Desfazer amizade',
                    `Você e ${item.outro.nome} deixam de ser amigos. Duelos em aberto ficam como estão.`,
                    'Desfazer',
                    () => agir(item.amizadeId, () => removerVinculo(item.amizadeId)),
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
    paddingBottom: Spacing.two,
  },
  tituloCarregando: {
    paddingTop: Spacing.three,
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botaoDuelos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
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
    paddingVertical: 12,
  },
  secao: {
    gap: Spacing.two,
  },
  tituloLista: {
    paddingTop: Spacing.two,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  itemTexto: {
    flex: 1,
    gap: 2,
  },
  limparBusca: {
    marginRight: -Spacing.two,
  },
  botaoPequeno: {
    minHeight: MinTouchTarget,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
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
  vazio: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  centroTexto: {
    textAlign: 'center',
  },
});
