import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { criarRng, embaralhar, inteiro, pontuacao } from '@/games/rng';
import type { PropsJogo } from '@/games/tipos';
import { estilosJogo, Instrucao, PainelJogo } from '@/games/ui';

const RODADAS = 5;
const LADO = 5;
const PONTOS_POR_RODADA = 20;
const PENALIDADE_ERRO_S = 1.5;

/** Pares de emojis parecidos: o primeiro preenche a grade, o segundo é o intruso. */
const PARES: [string, string][] = [
  ['🍪', '🥮'],
  ['🍇', '🫐'],
  ['🥐', '🥖'],
  ['🍦', '🍧'],
  ['🥑', '🥝'],
  ['🍒', '🍓'],
  ['🧁', '🍰'],
  ['🍊', '🍑'],
  ['🍔', '🍟'],
  ['🌮', '🌯'],
  ['🍜', '🍲'],
  ['🥟', '🥠'],
];

/**
 * Caça ao intruso: numa grade 5×5 de emojis iguais há um diferente. Toque nele.
 * Cada rodada vale 20 pontos menos 2 por segundo (mínimo 2); erro soma 1,5 s.
 */
export function Intruso({ semente, onFim }: PropsJogo) {
  const theme = useTheme();
  const rodadas = useMemo(() => {
    const rng = criarRng(semente);
    return embaralhar(rng, PARES)
      .slice(0, RODADAS)
      .map(([comum, intruso]) => ({ comum, intruso, posicao: inteiro(rng, 0, LADO * LADO - 1) }));
  }, [semente]);

  const [indice, setIndice] = useState(0);
  const [pontos, setPontos] = useState<number[]>([]);
  const [erros, setErros] = useState(0);
  const [decorrido, setDecorrido] = useState(0);
  const [piscando, setPiscando] = useState<number | null>(null);
  const inicio = useRef(0);
  const penalidade = useRef(0);
  const terminou = useRef(false);

  // Cada rodada reinicia o cronômetro; `decorrido` já inclui as penalidades.
  useEffect(() => {
    inicio.current = Date.now();
    penalidade.current = 0;
    const id = setInterval(() => setDecorrido((Date.now() - inicio.current) / 1000 + penalidade.current), 100);
    return () => clearInterval(id);
  }, [indice]);

  const rodada = rodadas[indice];

  function tocar(i: number) {
    if (terminou.current) return;
    if (i !== rodada.posicao) {
      penalidade.current += PENALIDADE_ERRO_S;
      setErros((e) => e + 1);
      setPiscando(i);
      setTimeout(() => setPiscando(null), 250);
      return;
    }
    const ganho = Math.max(2, PONTOS_POR_RODADA - decorrido * 2);
    const novos = [...pontos, ganho];
    setPontos(novos);
    if (novos.length >= RODADAS) {
      terminou.current = true;
      onFim(pontuacao(novos.reduce((s, p) => s + p, 0)));
      return;
    }
    setIndice((x) => x + 1);
  }

  const total = pontos.reduce((s, p) => s + p, 0);

  return (
    <View style={estilosJogo.container}>
      <PainelJogo
        itens={[
          { label: 'Rodada', valor: `${indice + 1}/${RODADAS}` },
          { label: 'Tempo', valor: `${decorrido.toFixed(1)}s` },
          { label: 'Pontos', valor: total.toFixed(0) },
        ]}
      />
      <Instrucao>{`Ache o ${rodada.intruso} escondido entre os ${rodada.comum}. Rápido!`}</Instrucao>
      <View style={estilosJogo.area}>
        <View style={[styles.grade, { backgroundColor: theme.backgroundElement }]}>
          {Array.from({ length: LADO * LADO }, (_, i) => (
            <Pressable
              key={`${indice}-${i}`}
              accessibilityRole="button"
              accessibilityLabel={i === rodada.posicao ? 'Intruso' : 'Comum'}
              onPress={() => tocar(i)}
              style={[
                styles.celula,
                { backgroundColor: piscando === i ? theme.danger : theme.backgroundCard },
              ]}>
              <ThemedText style={styles.emoji}>{i === rodada.posicao ? rodada.intruso : rodada.comum}</ThemedText>
            </Pressable>
          ))}
        </View>
        {erros > 0 ? (
          <ThemedText type="small" themeColor="textMuted">
            {erros} erro{erros > 1 ? 's' : ''} (+{PENALIDADE_ERRO_S}s cada)
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const TAMANHO_CELULA = 54;

const styles = StyleSheet.create({
  grade: {
    width: TAMANHO_CELULA * LADO + Spacing.two * (LADO + 1),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.large,
  },
  celula: {
    width: TAMANHO_CELULA,
    height: TAMANHO_CELULA,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
    lineHeight: 34,
  },
});
