import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { pontuacao } from '@/games/rng';
import type { PropsJogo } from '@/games/tipos';
import { estilosJogo, Instrucao, PainelJogo } from '@/games/ui';

const CORTES = 3;
const LARGURA = 280;
/** Velocidade angular por corte: cada corte fica mais rápido. */
const VELOCIDADES = [2.2, 3.0, 4.0];

/**
 * Fatia perfeita: a faca desliza de um lado ao outro; toque para cortar o mais
 * perto do centro da pizza. Placar = média da precisão dos 3 cortes.
 */
export function Fatia({ onFim }: PropsJogo) {
  const theme = useTheme();
  const [corte, setCorte] = useState(0);
  const [posicao, setPosicao] = useState(0.5); // 0 = esquerda, 1 = direita
  const [precisoes, setPrecisoes] = useState<number[]>([]);
  const [ultimo, setUltimo] = useState<number | null>(null);
  const [pausado, setPausado] = useState(false);
  const inicio = useRef(0);
  const terminou = useRef(false);

  useEffect(() => {
    if (pausado || corte >= CORTES) return;
    inicio.current = Date.now();
    const id = setInterval(() => {
      const t = (Date.now() - inicio.current) / 1000;
      setPosicao(0.5 + 0.5 * Math.sin(t * VELOCIDADES[corte]));
    }, 16);
    return () => clearInterval(id);
  }, [corte, pausado]);

  function cortar() {
    if (pausado || corte >= CORTES) return;
    const precisao = pontuacao(100 * (1 - Math.abs(posicao - 0.5) * 2));
    const novas = [...precisoes, precisao];
    setPrecisoes(novas);
    setUltimo(precisao);
    setPausado(true);
    setTimeout(() => {
      if (novas.length >= CORTES) {
        if (!terminou.current) {
          terminou.current = true;
          onFim(pontuacao(novas.reduce((s, p) => s + p, 0) / CORTES));
        }
        return;
      }
      setCorte(novas.length);
      setUltimo(null);
      setPausado(false);
    }, 900);
  }

  const x = posicao * LARGURA;
  const media = precisoes.length ? precisoes.reduce((s, p) => s + p, 0) / precisoes.length : 0;

  return (
    <View style={estilosJogo.container}>
      <PainelJogo
        itens={[
          { label: 'Corte', valor: `${Math.min(corte + 1, CORTES)}/${CORTES}` },
          { label: 'Precisão', valor: precisoes.length ? media.toFixed(0) : '–' },
        ]}
      />
      <Instrucao>Toque em qualquer lugar para cortar quando a faca passar pelo centro.</Instrucao>
      <Pressable style={estilosJogo.area} onPress={cortar} accessibilityRole="button" accessibilityLabel="Cortar">
        <View style={[styles.pista, { width: LARGURA + 24, backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.pizza, { backgroundColor: '#F2B705', borderColor: '#C9850A' }]}>
            <ThemedText style={styles.emoji}>🍕</ThemedText>
          </View>
          <View style={[styles.alvo, { backgroundColor: theme.primaryDark }]} />
          <View style={[styles.faca, { left: 12 + x - 2, backgroundColor: ultimo !== null ? theme.primary : theme.text }]} />
        </View>
        {ultimo !== null ? (
          <ThemedText type="subtitle" themeColor="primaryDark">
            {ultimo >= 90 ? 'Perfeito! ' : ultimo >= 70 ? 'Bom corte: ' : 'Torto: '}
            {ultimo.toFixed(0)}
          </ThemedText>
        ) : (
          <ThemedText themeColor="textMuted">{'🔪'}</ThemedText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pista: {
    height: 200,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pizza: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
    lineHeight: 76,
  },
  alvo: {
    position: 'absolute',
    width: 3,
    height: 200,
    opacity: 0.35,
  },
  faca: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: 200,
    borderRadius: 2,
  },
  spacer: {
    height: Spacing.three,
  },
});
