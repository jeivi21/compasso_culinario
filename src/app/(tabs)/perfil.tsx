import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

export default function PerfilScreen() {
  const theme = useTheme();
  const { session, perfil, signOut } = useAuth();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    await signOut();
    // O guard de rotas leva de volta para o login.
  }

  return (
    <Screen>
      <ThemedText type="title" style={styles.title}>
        Perfil
      </ThemedText>
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Ionicons name="person" size={36} color={theme.onPrimary} />
        </View>
        <ThemedText type="subtitle">{perfil?.nome ?? '…'}</ThemedText>
        <ThemedText themeColor="textSecondary">{perfil?.email ?? session?.user.email}</ThemedText>
      </View>
      <View style={styles.menu}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/minhas-avaliacoes')}
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: theme.backgroundCard, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Ionicons name="star-outline" size={22} color={theme.primaryDark} />
          <ThemedText type="bold" style={styles.menuTexto}>
            Minhas avaliações
          </ThemedText>
          <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </Pressable>
      </View>
      <View style={styles.spacer} />
      <Button title="Sair" variant="secondary" onPress={sair} loading={saindo} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
  card: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.large,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  menu: {
    paddingTop: Spacing.four,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  menuTexto: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
});
