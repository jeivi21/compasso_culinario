import { StyleSheet, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = ViewProps & {
  /** Bordas da área segura a respeitar. Telas dentro das abas não precisam de `bottom`. */
  edges?: Edge[];
};

/** Contêiner padrão de tela: fundo do tema, área segura e largura máxima no web. */
export function Screen({ style, edges = ['top', 'left', 'right'], ...rest }: ScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor: theme.background }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
