import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Perfil = { nome: string; email: string | null };

export default function PerfilScreen() {
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('usuario')
      .select('nome, email')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setPerfil(data));
  }, [session]);

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
  spacer: {
    flex: 1,
  },
});
