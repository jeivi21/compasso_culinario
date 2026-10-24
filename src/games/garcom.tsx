import { Accelerometer, type AccelerometerMeasurement } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { pontuacao } from '@/games/rng';
import type { PropsJogo } from '@/games/tipos';
import { estilosJogo, Instrucao, PainelJogo } from '@/games/ui';

const DURACAO_S = 20;
const RAIO_BANDEJA = 120;
const RAIO_PRATO = 22;
const PENALIDADE_POR_QUEDA = 15;
const INTERVALO_MS = 40;

/**
 * Garçom equilibrista: incline o celular para manter o prato sobre a bandeja.
 * O acelerômetro empurra o prato; se ele passar da borda, cai e volta ao centro.
 * Placar = 100 − 15 por queda.
 */
export function Garcom({ onFim }: PropsJogo) {
  const theme = useTheme();
  const [disponivel, setDisponivel] = useState<boolean | null>(null);
  const [restante, setRestante] = useState(DURACAO_S);
  const [quedas, setQuedas] = useState(0);
  const [posicao, setPosicao] = useState({ x: 0, y: 0 });

  const fisica = useRef({ x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0 });
  const terminou = useRef(false);

  // Sensor: guarda só a última leitura; a física roda no intervalo fixo abaixo.
  useEffect(() => {
    let inscricao: { remove: () => void } | undefined;
    let cancelado = false;
    Accelerometer.isAvailableAsync().then((ok) => {
      if (cancelado) return;
      setDisponivel(ok);
      if (!ok) return;
      Accelerometer.setUpdateInterval(INTERVALO_MS);
      inscricao = Accelerometer.addListener((m: AccelerometerMeasurement) => {
        // Celular em pé: x inclina para os lados, y para frente/trás.
        fisica.current.ax = m.x;
        fisica.current.ay = -m.y;
      });
    });
    return () => {
      cancelado = true;
      inscricao?.remove();
    };
  }, []);

  // Laço de física e cronômetro.
  useEffect(() => {
    if (!disponivel) return;
    const inicio = Date.now();
    const id = setInterval(() => {
      const f = fisica.current;
      f.vx = (f.vx + f.ax * 1.6) * 0.98;
      f.vy = (f.vy + f.ay * 1.6) * 0.98;
      f.x += f.vx;
      f.y += f.vy;
      const dist = Math.hypot(f.x, f.y);
      if (dist > RAIO_BANDEJA - RAIO_PRATO / 2) {
        f.x = 0;
        f.y = 0;
        f.vx = 0;
        f.vy = 0;
        setQuedas((q) => q + 1);
      }
      setPosicao({ x: f.x, y: f.y });

      const passados = (Date.now() - inicio) / 1000;
      const sobra = Math.max(0, Math.ceil(DURACAO_S - passados));
      setRestante(sobra);
      if (passados >= DURACAO_S && !terminou.current) {
        terminou.current = true;
        clearInterval(id);
        setQuedas((q) => {
          onFim(pontuacao(100 - q * PENALIDADE_POR_QUEDA));
          return q;
        });
      }
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [disponivel, onFim]);

  if (disponivel === false) {
    return (
      <View style={estilosJogo.area}>
        <ThemedText type="subtitle" style={styles.centro}>
          Sem sensor de movimento
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centro}>
          Este jogo precisa do acelerômetro do celular. Encerre para registrar 0 pontos.
        </ThemedText>
        <Button
          title="Encerrar"
          variant="secondary"
          onPress={() => {
            if (terminou.current) return;
            terminou.current = true;
            onFim(0);
          }}
        />
      </View>
    );
  }

  return (
    <View style={estilosJogo.container}>
      <PainelJogo
        itens={[
          { label: 'Tempo', valor: `${restante}s` },
          { label: 'Quedas', valor: String(quedas) },
        ]}
      />
      <Instrucao>Incline o celular devagar e mantenha o prato na bandeja.</Instrucao>
      <View style={estilosJogo.area}>
        <View style={[styles.bandeja, { borderColor: theme.primary, backgroundColor: theme.backgroundElement }]}>
          <View
            style={[
              styles.prato,
              {
                backgroundColor: theme.backgroundCard,
                borderColor: theme.primaryDark,
                transform: [{ translateX: posicao.x }, { translateY: posicao.y }],
              },
            ]}>
            <ThemedText style={styles.emoji}>🍽️</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bandeja: {
    width: RAIO_BANDEJA * 2,
    height: RAIO_BANDEJA * 2,
    borderRadius: RAIO_BANDEJA,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prato: {
    width: RAIO_PRATO * 2,
    height: RAIO_PRATO * 2,
    borderRadius: RAIO_PRATO,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  centro: {
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
});
