import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { alternarMarcacao, buscarMarcacoes, type TipoFavorito } from '@/lib/favoritos';

type BotoesMarcacaoProps = {
  usuarioId: string;
  restauranteId: string;
  onErro?: (mensagem: string) => void;
};

const BOTOES: { tipo: TipoFavorito; label: string; ligado: 'heart' | 'bookmark'; desligado: 'heart-outline' | 'bookmark-outline' }[] = [
  { tipo: 'favorito', label: 'Favorito', ligado: 'heart', desligado: 'heart-outline' },
  { tipo: 'quero_ir', label: 'Quero ir', ligado: 'bookmark', desligado: 'bookmark-outline' },
];

/** Par de botões Favorito / Quero ir da tela de detalhes. */
export function BotoesMarcacao({ usuarioId, restauranteId, onErro }: BotoesMarcacaoProps) {
  const theme = useTheme();
  // `null` enquanto não carregou: os botões ficam desabilitados para não
  // desmarcar sem querer algo que já estava marcado.
  const [marcacoes, setMarcacoes] = useState<Set<TipoFavorito> | null>(null);
  const [ocupado, setOcupado] = useState<TipoFavorito | null>(null);

  useEffect(() => {
    let ativo = true;
    buscarMarcacoes(usuarioId, restauranteId)
      .then((m) => ativo && setMarcacoes(m))
      .catch(() => ativo && onErro?.('Não foi possível carregar seus favoritos.'));
    return () => {
      ativo = false;
    };
    // onErro é um setState do pai; estável entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId, restauranteId]);

  async function alternar(tipo: TipoFavorito) {
    if (!marcacoes) return;
    const marcado = marcacoes.has(tipo);
    setOcupado(tipo);
    try {
      const novo = await alternarMarcacao(usuarioId, restauranteId, tipo, marcado);
      setMarcacoes((m) => {
        const copia = new Set(m ?? []);
        if (novo) copia.add(tipo);
        else copia.delete(tipo);
        return copia;
      });
    } catch {
      onErro?.('Não foi possível salvar. Verifique sua conexão.');
    } finally {
      setOcupado(null);
    }
  }

  return (
    <View style={styles.linha}>
      {BOTOES.map((b) => {
        const marcado = marcacoes?.has(b.tipo) ?? false;
        return (
          <Pressable
            key={b.tipo}
            accessibilityRole="button"
            accessibilityState={{ selected: marcado, busy: ocupado === b.tipo }}
            disabled={ocupado !== null || marcacoes === null}
            onPress={() => alternar(b.tipo)}
            style={({ pressed }) => [
              styles.botao,
              {
                backgroundColor: marcado ? theme.backgroundElement : theme.backgroundCard,
                borderColor: marcado ? theme.primary : theme.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Ionicons name={marcado ? b.ligado : b.desligado} size={20} color={theme.primaryDark} />
            <ThemedText type="bold" themeColor="primaryDark">
              {b.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  botao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: 12,
    borderRadius: Radius.small,
    borderWidth: 2,
  },
});
