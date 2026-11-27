import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Tocavel } from '@/components/tocavel';
import { Fonts, MinTouchTarget, PressedOpacity, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /**
   * Papel para leitores de tela: `radio` (escolha única), `checkbox` (várias),
   * `tab` (abas). Padrão: `button`.
   */
  role?: 'button' | 'radio' | 'checkbox' | 'tab';
  /** Rótulo falado quando o texto visível não basta (ex.: "$$"). */
  accessibilityLabel?: string;
};

/** Botão em formato de pílula, usado em filtros e seletores. */
export function Chip({ label, selected = false, onPress, role = 'button', accessibilityLabel }: ChipProps) {
  const theme = useTheme();
  const usaChecked = role === 'radio' || role === 'checkbox';

  return (
    <Tocavel
      escala={0.94}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={usaChecked ? { checked: selected } : { selected }}
      onPress={onPress}
      hitSlop={{ top: 2, bottom: 2 }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundCard,
          borderColor: selected ? theme.primary : theme.borderStrong,
          opacity: pressed ? PressedOpacity : 1,
        },
      ]}>
      {/* Ícone de seleção: a cor sozinha não basta para indicar o estado. */}
      {selected ? (
        <Animated.View entering={ZoomIn.springify().damping(14)}>
          <Ionicons name="checkmark" size={16} color={theme.onPrimary} />
        </Animated.View>
      ) : null}
      <ThemedText
        style={[
          styles.texto,
          { color: selected ? theme.onPrimary : theme.text, fontFamily: selected ? Fonts.bodyBold : Fonts.bodySemiBold },
        ]}>
        {label}
      </ThemedText>
    </Tocavel>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MinTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  texto: {
    fontSize: 14,
    lineHeight: 20,
  },
});
