import { useState, type Ref } from 'react';
import { Pressable, type PressableProps, type StyleProp, type View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Mola curta e firme: o toque "afunda" e volta sem balançar. */
const MOLA = { damping: 18, stiffness: 420, mass: 0.6 };

export type TocavelProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((estado: { pressed: boolean }) => StyleProp<ViewStyle>);
  /** Escala enquanto pressionado. Cards grandes afundam menos que botões. */
  escala?: number;
  ref?: Ref<View>;
};

/**
 * Pressable que encolhe levemente ao toque. É o retorno visual de todos os elementos
 * tocáveis do app; com "reduzir movimento" ligado no sistema a mola é ignorada.
 */
export function Tocavel({ style, escala = 0.97, onPressIn, onPressOut, disabled, ref, ...rest }: TocavelProps) {
  const [pressed, setPressed] = useState(false);
  const s = useSharedValue(1);
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }] }));

  return (
    <AnimatedPressable
      ref={ref}
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        if (!disabled) s.set(withSpring(escala, MOLA));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        s.set(withSpring(1, MOLA));
        onPressOut?.(e);
      }}
      style={[typeof style === 'function' ? style({ pressed }) : style, animado]}
      {...rest}
    />
  );
}
