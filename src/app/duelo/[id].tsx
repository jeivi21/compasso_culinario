import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { SeletorRestaurante } from '@/components/seletor-restaurante';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { infoJogo } from '@/games';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import {
  aceitarDuelo,
  adversario,
  buscarDuelo,
  cancelarDuelo,
  meuLado,
  meuPlacar,
  ouvirDuelo,
  placarAdversario,
  recusarDuelo,
  registrarPlacar,
  traduzirErroDuelo,
  type Duelo,
} from '@/lib/duelos';
import type { RestauranteProximo } from '@/lib/restaurantes';

function formatarPlacar(p: number | null): string {
  return p === null ? '–' : Number(p).toFixed(0);
}

export default function DueloScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const meuId = session?.user.id ?? '';
  const { id } = useLocalSearchParams<{ id: string }>();

  const [duelo, setDuelo] = useState<Duelo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [acaoErro, setAcaoErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [escolha, setEscolha] = useState<RestauranteProximo | null>(null);
  const [jogando, setJogando] = useState(false);
  const [placarLocal, setPlacarLocal] = useState<number | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const recarregar = useCallback(() => {
    buscarDuelo(id)
      .then((d) => {
        setDuelo(d);
        setErro(null);
      })
      .catch(() => setErro('Não foi possível carregar o duelo.'));
  }, [id]);

  // Carrega e passa a ouvir mudanças (o adversário aceitou, jogou, etc.).
  useEffect(() => {
    let ativo = true;
    buscarDuelo(id)
      .then((d) => ativo && setDuelo(d))
      .catch(() => ativo && setErro('Não foi possível carregar o duelo.'));
    const parar = ouvirDuelo(id, recarregar);
    return () => {
      ativo = false;
      parar();
    };
  }, [id, recarregar, tentativa]);

  async function agir(acao: () => Promise<void>) {
    setOcupado(true);
    setAcaoErro(null);
    try {
      await acao();
      recarregar();
    } catch (e) {
      setAcaoErro(traduzirErroDuelo(e instanceof Error ? e.message : ''));
    } finally {
      setOcupado(false);
    }
  }

  const aoTerminarJogo = useCallback(
    (placar: number) => {
      setPlacarLocal(placar);
      setJogando(false);
      registrarPlacar(id, placar)
        .then(recarregar)
        .catch((e) => setAcaoErro(traduzirErroDuelo(e instanceof Error ? e.message : '')));
    },
    [id, recarregar],
  );

  if (!duelo) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'Duelo' }} />
        <View style={styles.centro}>
          {erro ? (
            <>
              <ThemedText themeColor="textSecondary">{erro}</ThemedText>
              <Button title="Tentar de novo" variant="secondary" onPress={() => setTentativa((t) => t + 1)} />
            </>
          ) : (
            <ActivityIndicator color={theme.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  const lado = meuLado(duelo, meuId);
  const outro = adversario(duelo, meuId);
  const jogo = infoJogo(duelo.jogo);
  const meuRestaurante = lado === 'desafiante' ? duelo.restaurante_desafiante : duelo.restaurante_desafiado;
  const restauranteOutro = lado === 'desafiante' ? duelo.restaurante_desafiado : duelo.restaurante_desafiante;
  const meu = meuPlacar(duelo, meuId);
  const dele = placarAdversario(duelo, meuId);

  // --- Jogando: o minijogo ocupa a tela ---------------------------------
  if (jogando && jogo) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: jogo.nome, headerBackVisible: false, gestureEnabled: false }} />
        <View style={styles.jogo}>
          <jogo.Componente key={`${duelo.id}-${duelo.rodada}`} semente={duelo.semente} onFim={aoTerminarJogo} />
        </View>
      </Screen>
    );
  }

  const placarCard = (
    <View style={[styles.placar, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.placarLado}>
        <ThemedText type="label" themeColor="textSecondary">
          Você
        </ThemedText>
        <ThemedText type="title">{formatarPlacar(meu ?? placarLocal)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.centroTexto}>
          {meuRestaurante?.nome ?? '—'}
        </ThemedText>
      </View>
      <ThemedText type="subtitle" themeColor="textMuted">
        ×
      </ThemedText>
      <View style={styles.placarLado}>
        <ThemedText type="label" themeColor="textSecondary" numberOfLines={1}>
          {outro?.nome.split(' ')[0] ?? 'Adversário'}
        </ThemedText>
        <ThemedText type="title">{formatarPlacar(dele)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.centroTexto}>
          {restauranteOutro?.nome ?? 'ainda não escolheu'}
        </ThemedText>
      </View>
    </View>
  );

  let corpo;
  if (duelo.status === 'pendente' && lado === 'desafiado') {
    corpo = (
      <View style={styles.flex}>
        <ThemedText type="subtitle">
          {outro?.nome} te desafiou defendendo {duelo.restaurante_desafiante?.nome}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.paragrafo}>
          Escolha o restaurante que você defende. O jogo será sorteado quando você aceitar; quem fizer mais pontos
          decide onde vocês vão.
        </ThemedText>
        <View style={styles.flex}>
          <SeletorRestaurante
            selecionadoId={escolha?.id ?? null}
            onSelecionar={setEscolha}
            bloqueadoId={duelo.restaurante_desafiante_id}
          />
        </View>
        <View style={styles.acoes}>
          <Button title="Recusar" variant="ghost" onPress={() => agir(() => recusarDuelo(duelo.id))} disabled={ocupado} style={styles.flex} />
          <Button
            title="Aceitar e sortear jogo"
            onPress={() => escolha && agir(() => aceitarDuelo(duelo.id, escolha.id))}
            disabled={!escolha}
            loading={ocupado}
            style={styles.flex2}
          />
        </View>
      </View>
    );
  } else if (duelo.status === 'pendente') {
    corpo = (
      <View style={styles.bloco}>
        <Ionicons name="hourglass-outline" size={56} color={theme.primary} />
        <ThemedText type="subtitle" style={styles.centroTexto}>
          Esperando {outro?.nome} aceitar
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centroTexto}>
          Assim que aceitar e escolher o restaurante, o jogo é sorteado e você é avisado aqui.
        </ThemedText>
        <Button title="Cancelar desafio" variant="ghost" onPress={() => agir(() => cancelarDuelo(duelo.id))} loading={ocupado} />
      </View>
    );
  } else if (duelo.status === 'em_andamento' && jogo) {
    const jaJoguei = meu !== null || placarLocal !== null;
    corpo = (
      <View style={styles.bloco}>
        <View style={[styles.jogoCard, { backgroundColor: theme.backgroundCard, borderColor: theme.primary }]}>
          <Ionicons name={jogo.icone} size={40} color={theme.primaryDark} />
          <ThemedText type="label" themeColor="primaryDark">
            Jogo sorteado{duelo.rodada > 1 ? ` · rodada ${duelo.rodada} (empate!)` : ''}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.centroTexto}>
            {jogo.nome}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centroTexto}>
            {jogo.descricao}
          </ThemedText>
          <ThemedText type="small" themeColor="textMuted" style={styles.centroTexto}>
            {jogo.pontuacao}
          </ThemedText>
        </View>
        {jaJoguei ? (
          <>
            <ThemedText themeColor="textSecondary" style={styles.centroTexto}>
              {dele === null
                ? `Você fez ${formatarPlacar(meu ?? placarLocal)} pontos. Esperando ${outro?.nome.split(' ')[0]} jogar…`
                : 'Calculando o resultado…'}
            </ThemedText>
            <ActivityIndicator color={theme.primary} />
          </>
        ) : (
          <Button title="Jogar agora" onPress={() => setJogando(true)} />
        )}
      </View>
    );
  } else if (duelo.status === 'concluido') {
    const venci = duelo.vencedor_id === meuId;
    const vencedorRestaurante = duelo.vencedor_id === duelo.desafiante_id ? duelo.restaurante_desafiante : duelo.restaurante_desafiado;
    corpo = (
      <View style={styles.bloco}>
        <Ionicons name={venci ? 'trophy' : 'restaurant'} size={64} color={venci ? theme.star : theme.primary} />
        <ThemedText type="title" style={styles.centroTexto}>
          {venci ? 'Você venceu!' : `${outro?.nome.split(' ')[0]} venceu`}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centroTexto}>
          Vocês vão ao <ThemedText type="bold">{vencedorRestaurante?.nome}</ThemedText>. Já está na lista Quero ir
          dos dois.
        </ThemedText>
        {vencedorRestaurante ? (
          <Button title="Ver restaurante" onPress={() => router.push(`/restaurante/${vencedorRestaurante.id}`)} />
        ) : null}
        <Button title="Novo duelo" variant="ghost" onPress={() => router.replace('/duelo/novo')} />
      </View>
    );
  } else {
    corpo = (
      <View style={styles.bloco}>
        <Ionicons name="close-circle-outline" size={56} color={theme.textMuted} />
        <ThemedText type="subtitle">{duelo.status === 'recusado' ? 'Duelo recusado' : 'Duelo cancelado'}</ThemedText>
        <Button title="Novo duelo" variant="secondary" onPress={() => router.replace('/duelo/novo')} />
      </View>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: `Duelo vs ${outro?.nome.split(' ')[0] ?? ''}` }} />
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        {placarCard}
        {acaoErro ? <ThemedText themeColor="danger">{acaoErro}</ThemedText> : null}
        {corpo}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexGrow: 1,
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  jogo: {
    flex: 1,
    paddingVertical: Spacing.three,
  },
  placar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  placarLado: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  bloco: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  jogoCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderWidth: 2,
  },
  paragrafo: {
    paddingBottom: Spacing.two,
  },
  acoes: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.two,
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
