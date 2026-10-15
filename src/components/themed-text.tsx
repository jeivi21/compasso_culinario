import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'bold' | 'title' | 'subtitle' | 'small' | 'label' | 'link';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
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
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  link: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    lineHeight: 24,
  },
});
