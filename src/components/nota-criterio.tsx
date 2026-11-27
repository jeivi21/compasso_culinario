import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatarNota } from '@/lib/restaurantes';

type NotaCriterioProps = {
  label: string;
  nota: number | null;
};

/** Linha "Comida ▇▇▇▇░ 4,2" usada no resumo de notas por critério. */
export function NotaCriterio({ label, nota }: NotaCriterioProps) {
  const theme = useTheme();
  const alvo = nota ? (Number(nota) / 5) * 100 : 0;
  // A barra cresce até a nota ao abrir a tela: mostra a comparação entre critérios.
  const largura = useSharedValue(0);
  useEffect(() => {
    largura.set(withDelay(150, withTiming(alvo, { duration: 650, easing: Easing.out(Easing.cubic) })));
  }, [alvo, largura]);
  const estiloBarra = useAnimatedStyle(() => ({ width: `${largura.get()}%` }));

  return (
    <View
      style={styles.linha}
      accessible
      accessibilityLabel={`${label}: ${nota ? `${formatarNota(nota)} de 5` : 'sem nota'}`}>
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
      <View style={[styles.trilho, { backgroundColor: theme.backgroundElement }]}>
        <Animated.View style={[styles.barra, { backgroundColor: theme.primaryDark }, estiloBarra]} />
      </View>
      <ThemedText type="bold" style={styles.valor}>
        {formatarNota(nota)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    // minWidth em vez de width: com fonte grande o rótulo cresce em vez de cortar.
    minWidth: 96,
  },
  trilho: {
    flex: 1,
    height: 10,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  barra: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  valor: {
    minWidth: 36,
    textAlign: 'right',
  },
});
