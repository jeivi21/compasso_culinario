import type { Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  /** Permite focar o campo a partir do anterior (Enter = próximo). */
  ref?: Ref<TextInput>;
};

/** Campo de texto com rótulo e mensagem de erro, no estilo do app. */
export function TextField({ label, error, style, ref, ...rest }: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* O rótulo visível já é lido pelo próprio campo; evita leitura duplicada. */}
      <ThemedText
        type="label"
        themeColor="textSecondary"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        {label}
      </ThemedText>
      <TextInput
        ref={ref}
        accessibilityLabel={error ? `${label}. Erro: ${error}` : label}
        placeholderTextColor={theme.textMuted}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundCard,
            borderColor: error ? theme.danger : theme.borderStrong,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 2,
    minHeight: MinTouchTarget + Spacing.two,
    borderWidth: 2,
    borderRadius: Radius.small,
  },
});
