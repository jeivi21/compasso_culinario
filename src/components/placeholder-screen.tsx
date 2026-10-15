import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PlaceholderScreenProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

/** Tela provisória usada enquanto a funcionalidade da aba não foi implementada. */
export function PlaceholderScreen({ title, description, icon }: PlaceholderScreenProps) {
  const theme = useTheme();

  return (
    <Screen>
      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>
      <View style={styles.body}>
        <Ionicons name={icon} size={64} color={theme.primary} />
        <ThemedText themeColor="textSecondary" style={styles.description}>
          {description}
        </ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingTop: Spacing.three,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  description: {
    textAlign: 'center',
  },
});
