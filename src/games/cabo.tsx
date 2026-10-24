import type { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { pontuacao } from '@/games/rng';
import type { PropsJogo } from '@/games/tipos';
import { estilosJogo, Instrucao, PainelJogo } from '@/games/ui';
import { supabase } from '@/lib/supabase';

const DURACAO_MS = 10_000;
const CONTAGEM_MS = 3_000;
/** Depois disso sem o adversário aparecer, libera jogar sozinho. */
const ESPERA_MAXIMA_MS = 30_000;
const LARGURA_CORDA = 280;

type Fase = 'conectando' | 'esperando' | 'contagem' | 'jogando' | 'fim';

type Mensagem =
  | { tipo: 'inicio'; comecaEm: number }
  | { tipo: 'puxar'; lado: 'desafiante' | 'desafiado' };

/**
 * Cabo de guerra em tempo real: os dois tocam a tela por 10 segundos; cada toque
 * puxa a corda para o seu lado. Os toques viajam por um canal Realtime (broadcast)
 * e a presença mostra se o adversário está na tela. Placar = número de toques.
 * Se o adversário não aparecer em 30 s, dá para jogar sozinho (ele joga depois).
 */
export function Cabo({ onFim, contexto }: PropsJogo) {
  const theme = useTheme();
  const { dueloId, lado, nomeAdversario } = contexto;
  const primeiroNome = nomeAdversario.split(' ')[0];

  const [fase, setFase] = useState<Fase>('conectando');
  const [adversarioPresente, setAdversarioPresente] = useState(false);
  const [meus, setMeus] = useState(0);
  const [dele, setDele] = useState(0);
  const [restante, setRestante] = useState(DURACAO_MS / 1000);
  const [esperaEsgotada, setEsperaEsgotada] = useState(false);

  const canal = useRef<RealtimeChannel | null>(null);
  const comecaEm = useRef<number | null>(null);
  const terminou = useRef(false);
  const meusRef = useRef(0);

  // Canal do duelo: presença + broadcast.
  useEffect(() => {
    const c = supabase.channel(`cabo-${dueloId}`, {
      config: { presence: { key: lado }, broadcast: { self: false } },
    });
    canal.current = c;

    c.on('presence', { event: 'sync' }, () => {
      const estado = c.presenceState();
      const outroLado = lado === 'desafiante' ? 'desafiado' : 'desafiante';
      const presente = Boolean(estado[outroLado]?.length);
      setAdversarioPresente(presente);
      // Quando os dois estão presentes, o desafiante dispara a contagem para ambos.
      if (presente && lado === 'desafiante' && comecaEm.current === null) {
        const inicio = Date.now() + CONTAGEM_MS;
        comecaEm.current = inicio;
        c.send({ type: 'broadcast', event: 'jogo', payload: { tipo: 'inicio', comecaEm: inicio } satisfies Mensagem });
        setFase('contagem');
      }
    })
      .on('broadcast', { event: 'jogo' }, ({ payload }) => {
        const m = payload as Mensagem;
        if (m.tipo === 'inicio' && comecaEm.current === null) {
          comecaEm.current = m.comecaEm;
          setFase('contagem');
        } else if (m.tipo === 'puxar' && m.lado !== lado) {
          setDele((d) => d + 1);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await c.track({ lado, em: Date.now() });
          setFase((f) => (f === 'conectando' ? 'esperando' : f));
        }
      });

    return () => {
      supabase.removeChannel(c);
    };
  }, [dueloId, lado]);

  // Libera "jogar sozinho" depois da espera máxima.
  useEffect(() => {
    if (fase !== 'esperando') return;
    const id = setTimeout(() => setEsperaEsgotada(true), ESPERA_MAXIMA_MS);
    return () => clearTimeout(id);
  }, [fase]);

  // Relógio da contagem e da partida.
  useEffect(() => {
    if (fase !== 'contagem' && fase !== 'jogando') return;
    const id = setInterval(() => {
      const inicio = comecaEm.current;
      if (inicio === null) return;
      const agora = Date.now();
      if (agora < inicio) {
        setRestante(Math.ceil((inicio - agora) / 1000));
        return;
      }
      const sobra = DURACAO_MS - (agora - inicio);
      if (sobra > 0) {
        setFase('jogando');
        setRestante(Math.ceil(sobra / 1000));
        return;
      }
      if (!terminou.current) {
        terminou.current = true;
        setFase('fim');
        setRestante(0);
        clearInterval(id);
        setTimeout(() => onFim(pontuacao(meusRef.current)), 800);
      }
    }, 100);
    return () => clearInterval(id);
  }, [fase, onFim]);

  function puxar() {
    if (fase !== 'jogando') return;
    meusRef.current += 1;
    setMeus(meusRef.current);
    canal.current?.send({ type: 'broadcast', event: 'jogo', payload: { tipo: 'puxar', lado } satisfies Mensagem });
  }

  function jogarSozinho() {
    comecaEm.current = Date.now() + CONTAGEM_MS;
    setFase('contagem');
  }

  // Corda: cada toque de diferença desloca 6 px, limitado à pista.
  const deslocamento = Math.max(-LARGURA_CORDA / 2, Math.min(LARGURA_CORDA / 2, (meus - dele) * 6));
  const corEu = theme.primary;
  const corEle = theme.danger;

  if (fase === 'conectando' || fase === 'esperando') {
    return (
      <View style={estilosJogo.area}>
        <ThemedText type="subtitle" style={styles.centro}>
          {fase === 'conectando' ? 'Conectando…' : adversarioPresente ? `${primeiroNome} está pronto!` : `Esperando ${primeiroNome} entrar…`}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centro}>
          Os dois precisam estar nesta tela ao mesmo tempo. Quando {primeiroNome} entrar, a contagem começa sozinha.
        </ThemedText>
        {esperaEsgotada && !adversarioPresente ? (
          <View style={styles.sozinho}>
            <ThemedText type="small" themeColor="textMuted" style={styles.centro}>
              {primeiroNome} parece estar offline. Você pode jogar agora; seus toques contam e {primeiroNome} joga depois.
            </ThemedText>
            <Button title="Jogar sozinho" variant="secondary" onPress={jogarSozinho} />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={estilosJogo.container}>
      <PainelJogo
        itens={[
          { label: 'Você', valor: String(meus) },
          { label: fase === 'contagem' ? 'Começa em' : 'Tempo', valor: `${restante}s` },
          { label: primeiroNome, valor: String(dele) },
        ]}
      />
      <Instrucao>
        {fase === 'contagem' ? 'Prepare o dedo…' : fase === 'jogando' ? 'TOQUE! Cada toque puxa a corda para o seu lado.' : 'Acabou!'}
      </Instrucao>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Puxar a corda"
        onPress={puxar}
        disabled={fase !== 'jogando'}
        style={[estilosJogo.area, styles.areaToque, { backgroundColor: fase === 'jogando' ? theme.backgroundElement : 'transparent' }]}>
        <View style={styles.pista}>
          <View style={[styles.lado, { backgroundColor: corEu }]}>
            <ThemedText type="bold" style={styles.ladoTexto}>
              Você
            </ThemedText>
          </View>
          <View style={[styles.lado, { backgroundColor: corEle }]}>
            <ThemedText type="bold" style={styles.ladoTexto}>
              {primeiroNome}
            </ThemedText>
          </View>
          <View style={[styles.marcaCentro, { backgroundColor: theme.textMuted }]} />
          <View style={[styles.no, { backgroundColor: theme.text, transform: [{ translateX: -deslocamento }] }]}>
            <ThemedText style={styles.noTexto}>🪢</ThemedText>
          </View>
        </View>
        <ThemedText type="title" style={styles.contagem}>
          {fase === 'contagem' ? restante : fase === 'fim' ? (meus > dele ? 'Puxou mais!' : meus < dele ? 'Perdeu a força…' : 'Empate!') : ''}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  sozinho: {
    gap: Spacing.two,
    alignItems: 'center',
    paddingTop: Spacing.three,
  },
  areaToque: {
    alignSelf: 'stretch',
    borderRadius: Radius.large,
  },
  pista: {
    width: LARGURA_CORDA + 40,
    height: 56,
    flexDirection: 'row',
    borderRadius: Radius.pill,
    overflow: 'hidden',
    alignItems: 'center',
  },
  lado: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
  ladoTexto: {
    color: '#F3FBF9',
  },
  marcaCentro: {
    position: 'absolute',
    left: (LARGURA_CORDA + 40) / 2 - 1,
    width: 2,
    height: '100%',
  },
  no: {
    position: 'absolute',
    left: (LARGURA_CORDA + 40) / 2 - 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTexto: {
    fontSize: 26,
    lineHeight: 30,
  },
  contagem: {
    fontSize: 48,
    lineHeight: 56,
    textAlign: 'center',
  },
});
