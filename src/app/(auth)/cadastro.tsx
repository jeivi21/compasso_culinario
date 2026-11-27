import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AuthHeader } from '@/components/auth-header';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import {
  traduzirErroAuth,
  validarConfirmacaoSenha,
  validarEmail,
  validarNome,
  validarSenha,
} from '@/lib/validation';

type Erros = Partial<Record<'nome' | 'email' | 'senha' | 'confirmacao', string | null>>;

export default function CadastroScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const senhaRef = useRef<TextInput>(null);
  const confirmacaoRef = useRef<TextInput>(null);

  async function cadastrar() {
    if (enviando) return; // evita dois signUp com Enter repetido
    const novosErros: Erros = {
      nome: validarNome(nome),
      email: validarEmail(email),
      senha: validarSenha(senha),
      confirmacao: validarConfirmacaoSenha(senha, confirmacao),
    };
    setErros(novosErros);
    setErroGeral(null);
    if (Object.values(novosErros).some(Boolean)) return;

    setEnviando(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      // Lido pelo trigger do banco para preencher public.usuario.nome
      options: { data: { nome: nome.trim() } },
    });
    setEnviando(false);

    if (error) {
      setErroGeral(traduzirErroAuth(error.message));
      return;
    }
    // Com confirmação de e-mail ligada, não há sessão ainda: orientamos o usuário.
    if (!data.session) {
      router.replace({ pathname: '/confirmar-email', params: { email: email.trim() } });
    }
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      {/* Apps Expo são edge-to-edge: a janela não encolhe com o teclado, então o padding é preciso nas duas plataformas. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthHeader title="Criar conta" subtitle="Leva menos de um minuto." />

          <View style={styles.form}>
            <TextField
              label="Nome"
              value={nome}
              onChangeText={setNome}
              error={erros.nome}
              placeholder="Como quer ser chamado"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            <TextField
              ref={emailRef}
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              error={erros.email}
              placeholder="voce@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => senhaRef.current?.focus()}
            />
            <TextField
              ref={senhaRef}
              label="Senha"
              value={senha}
              onChangeText={setSenha}
              error={erros.senha}
              placeholder="Mínimo de 8 caracteres"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => confirmacaoRef.current?.focus()}
            />
            <TextField
              ref={confirmacaoRef}
              label="Confirmar senha"
              value={confirmacao}
              onChangeText={setConfirmacao}
              error={erros.confirmacao}
              placeholder="Repita a senha"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={cadastrar}
            />
            {erroGeral ? (
              <ThemedText themeColor="danger" style={styles.erroGeral}>
                {erroGeral}
              </ThemedText>
            ) : null}
            <Button title="Criar conta" onPress={cadastrar} loading={enviando} />
          </View>

          <View style={styles.footer}>
            <ThemedText themeColor="textSecondary">Já tem conta?</ThemedText>
            <Link href="/login" replace>
              <ThemedText type="link">Entrar</ThemedText>
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
