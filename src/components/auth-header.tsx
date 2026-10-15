import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type AuthHeaderProps = {
  title: string;
  subtitle?: string;
};

/** Cabeçalho das telas de entrada: bússola, nome do app e título da tela. */
export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/compass.svg')}
        style={styles.logo}
        accessibilityLabel="Bússola culinária, logo do CompassoCulinário"
      />
      <ThemedText type="subtitle" themeColor="primaryDark">
        CompassoCulinário
      </ThemedText>
      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: Spacing.two,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  subtitle: {
    textAlign: 'center',
  },
});
