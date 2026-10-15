import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EstrelasProps = {
  valor: number;
  tamanho?: number;
  /** Quando informado, as estrelas viram um seletor de 1 a 5. */
  onChange?: (valor: number) => void;
};

/** Cinco estrelas, só leitura ou como seletor de nota. */
export function Estrelas({ valor, tamanho = 18, onChange }: EstrelasProps) {
  const theme = useTheme();

  return (
    <View style={styles.linha} accessibilityRole={onChange ? 'adjustable' : 'text'} accessibilityLabel={`${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const cheia = n <= Math.round(valor);
        const icone = (
          <Ionicons
            name={cheia ? 'star' : 'star-outline'}
            size={tamanho}
            color={cheia ? theme.star : theme.textMuted}
          />
        );
        return onChange ? (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={6} accessibilityLabel={`${n} estrelas`}>
            {icone}
          </Pressable>
        ) : (
          <View key={n}>{icone}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
});
