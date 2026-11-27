import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type IconButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  /** Nome do ícone do Ionicons. */
  icon: keyof typeof Ionicons.glyphMap;
  /** Lido pelo leitor de tela; obrigatório porque o botão não tem texto. */
  accessibilityLabel: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  /** Mostra o fundo do tema (botão "preenchido"). */
  style?: StyleProp<ViewStyle>;
};

/** Botão só com ícone, com área de toque mínima de 44×44 e retorno visual ao pressionar. */
export function IconButton({
  icon,
  size = 22,
  color,
  backgroundColor,
  style,
  disabled,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: backgroundColor ?? 'transparent', opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
        style,
      ]}
      {...rest}>
      <Ionicons name={icon} size={size} color={color ?? theme.primaryDark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
