import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { infoJogo } from '@/games';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { adversario, listarDuelos, meuPlacar, type Duelo } from '@/lib/duelos';
import { formatarData } from '@/lib/restaurantes';

function descreverStatus(d: Duelo, meuId: string): { texto: string; cor: 'primaryDark' | 'textSecondary' | 'textMuted' } {
  const souDesafiante = d.desafiante_id === meuId;
  switch (d.status) {
    case 'pendente':
      return souDesafiante
        ? { texto: 'Aguardando resposta', cor: 'textMuted' }
        : { texto: 'Te desafiou! Toque para responder', cor: 'primaryDark' };
    case 'em_andamento':
      return meuPlacar(d, meuId) === null
        ? { texto: `Sua vez de jogar: ${infoJogo(d.jogo)?.nome ?? d.jogo}`, cor: 'primaryDark' }
        : { texto: 'Esperando o adversário jogar', cor: 'textMuted' };
    case 'concluido':
      return d.vencedor_id === meuId ? { texto: 'Você venceu', cor: 'primaryDark' } : { texto: 'Você perdeu', cor: 'textSecondary' };
    case 'recusado':
      return { texto: 'Recusado', cor: 'textMuted' };
    default:
      return { texto: 'Cancelado', cor: 'textMuted' };
  }
}

export default function DuelosScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const meuId = session?.user.id ?? '';
  const [duelos, setDuelos] = useState<Duelo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      listarDuelos()
        .then((d) => {
          if (!ativo) return;
          setDuelos(d);
          setErro(null);
        })
        .catch(() => ativo && setErro('Não foi possível carregar os duelos.'));
      return () => {
        ativo = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tentativa]),
  );

  const ativos = duelos?.filter((d) => d.status === 'pendente' || d.status === 'em_andamento') ?? [];
  const encerrados = duelos?.filter((d) => d.status !== 'pendente' && d.status !== 'em_andamento') ?? [];

  function renderItem(d: Duelo) {
    const outro = adversario(d, meuId);
    const status = descreverStatus(d, meuId);
    const destaque = status.cor === 'primaryDark' && d.status !== 'concluido';
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(`/duelo/${d.id}`)}
        style={({ pressed }) => [
          styles.item,
          {
            backgroundColor: destaque ? theme.backgroundElement : theme.backgroundCard,
            borderColor: destaque ? theme.primary : theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <Ionicons name="flash" size={24} color={destaque ? theme.primaryDark : theme.textMuted} />
        <View style={styles.itemTexto}>
          <ThemedText type="bold" numberOfLines={1}>
            vs {outro?.nome ?? 'Amigo'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {d.restaurante_desafiante?.nome}
            {d.restaurante_desafiado ? ` × ${d.restaurante_desafiado.nome}` : ''}
          </ThemedText>
          <ThemedText type="small" themeColor={status.cor}>
            {status.texto} · {formatarData(d.atualizado_em)}
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
      </Pressable>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Duelos' }} />
      {duelos === null && !erro ? (
        <View style={styles.centro}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      ) : duelos === null ? (
        <View style={styles.centro}>
          <ThemedText themeColor="textSecondary">{erro}</ThemedText>
          <Button title="Tentar de novo" variant="secondary" onPress={() => setTentativa((t) => t + 1)} />
        </View>
      ) : (
        <FlatList
          data={[...ativos, ...encerrados]}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          ListHeaderComponent={
            <View style={styles.cabecalho}>
              <ThemedText themeColor="textSecondary">
                Cada um escolhe um restaurante e um minijogo sorteado decide onde vocês vão.
              </ThemedText>
              <Button title="Novo duelo" onPress={() => router.push('/duelo/novo')} />
              {erro ? <ThemedText themeColor="danger">{erro}</ThemedText> : null}
              {ativos.length > 0 ? (
                <ThemedText type="label" themeColor="textSecondary">
                  Em aberto ({ativos.length})
                </ThemedText>
              ) : null}
            </View>
          }
          renderItem={({ item, index }) => (
            <>
              {index === ativos.length && encerrados.length > 0 ? (
                <ThemedText type="label" themeColor="textSecondary" style={styles.tituloSecao}>
                  Encerrados ({encerrados.length})
                </ThemedText>
              ) : null}
              {renderItem(item)}
            </>
          )}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Ionicons name="flash-outline" size={48} color={theme.textMuted} />
              <ThemedText themeColor="textSecondary" style={styles.centroTexto}>
                Nenhum duelo ainda. Desafie um amigo!
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
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  tituloSecao: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  lista: {
    flexGrow: 1,
    paddingVertical: Spacing.three,
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
    gap: 2,
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
