import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AuthHeader } from '@/components/auth-header';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { traduzirErroAuth, validarEmail, validarSenha } from '@/lib/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<{ email?: string | null; senha?: string | null }>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    if (enviando) return; // Enter repetido no teclado não dispara dois logins
    const novosErros = { email: validarEmail(email), senha: validarSenha(senha) };
    setErros(novosErros);
    setErroGeral(null);
    if (novosErros.email || novosErros.senha) return;

    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEnviando(false);
    if (error) {
      setErroGeral(traduzirErroAuth(error.message));
    }
    // Com sucesso, o AuthProvider recebe a sessão e o guard de rotas troca para as abas.
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthHeader title="Bem-vindo de volta" subtitle="Entre para ver suas recomendações." />

          <View style={styles.form}>
            <TextField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              error={erros.email}
              placeholder="voce@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <TextField
              label="Senha"
              value={senha}
              onChangeText={setSenha}
              error={erros.senha}
              placeholder="Sua senha"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              onSubmitEditing={entrar}
            />
            {erroGeral ? (
              <ThemedText themeColor="danger" style={styles.erroGeral}>
                {erroGeral}
              </ThemedText>
            ) : null}
            <Button title="Entrar" onPress={entrar} loading={enviando} />
          </View>

          <View style={styles.footer}>
            <ThemedText themeColor="textSecondary">Ainda não tem conta?</ThemedText>
            <Link href="/cadastro">
              <ThemedText type="link">Criar conta</ThemedText>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  form: {
    gap: Spacing.three,
  },
  erroGeral: {
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.five,
  },
});
