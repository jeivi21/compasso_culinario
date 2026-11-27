import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, type ComponentProps } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

type IconeProps = ComponentProps<typeof Ionicons> & {
  /** Quando passa de falso para verdadeiro, o ícone dá um pulo curto. */
  ativo: boolean;
  /** Escala do pico do pulo. */
  pico?: number;
  /** Escala mantida enquanto ativo (ex.: aba focada um pouco maior). */
  repouso?: number;
};

/**
 * Ícone que responde à mudança de estado (marcar favorito, escolher estrela, focar aba).
 * Não anima na montagem: só quando o próprio usuário liga o estado.
 */
export function IconePulsante({ ativo, pico = 1.3, repouso = 1, style, ...icone }: IconeProps) {
  const escala = useSharedValue(ativo ? repouso : 1);
  const anterior = useRef(ativo);

  useEffect(() => {
    if (ativo === anterior.current) return;
    anterior.current = ativo;
    escala.set(ativo
      ? withSequence(withSpring(pico, { damping: 8, stiffness: 500 }), withSpring(repouso, { damping: 12, stiffness: 300 }))
      : withSpring(1, { damping: 14, stiffness: 300 }));
  }, [ativo, pico, repouso, escala]);

  const animado = useAnimatedStyle(() => ({ transform: [{ scale: escala.get() }] }));

  return (
    <Animated.View style={animado}>
      <Ionicons style={style} {...icone} />
    </Animated.View>
  );
}
