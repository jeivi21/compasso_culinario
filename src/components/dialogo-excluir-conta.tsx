import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ITENS_APAGADOS: { icone: keyof typeof Ionicons.glyphMap; texto: string }[] = [
  { icone: 'star-outline', texto: 'Suas avaliações' },
  { icone: 'heart-outline', texto: 'Favoritos e lista "Quero ir"' },
  { icone: 'people-outline', texto: 'Amizades' },
  { icone: 'flash-outline', texto: 'Duelos e placares' },
];

type Props = {
  visivel: boolean;
  excluindo: boolean;
  erro: string | null;
  aoCancelar: () => void;
  aoConfirmar: () => void;
};

/** Confirmação da exclusão definitiva da conta, no visual do app (o `Alert` nativo é cru). */
export function DialogoExcluirConta({ visivel, excluindo, erro, aoCancelar, aoConfirmar }: Props) {
  const theme = useTheme();
  // Enquanto a exclusão roda, não deixa fechar: o resultado precisa ser visto.
  const fechar = () => !excluindo && aoCancelar();

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={fechar}>
      <View style={[styles.fundo, { backgroundColor: theme.overlay }]}>
        {/* Toque fora fecha; irmão do cartão para não esconder os botões do leitor de tela. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={fechar} accessible={false} importantForAccessibility="no" />
        <Animated.View
          entering={ZoomIn.springify().damping(16)}
          accessibilityViewIsModal
          style={[styles.cartao, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
          <View style={[styles.selo, { backgroundColor: `${theme.danger}22` }]}>
            <Ionicons name="trash-outline" size={30} color={theme.danger} />
          </View>

          <View style={styles.cabecalho}>
            <ThemedText type="subtitle" accessibilityRole="header" style={styles.centro}>
              Excluir sua conta?
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.centro}>
              Isso apaga para sempre:
            </ThemedText>
          </View>

          <View style={[styles.lista, { backgroundColor: theme.backgroundElement }]}>
            {ITENS_APAGADOS.map((item) => (
              <View key={item.texto} style={styles.item}>
                <Ionicons name={item.icone} size={18} color={theme.textSecondary} />
                <ThemedText>{item.texto}</ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.aviso}>
            <Ionicons name="alert-circle" size={18} color={theme.danger} />
            <ThemedText type="small" style={[styles.flex, { color: theme.danger }]}>
              Essa ação não pode ser desfeita.
            </ThemedText>
          </View>

          {erro && (
            <Animated.View entering={FadeIn} accessibilityLiveRegion="polite">
              <ThemedText type="small" style={[styles.centro, { color: theme.danger }]}>
                {erro}
              </ThemedText>
            </Animated.View>
          )}

          <View style={styles.acoes}>
            <Button title="Excluir minha conta" variant="destructive" onPress={aoConfirmar} loading={excluindo} />
            <Button title="Cancelar" variant="ghost" onPress={aoCancelar} disabled={excluindo} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  cartao: {
    alignSelf: 'stretch',
    maxWidth: 420,
    marginHorizontal: 'auto',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  selo: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabecalho: {
    gap: Spacing.one,
  },
  centro: {
    textAlign: 'center',
  },
  lista: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  acoes: {
    gap: Spacing.one,
  },
  flex: {
    flexShrink: 1,
  },
});
