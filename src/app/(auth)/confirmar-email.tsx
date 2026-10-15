import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { traduzirErroAuth } from '@/lib/validation';

export default function ConfirmarEmailScreen() {
  const theme = useTheme();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [reenviando, setReenviando] = useState(false);

  async function reenviar() {
    if (!email) return;
    setReenviando(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setReenviando(false);
    setMensagem(error ? traduzirErroAuth(error.message) : 'E-mail reenviado.');
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.content}>
        <Ionicons name="mail-open-outline" size={72} color={theme.primary} />
        <ThemedText type="title" style={styles.center}>
          Confirme seu e-mail
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          Enviamos um link de confirmação para{' '}
          <ThemedText type="bold">{email ?? 'seu e-mail'}</ThemedText>. Abra o link e depois volte
          aqui para entrar.
        </ThemedText>
        {mensagem ? (
          <ThemedText themeColor="primaryDark" style={styles.center}>
            {mensagem}
          </ThemedText>
        ) : null}
        <View style={styles.actions}>
          <Button title="Já confirmei, entrar" onPress={() => router.replace('/login')} />
          <Button title="Reenviar e-mail" variant="ghost" onPress={reenviar} loading={reenviando} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    paddingTop: Spacing.four,
  },
});
