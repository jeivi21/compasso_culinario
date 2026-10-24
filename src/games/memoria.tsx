import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { criarRng, inteiro, pontuacao } from '@/games/rng';
import type { PropsJogo } from '@/games/tipos';
import { estilosJogo, Instrucao, PainelJogo } from '@/games/ui';

const MAX_NIVEL = 10;
const PONTOS_POR_NIVEL = 10;
const TEMPO_ACESO_MS = 450;
const TEMPO_APAGADO_MS = 200;

const INGREDIENTES = [
  { emoji: '🍋', cor: '#F2D94E', nome: 'Limão' },
  { emoji: '🍅', cor: '#E8604C', nome: 'Tomate' },
  { emoji: '🥬', cor: '#5FBF6B', nome: 'Alface' },
  { emoji: '🫐', cor: '#5B7FD6', nome: 'Mirtilo' },
];

type Fase = 'mostrando' | 'repetindo' | 'fim';

/**
 * Memória de sabores: a receita acende ingredientes em sequência; repita na ordem.
 * A cada acerto a sequência cresce. Placar = 10 pontos por nível completado (máx. 100).
 */
export function Memoria({ semente, onFim }: PropsJogo) {
  const theme = useTheme();
  // Sequência inteira pré-gerada pela semente: igual para os dois jogadores.
  const sequencia = useMemo(() => {
    const rng = criarRng(semente);
    return Array.from({ length: MAX_NIVEL }, () => inteiro(rng, 0, INGREDIENTES.length - 1));
  }, [semente]);

  const [nivel, setNivel] = useState(1);
  const [fase, setFase] = useState<Fase>('mostrando');
  const [aceso, setAceso] = useState<number | null>(null);
  const [passo, setPasso] = useState(0);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const terminou = useRef(false);

  // Mostra os `nivel` primeiros ingredientes, um por vez.
  useEffect(() => {
    if (fase !== 'mostrando') return;
    let i = 0;
    let cancelado = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    function mostrarProximo() {
      if (cancelado) return;
      if (i >= nivel) {
        timeouts.push(setTimeout(() => !cancelado && setFase('repetindo'), TEMPO_APAGADO_MS));
        return;
      }
      setAceso(sequencia[i]);
      timeouts.push(
        setTimeout(() => {
          setAceso(null);
          i += 1;
          timeouts.push(setTimeout(mostrarProximo, TEMPO_APAGADO_MS));
        }, TEMPO_ACESO_MS),
      );
    }
    timeouts.push(setTimeout(mostrarProximo, 500));
    return () => {
      cancelado = true;
      timeouts.forEach(clearTimeout);
    };
  }, [fase, nivel, sequencia]);

  function finalizar(niveisCompletos: number, texto: string) {
    if (terminou.current) return;
    terminou.current = true;
    setFase('fim');
    setMensagem(texto);
    setTimeout(() => onFim(pontuacao(niveisCompletos * PONTOS_POR_NIVEL)), 900);
  }

  function tocar(i: number) {
    if (fase !== 'repetindo') return;
    setAceso(i);
    setTimeout(() => setAceso(null), 180);
    if (i !== sequencia[passo]) {
      finalizar(nivel - 1, `Errou! Era ${INGREDIENTES[sequencia[passo]].emoji}. Você completou ${nivel - 1} nível${nivel - 1 === 1 ? '' : 'is'}.`);
      return;
    }
    if (passo + 1 < nivel) {
      setPasso((p) => p + 1);
      return;
    }
    // Nível completo.
    if (nivel >= MAX_NIVEL) {
      finalizar(MAX_NIVEL, 'Receita completa! Memória de chef.');
      return;
    }
    setPasso(0);
    setNivel((n) => n + 1);
    setFase('mostrando');
  }

  return (
    <View style={estilosJogo.container}>
      <PainelJogo
        itens={[
          { label: 'Nível', valor: `${nivel}/${MAX_NIVEL}` },
          { label: 'Pontos', valor: String((nivel - 1) * PONTOS_POR_NIVEL) },
        ]}
      />
      <Instrucao>
        {fase === 'mostrando' ? 'Observe a receita…' : fase === 'repetindo' ? `Repita a ordem (${passo + 1}/${nivel})` : (mensagem ?? '')}
      </Instrucao>
      <View style={estilosJogo.area}>
        <View style={styles.grade}>
          {INGREDIENTES.map((ing, i) => (
            <Pressable
              key={ing.nome}
              accessibilityRole="button"
              accessibilityLabel={ing.nome}
              disabled={fase !== 'repetindo'}
              onPress={() => tocar(i)}
              style={[
                styles.pad,
                {
                  backgroundColor: ing.cor,
                  opacity: aceso === i ? 1 : fase === 'repetindo' ? 0.55 : 0.35,
                  borderColor: aceso === i ? theme.text : 'transparent',
                  transform: [{ scale: aceso === i ? 1.06 : 1 }],
                },
              ]}>
              <ThemedText style={styles.emoji}>{ing.emoji}</ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grade: {
    width: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    justifyContent: 'center',
  },
  pad: {
    width: 130,
    height: 130,
    borderRadius: Radius.large,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 52,
    lineHeight: 62,
  },
});
