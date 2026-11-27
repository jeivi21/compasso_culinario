import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'bold' | 'title' | 'subtitle' | 'small' | 'label' | 'link';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  // O título da tela vira cabeçalho para leitores de tela (navegação por títulos).
  // Subtítulos e números grandes passam `accessibilityRole` explicitamente quando for o caso.
  const papel = type === 'title' ? 'header' : undefined;

  return (
    <Text
      accessibilityRole={papel}
      style={[
        { color: theme[themeColor ?? (type === 'link' ? 'primaryDark' : 'text')] },
        styles[type],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    lineHeight: 28,
  },
  small: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  // Rótulos e títulos de seção: Fredoka em frase normal (sem caixa alta espaçada).
  label: {
    fontFamily: Fonts.displayMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  link: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    lineHeight: 24,
  },
});
