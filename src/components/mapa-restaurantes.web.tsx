import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import type { MapaRestaurantesProps } from '@/components/mapa-restaurantes';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** O react-native-maps não roda no web; aqui mostramos só um aviso. */
export function MapaRestaurantes({ restaurantes }: MapaRestaurantesProps) {
  const theme = useTheme();

  return (
    <View style={[styles.placeholder, { backgroundColor: theme.backgroundElement }]}>
      <Ionicons name="map-outline" size={48} color={theme.primary} />
      <ThemedText themeColor="textSecondary" style={styles.texto}>
        O mapa só está disponível no app. {restaurantes.length} restaurante(s) nesta área.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.medium,
  },
  texto: {
    textAlign: 'center',
  },
});
