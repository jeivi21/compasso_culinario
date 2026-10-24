import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
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

function Avatar({ nome, cor, corTexto }: { nome: string; cor: string; corTexto: string }) {
  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <View style={[styles.avatar, { backgroundColor: cor }]}>
      <ThemedText type="bold" style={{ color: corTexto }}>
        {iniciais || '?'}
      </ThemedText>
    </View>
  );
}

export default function AmigosScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const meuId = session?.user.id;

  const [vinculos, setVinculos] = useState<Vinculo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
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
        .catch(() => ativo && setErro('Não foi possível carregar seus amigos.'));
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
      <ThemedText type="title">Amigos</ThemedText>
      <View style={[styles.busca, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.textMuted} />
        <TextInput
          value={termo}
          onChangeText={setTermo}
          placeholder="Buscar por nome ou e-mail"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.buscaInput, { color: theme.text }]}
        />
        {termo ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" hitSlop={8} onPress={() => setTermo('')}>
            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {buscando ? <ActivityIndicator color={theme.primary} /> : null}
      {resultados ? (
        <View style={styles.secao}>
          <ThemedText type="label" themeColor="textSecondary">
            Resultados
          </ThemedText>
          {resultados.length === 0 && !buscando ? (
            <ThemedText themeColor="textSecondary">Ninguém encontrado com “{termo.trim()}”.</ThemedText>
          ) : null}
          {resultados.map((u) => {
            const v = porUsuario.get(u.id);
            return (
              <View key={u.id} style={[styles.item, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                <Avatar nome={u.nome} cor={theme.backgroundElement} corTexto={theme.primaryDark} />
                <View style={styles.itemTexto}>
                  <ThemedText type="bold" numberOfLines={1}>
                    {u.nome}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textMuted" numberOfLines={1}>
                    {u.email ?? ''}
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
          <ThemedText type="label" themeColor="textSecondary">
            Pedidos recebidos ({recebidos.length})
          </ThemedText>
          {recebidos.map((v) => (
            <View key={v.amizadeId} style={[styles.item, { backgroundColor: theme.backgroundElement, borderColor: theme.primary }]}>
              <Avatar nome={v.outro.nome} cor={theme.primary} corTexto={theme.onPrimary} />
              <View style={styles.itemTexto}>
                <ThemedText type="bold" numberOfLines={1}>
                  {v.outro.nome}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  quer ser seu amigo
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Recusar ${v.outro.nome}`}
                hitSlop={8}
                disabled={ocupado !== null}
                onPress={() => agir(v.amizadeId, () => responderPedido(v.amizadeId, false))}
                style={styles.icone}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Aceitar ${v.outro.nome}`}
                hitSlop={8}
                disabled={ocupado !== null}
                onPress={() => agir(v.amizadeId, () => responderPedido(v.amizadeId, true))}
                style={[styles.icone, { backgroundColor: theme.primary }]}>
                <Ionicons name="checkmark" size={24} color={theme.onPrimary} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {enviados.length > 0 ? (
        <View style={styles.secao}>
          <ThemedText type="label" themeColor="textSecondary">
            Pedidos enviados ({enviados.length})
          </ThemedText>
          {enviados.map((v) => (
            <View key={v.amizadeId} style={[styles.item, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
              <Avatar nome={v.outro.nome} cor={theme.backgroundElement} corTexto={theme.primaryDark} />
              <View style={styles.itemTexto}>
                <ThemedText type="bold" numberOfLines={1}>
                  {v.outro.nome}
                </ThemedText>
                <ThemedText type="small" themeColor="textMuted">
                  aguardando resposta
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                disabled={ocupado !== null}
                onPress={() => agir(v.amizadeId, () => removerVinculo(v.amizadeId))}>
                <ThemedText type="small" themeColor="textSecondary">
                  Cancelar
                </ThemedText>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <ThemedText type="label" themeColor="textSecondary" style={styles.tituloLista}>
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
          <View style={styles.centro}>
            <ActivityIndicator color={theme.primary} size="large" />
          </View>
        </>
      ) : vinculos === null ? (
        <View style={styles.centro}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
          <ThemedText themeColor="textSecondary">{erro}</ThemedText>
          <Button title="Tentar de novo" variant="secondary" onPress={recarregar} />
        </View>
      ) : (
        <FlatList
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
            <View style={[styles.item, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
              <Avatar nome={item.outro.nome} cor={theme.backgroundElement} corTexto={theme.primaryDark} />
              <View style={styles.itemTexto}>
                <ThemedText type="bold" numberOfLines={1}>
                  {item.outro.nome}
                </ThemedText>
                <ThemedText type="small" themeColor="textMuted" numberOfLines={1}>
                  {item.outro.email ?? ''}
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Desfazer amizade com ${item.outro.nome}`}
                hitSlop={8}
                disabled={ocupado !== null}
                onPress={() => agir(item.amizadeId, () => removerVinculo(item.amizadeId))}>
                <Ionicons name="person-remove-outline" size={22} color={theme.textMuted} />
              </Pressable>
            </View>
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoPequeno: {
    minHeight: 40,
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
