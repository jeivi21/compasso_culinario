import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { formatarNota } from '@/lib/formatacao';
import { atualizarNome, buscarEstatisticas, type EstatisticasPerfil } from '@/lib/perfil';
import { vizinhosDoUsuario, type VizinhoPerfil } from '@/lib/recomendacao';
import { validarNome } from '@/lib/validation';

function iniciais(nome: string): string {
  return (
    nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  );
}

function membroDesde(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function Estatistica({ valor, label, icone }: { valor: string; label: string; icone: keyof typeof Ionicons.glyphMap }) {
  const theme = useTheme();
  return (
    <View style={[styles.estatistica, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
      <Ionicons name={icone} size={20} color={theme.primaryDark} />
      <ThemedText type="subtitle">{valor}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

function ItemMenu({ icone, titulo, detalhe, onPress }: { icone: keyof typeof Ionicons.glyphMap; titulo: string; detalhe?: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: theme.backgroundCard, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <Ionicons name={icone} size={22} color={theme.primaryDark} />
      <View style={styles.menuTexto}>
        <ThemedText type="bold">{titulo}</ThemedText>
        {detalhe ? (
          <ThemedText type="small" themeColor="textMuted">
            {detalhe}
          </ThemedText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
    </Pressable>
  );
}

export default function PerfilScreen() {
  const theme = useTheme();
  const { session, perfil, signOut, recarregarPerfil } = useAuth();
  const usuarioId = session?.user.id;

  const [stats, setStats] = useState<EstatisticasPerfil | null>(null);
  const [vizinhos, setVizinhos] = useState<VizinhoPerfil[] | null>(null);
  const [saindo, setSaindo] = useState(false);
  const [editando, setEditando] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Recarrega ao voltar para a aba (novas avaliações, amigos e duelos mudam os números).
  useFocusEffect(
    useCallback(() => {
      if (!usuarioId) return;
      let ativo = true;
      buscarEstatisticas(usuarioId)
        .then((s) => ativo && setStats(s))
        .catch(() => {});
      vizinhosDoUsuario(usuarioId)
        .then((v) => ativo && setVizinhos(v))
        .catch(() => ativo && setVizinhos([]));
      return () => {
        ativo = false;
      };
    }, [usuarioId]),
  );

  async function sair() {
    setSaindo(true);
    await signOut();
    // O guard de rotas leva de volta para o login.
  }

  function abrirEdicao() {
    setNovoNome(perfil?.nome ?? '');
    setErroNome(null);
    setEditando(true);
  }

  async function salvarNome() {
    if (!usuarioId) return;
    const erro = validarNome(novoNome);
    if (erro) {
      setErroNome(erro);
      return;
    }
    setSalvando(true);
    try {
      await atualizarNome(usuarioId, novoNome);
      await recarregarPerfil();
      setEditando(false);
    } catch {
      setErroNome('Não foi possível salvar. Verifique sua conexão.');
    } finally {
      setSalvando(false);
    }
  }

  const nome = perfil?.nome ?? '…';
  const taxaVitoria =
    stats && stats.duelosJogados > 0 ? `${Math.round((stats.duelosVencidos / stats.duelosJogados) * 100)}%` : '–';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <ThemedText type="title">Perfil</ThemedText>

        <View style={[styles.cartao, { backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText type="title" style={{ color: theme.onPrimary }}>
              {iniciais(nome)}
            </ThemedText>
          </View>
          <View style={styles.identidade}>
            <View style={styles.linhaNome}>
              <ThemedText type="subtitle" numberOfLines={1} style={styles.nome}>
                {nome}
              </ThemedText>
              <Pressable accessibilityRole="button" accessibilityLabel="Editar nome" hitSlop={8} onPress={abrirEdicao}>
                <Ionicons name="pencil" size={18} color={theme.primaryDark} />
              </Pressable>
            </View>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {perfil?.email ?? session?.user.email}
            </ThemedText>
            {stats?.membroDesde ? (
              <ThemedText type="small" themeColor="textMuted">
                No app desde {membroDesde(stats.membroDesde)}
              </ThemedText>
            ) : null}
          </View>
        </View>

        <View style={styles.grade}>
          <Estatistica icone="star" valor={stats ? String(stats.avaliacoes) : '–'} label="avaliações" />
          <Estatistica icone="speedometer-outline" valor={stats ? formatarNota(stats.mediaDada) : '–'} label="nota média" />
          <Estatistica icone="heart" valor={stats ? String(stats.favoritos) : '–'} label="favoritos" />
          <Estatistica icone="bookmark" valor={stats ? String(stats.queroIr) : '–'} label="quero ir" />
          <Estatistica icone="people" valor={stats ? String(stats.amigos) : '–'} label="amigos" />
          <Estatistica icone="trophy" valor={taxaVitoria} label={stats ? `${stats.duelosVencidos}/${stats.duelosJogados} duelos` : 'duelos'} />
        </View>

        {stats?.categoriaFavorita ? (
          <View style={[styles.destaque, { backgroundColor: theme.backgroundCard, borderColor: theme.primary }]}>
            <Ionicons name="restaurant" size={24} color={theme.primaryDark} />
            <View style={styles.menuTexto}>
              <ThemedText type="label" themeColor="primaryDark">
                Seu prato forte
              </ThemedText>
              <ThemedText type="bold">{stats.categoriaFavorita.nome}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {stats.categoriaFavorita.quantidade} {stats.categoriaFavorita.quantidade > 1 ? 'avaliações' : 'avaliação'} · nota média{' '}
                {formatarNota(stats.categoriaFavorita.media)}
              </ThemedText>
            </View>
          </View>
        ) : null}

        <View style={styles.secao}>
          <ThemedText type="label" themeColor="textSecondary">
            Gosto parecido com o seu
          </ThemedText>
          {vizinhos === null ? (
            <ThemedText type="small" themeColor="textMuted">
              Calculando…
            </ThemedText>
          ) : vizinhos.length === 0 ? (
            <ThemedText type="small" themeColor="textMuted">
              Avalie mais restaurantes para o app encontrar pessoas com gosto parecido.
            </ThemedText>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vizinhos}>
              {vizinhos.map((v) => (
                <View key={v.id} style={[styles.vizinho, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                  <View style={[styles.avatarPequeno, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="bold" themeColor="primaryDark">
                      {iniciais(v.nome)}
                    </ThemedText>
                  </View>
                  <ThemedText type="bold" numberOfLines={1} style={styles.vizinhoNome}>
                    {v.nome.split(' ')[0]}
                  </ThemedText>
                  <ThemedText type="small" themeColor="primaryDark">
                    {Math.round(v.similaridade * 100)}% parecido
                  </ThemedText>
                  <ThemedText type="small" themeColor="textMuted">
                    {v.itensEmComum} em comum
                  </ThemedText>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.menu}>
          <ItemMenu icone="star-outline" titulo="Minhas avaliações" detalhe="Ver, editar e excluir" onPress={() => router.push('/minhas-avaliacoes')} />
          <ItemMenu icone="flash-outline" titulo="Duelos" detalhe="Histórico e desafios em aberto" onPress={() => router.push('/duelo')} />
          <ItemMenu icone="heart-outline" titulo="Salvos" detalhe="Favoritos e Quero ir" onPress={() => router.push('/favoritos')} />
        </View>

        <Button title="Sair" variant="secondary" onPress={sair} loading={saindo} />
      </ScrollView>

      <Modal visible={editando} transparent animationType="fade" onRequestClose={() => setEditando(false)}>
        <Pressable style={styles.fundoModal} onPress={() => setEditando(false)} accessibilityRole="button" accessibilityLabel="Fechar">
          <Pressable style={[styles.modal, { backgroundColor: theme.background }]} onPress={() => {}}>
            <ThemedText type="subtitle">Editar nome</ThemedText>
            <TextField label="Nome" value={novoNome} onChangeText={setNovoNome} error={erroNome} autoFocus onSubmitEditing={salvarNome} />
            <View style={styles.acoesModal}>
              <Button title="Cancelar" variant="ghost" onPress={() => setEditando(false)} disabled={salvando} style={styles.flex} />
              <Button title="Salvar" onPress={salvarNome} loading={salvando} style={styles.flex} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    gap: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identidade: {
    flex: 1,
    gap: 2,
  },
  linhaNome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nome: {
    flexShrink: 1,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  estatistica: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  destaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 2,
  },
  secao: {
    gap: Spacing.two,
  },
  vizinhos: {
    gap: Spacing.two,
  },
  vizinho: {
    width: 120,
    alignItems: 'center',
    gap: 2,
    padding: Spacing.two,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  avatarPequeno: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  vizinhoNome: {
    maxWidth: 104,
  },
  menu: {
    gap: Spacing.two,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  menuTexto: {
    flex: 1,
    gap: 1,
  },
  fundoModal: {
    flex: 1,
    backgroundColor: 'rgba(14, 46, 43, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modal: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.large,
  },
  acoesModal: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
