import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AvatarProps = {
  nome: string;
  /** Diâmetro em pt. */
  tamanho?: number;
  /** `destaque`: fundo primário (perfil, amigo aceito). `suave`: fundo de elemento. */
  variante?: 'destaque' | 'suave';
  style?: StyleProp<ViewStyle>;
};

export function iniciais(nome: string): string {
  return (
    nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  );
}

/** Círculo com as iniciais do nome. Decorativo: o nome já aparece ao lado. */
export function Avatar({ nome, tamanho = 44, variante = 'suave', style }: AvatarProps) {
  const theme = useTheme();
  const destaque = variante === 'destaque';

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          backgroundColor: destaque ? theme.primary : theme.backgroundElement,
        },
        style,
      ]}>
      <ThemedText
        // O círculo tem tamanho fixo: limita o crescimento da fonte para não cortar.
        maxFontSizeMultiplier={1.2}
        style={{
          color: destaque ? theme.onPrimary : theme.primaryDark,
          fontFamily: Fonts.display,
          fontSize: Math.round(tamanho * 0.4),
          lineHeight: Math.round(tamanho * 0.5),
        }}>
        {iniciais(nome)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
