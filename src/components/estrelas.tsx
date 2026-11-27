import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View, type AccessibilityActionEvent } from 'react-native';

import { IconePulsante } from '@/components/icone-pulsante';
import { MinTouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatarNota } from '@/lib/formatacao';

type EstrelasProps = {
  valor: number;
  tamanho?: number;
  /** Quando informado, as estrelas viram um seletor de 1 a 5. */
  onChange?: (valor: number) => void;
  /** O que está sendo avaliado (ex.: "Comida"); lido pelo leitor de tela. */
  rotulo?: string;
};

const ACOES = [{ name: 'increment' as const }, { name: 'decrement' as const }];

/** Cinco estrelas, só leitura ou como seletor de nota. */
export function Estrelas({ valor, tamanho = 18, onChange, rotulo }: EstrelasProps) {
  const theme = useTheme();
  const arredondado = Math.round(valor);

  const icones = [1, 2, 3, 4, 5].map((n) => {
    const cheia = n <= arredondado;
    // No seletor, a estrela tocada (a última cheia) dá um pulo; na leitura ficam paradas.
    return onChange ? (
      <IconePulsante
        key={n}
        ativo={n === arredondado}
        pico={1.35}
        name={cheia ? 'star' : 'star-outline'}
        size={tamanho}
        color={cheia ? theme.star : theme.textMuted}
      />
    ) : (
      <Ionicons
        key={n}
        name={cheia ? 'star' : 'star-outline'}
        size={tamanho}
        color={cheia ? theme.star : theme.textMuted}
      />
    );
  });

  if (!onChange) {
    return (
      <View
        style={[styles.linha, styles.leitura]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${rotulo ? `${rotulo}: ` : ''}nota ${formatarNota(valor)} de 5`}>
        {icones}
      </View>
    );
  }

  function aoAcessar(e: AccessibilityActionEvent) {
    if (!onChange) return;
    if (e.nativeEvent.actionName === 'increment') onChange(Math.min(5, arredondado + 1));
    if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(1, arredondado - 1));
  }

  // Para leitores de tela é um único controle ajustável (deslizar para cima/baixo);
  // para o toque, cada estrela é um alvo de 44pt sem sobreposição.
  return (
    <View
      style={styles.linha}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={rotulo ?? 'Nota'}
      accessibilityValue={{
        min: 0,
        max: 5,
        now: arredondado,
        text: arredondado ? `${arredondado} de 5 estrelas` : 'sem nota',
      }}
      accessibilityActions={ACOES}
      onAccessibilityAction={aoAcessar}>
      {icones.map((icone, i) => (
        <Pressable
          key={i}
          onPress={() => onChange(i + 1)}
          style={styles.alvo}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden>
          {icone}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leitura: {
    gap: 2,
  },
  alvo: {
    minWidth: MinTouchTarget,
    minHeight: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
