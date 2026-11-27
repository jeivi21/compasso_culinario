import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/button';
import { Estrelas } from '@/components/estrelas';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { confirmar } from '@/lib/confirmar';
import {
  atualizarAvaliacao,
  buscarMinhaAvaliacao,
  criarAvaliacao,
  excluirAvaliacao,
  type Avaliacao,
  type NotasAvaliacao,
} from '@/lib/restaurantes';

const CRITERIOS: { chave: keyof Omit<NotasAvaliacao, 'comentario'>; label: string; dica: string }[] = [
  { chave: 'comida', label: 'Comida', dica: 'Sabor, qualidade e apresentação' },
  { chave: 'atendimento', label: 'Atendimento', dica: 'Simpatia e rapidez' },
  { chave: 'preco', label: 'Preço', dica: 'Custo-benefício' },
  { chave: 'ambiente', label: 'Ambiente', dica: 'Conforto, limpeza e clima' },
];

const COMENTARIO_MAX = 500;

/** Volta para os detalhes; se a tela foi aberta direto por URL, não há histórico. */
function voltarParaDetalhes(restauranteId: string) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(`/restaurante/${restauranteId}`);
  }
}

export default function AvaliarScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { id: restauranteId } = useLocalSearchParams<{ id: string }>();
  const usuarioId = session?.user.id;
  // A tela tem cabeçalho: o KeyboardAvoidingView precisa descontar a altura dele.
  const alturaCabecalho = useHeaderHeight();

  const [existente, setExistente] = useState<Avaliacao | null | undefined>(undefined);
  const [notas, setNotas] = useState({ comida: 0, atendimento: 0, preco: 0, ambiente: 0 });
  const [comentario, setComentario] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // Carrega a avaliação já existente (modo edição) ou começa em branco (modo criação).
  useEffect(() => {
    if (!usuarioId) return;
    let ativo = true;
    buscarMinhaAvaliacao(usuarioId, restauranteId)
      .then((a) => {
        if (!ativo) return;
        setExistente(a);
        if (a) {
          setNotas({ comida: a.comida, atendimento: a.atendimento, preco: a.preco, ambiente: a.ambiente });
          setComentario(a.comentario ?? '');
        }
      })
      // Se a busca falhar, não abrimos como "nova": poderia duplicar uma avaliação já existente.
      .catch(() => ativo && setErroCarga('Não foi possível carregar sua avaliação. Verifique sua conexão.'));
    return () => {
      ativo = false;
    };
  }, [usuarioId, restauranteId, tentativa]);

  const faltando = CRITERIOS.filter((c) => notas[c.chave] === 0).map((c) => c.label);
  const notaGeral = (notas.comida + notas.atendimento + notas.preco + notas.ambiente) / 4;

  async function salvar() {
    if (!usuarioId) return;
    if (faltando.length > 0) {
      const msg = `Dê uma nota para: ${faltando.join(', ')}.`;
      setErro(msg);
      AccessibilityInfo.announceForAccessibility(msg);
      return;
    }
    setErro(null);
    setSalvando(true);
    const dados: NotasAvaliacao = { ...notas, comentario: comentario.trim() || null };
    try {
      if (existente) {
        await atualizarAvaliacao(existente.id, dados);
      } else {
        await criarAvaliacao(usuarioId, restauranteId, dados);
      }
      voltarParaDetalhes(restauranteId);
    } catch {
      setErro('Não foi possível salvar. Verifique sua conexão e tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  function excluir() {
    if (!existente) return;
    confirmar('Excluir avaliação', 'Sua avaliação deste restaurante será apagada.', 'Excluir', async () => {
      setExcluindo(true);
      try {
        await excluirAvaliacao(existente.id);
        voltarParaDetalhes(restauranteId);
      } catch {
        setErro('Não foi possível excluir. Tente de novo.');
        setExcluindo(false);
      }
    });
  }

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <Stack.Screen options={{ title: existente ? 'Editar avaliação' : 'Nova avaliação' }} />
      {erroCarga ? (
        <View style={styles.centro}>
          <ThemedText themeColor="textSecondary" style={styles.erro}>
            {erroCarga}
          </ThemedText>
          <Button
            title="Tentar de novo"
            variant="secondary"
            onPress={() => {
              setErroCarga(null);
              setTentativa((t) => t + 1);
            }}
          />
        </View>
      ) : existente === undefined ? (
        <View style={styles.centro}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={alturaCabecalho}>
          <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
            {CRITERIOS.map((c) => (
              <View key={c.chave} style={[styles.criterio, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                <View>
                  <ThemedText type="bold">{c.label}</ThemedText>
                  <ThemedText type="small" themeColor="textMuted">
                    {c.dica}
                  </ThemedText>
                </View>
                <Estrelas
                  valor={notas[c.chave]}
                  tamanho={30}
                  rotulo={c.label}
                  onChange={(v) => setNotas((n) => ({ ...n, [c.chave]: v }))}
                />
              </View>
            ))}

            <View style={[styles.resumo, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText themeColor="textSecondary">Nota geral</ThemedText>
              <ThemedText type="subtitle">
                {faltando.length > 0 ? '–' : notaGeral.toFixed(2).replace('.', ',')}
              </ThemedText>
            </View>

            <View style={styles.campo}>
              <ThemedText
                type="label"
                themeColor="textSecondary"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants">
                Comentário (opcional)
              </ThemedText>
              <TextInput
                value={comentario}
                onChangeText={(t) => setComentario(t.slice(0, COMENTARIO_MAX))}
                placeholder="Conte como foi sua experiência"
                accessibilityLabel="Comentário (opcional)"
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
                maxLength={COMENTARIO_MAX}
                style={[
                  styles.textarea,
                  { color: theme.text, backgroundColor: theme.backgroundCard, borderColor: theme.borderStrong },
                ]}
              />
              <ThemedText type="small" themeColor="textMuted" style={styles.contador}>
                {comentario.length}/{COMENTARIO_MAX}
              </ThemedText>
            </View>

            {erro ? (
              <ThemedText
                themeColor="danger"
                style={styles.erro}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite">
                {erro}
              </ThemedText>
            ) : null}

            <Button
              title={existente ? 'Salvar alterações' : 'Publicar avaliação'}
              onPress={salvar}
              loading={salvando}
              disabled={excluindo}
            />
            {existente ? (
              <Button
                title="Excluir avaliação"
                variant="danger"
                onPress={excluir}
                loading={excluindo}
                disabled={salvando}
                style={styles.excluir}
              />
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  flex: {
    flex: 1,
  },
  conteudo: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  criterio: {
    // Rótulo acima das estrelas: cabe em telas de 320pt e com fonte grande.
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  resumo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
  },
  campo: {
    gap: Spacing.two,
  },
  textarea: {
    fontFamily: Fonts.body,
    fontSize: 16,
    minHeight: 110,
    textAlignVertical: 'top',
    padding: Spacing.three,
    borderWidth: 2,
    borderRadius: Radius.small,
  },
  contador: {
    textAlign: 'right',
  },
  erro: {
    textAlign: 'center',
  },
  excluir: {
    marginTop: -Spacing.two,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
});
