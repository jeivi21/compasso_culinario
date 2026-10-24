import { useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { criarRng, embaralhar, pontuacao } from '@/games/rng';
import type { PropsJogo } from '@/games/tipos';
import { estilosJogo, Instrucao, PainelJogo } from '@/games/ui';

const RODADAS = 5;

/** Itens com preço de referência (R$) em Paulo Afonso/BA, 2026. */
const ITENS: { nome: string; emoji: string; preco: number }[] = [
  { nome: 'Prato feito com carne, arroz, feijão e salada', emoji: '🍛', preco: 18 },
  { nome: 'Marmita grande do self-service (por quilo, ~600 g)', emoji: '🥡', preco: 32 },
  { nome: 'X-tudo com batata', emoji: '🍔', preco: 25 },
  { nome: 'Pizza grande de calabresa', emoji: '🍕', preco: 55 },
  { nome: 'Rodízio de pizza por pessoa', emoji: '🍕', preco: 45 },
  { nome: 'Açaí de 500 ml com granola e leite em pó', emoji: '🍧', preco: 20 },
  { nome: 'Combo de 20 espetinhos para a mesa', emoji: '🍢', preco: 90 },
  { nome: 'Espetinho de carne', emoji: '🍢', preco: 6 },
  { nome: 'Rodízio de churrasco por pessoa', emoji: '🥩', preco: 75 },
  { nome: 'Combinado de sushi com 30 peças', emoji: '🍣', preco: 110 },
  { nome: 'Temaki de salmão', emoji: '🍣', preco: 28 },
  { nome: 'Pastel de carne na feira', emoji: '🥟', preco: 7 },
  { nome: 'Caldo de cana 500 ml', emoji: '🥤', preco: 6 },
  { nome: 'Cuscuz com ovo e queijo coalho', emoji: '🌽', preco: 12 },
  { nome: 'Tapioca de carne de sol com queijo', emoji: '🫓', preco: 16 },
  { nome: 'Bolo de rolo (fatia)', emoji: '🍰', preco: 9 },
  { nome: 'Cappuccino grande na cafeteria', emoji: '☕', preco: 14 },
  { nome: 'Pão de queijo e café coado', emoji: '🥐', preco: 9 },
  { nome: 'Chopp de 300 ml', emoji: '🍺', preco: 9 },
  { nome: 'Balde com 6 long necks', emoji: '🍻', preco: 60 },
  { nome: 'Caipirinha de limão', emoji: '🍹', preco: 15 },
  { nome: 'Porção de batata frita grande', emoji: '🍟', preco: 28 },
  { nome: 'Porção de carne de sol com macaxeira', emoji: '🥘', preco: 65 },
  { nome: 'Moqueca de peixe para 2 pessoas', emoji: '🐟', preco: 120 },
  { nome: 'Peixe frito com pirão (prato individual)', emoji: '🐟', preco: 42 },
  { nome: 'Galinha de capoeira para 3 pessoas', emoji: '🍗', preco: 95 },
  { nome: 'Sorvete de 2 bolas na casquinha', emoji: '🍦', preco: 10 },
  { nome: 'Milkshake 500 ml', emoji: '🥤', preco: 22 },
  { nome: 'Refrigerante 2 litros', emoji: '🥤', preco: 12 },
  { nome: 'Combo de hambúrguer, batata e refri', emoji: '🍔', preco: 38 },
];

/**
 * Chef do palpite: chute o preço de 5 itens. Placar da rodada = 100 × (1 − erro relativo),
 * limitado a 0. Placar final = média das rodadas.
 */
export function Palpite({ semente, onFim }: PropsJogo) {
  const theme = useTheme();
  const rodadas = useMemo(() => embaralhar(criarRng(semente), ITENS).slice(0, RODADAS), [semente]);
  const [indice, setIndice] = useState(0);
  const [chute, setChute] = useState('');
  const [resultado, setResultado] = useState<number | null>(null);
  const [placares, setPlacares] = useState<number[]>([]);
  const terminou = useRef(false);

  const item = rodadas[indice];
  const valorChute = Number(chute.replace(',', '.'));
  const chuteValido = chute.trim() !== '' && Number.isFinite(valorChute) && valorChute >= 0;

  function confirmar() {
    if (!chuteValido || resultado !== null) return;
    const erroRelativo = Math.abs(valorChute - item.preco) / item.preco;
    const placar = pontuacao(100 * (1 - Math.min(1, erroRelativo)));
    setResultado(placar);
    setPlacares((p) => [...p, placar]);
  }

  function proximo() {
    const novos = placares;
    if (indice + 1 >= RODADAS) {
      if (!terminou.current) {
        terminou.current = true;
        onFim(pontuacao(novos.reduce((s, p) => s + p, 0) / RODADAS));
      }
      return;
    }
    setIndice((i) => i + 1);
    setChute('');
    setResultado(null);
  }

  const media = placares.length ? placares.reduce((s, p) => s + p, 0) / placares.length : 0;

  return (
    <View style={estilosJogo.container}>
      <PainelJogo
        itens={[
          { label: 'Rodada', valor: `${indice + 1}/${RODADAS}` },
          { label: 'Média', valor: placares.length ? media.toFixed(0) : '–' },
        ]}
      />
      <Instrucao>Quanto custa, em reais? Quanto mais perto, mais pontos.</Instrucao>
      <View style={estilosJogo.area}>
        <View style={[styles.card, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
          <ThemedText style={styles.emoji}>{item.emoji}</ThemedText>
          <ThemedText type="subtitle" style={styles.nome}>
            {item.nome}
          </ThemedText>
          <View style={[styles.campo, { borderColor: resultado !== null ? theme.border : theme.primary }]}>
            <ThemedText type="subtitle" themeColor="textSecondary">
              R$
            </ThemedText>
            <TextInput
              value={chute}
              onChangeText={setChute}
              editable={resultado === null}
              keyboardType="decimal-pad"
              placeholder="0,00"
              placeholderTextColor={theme.textMuted}
              onSubmitEditing={confirmar}
              style={[styles.input, { color: theme.text }]}
            />
          </View>
          {resultado !== null ? (
            <View style={styles.resultado}>
              <ThemedText themeColor="textSecondary">Preço real: R$ {item.preco.toFixed(2).replace('.', ',')}</ThemedText>
              <ThemedText type="subtitle" themeColor="primaryDark">
                {resultado >= 90 ? 'Na mosca! ' : resultado >= 60 ? 'Perto: ' : 'Longe: '}
                {resultado.toFixed(0)} pts
              </ThemedText>
            </View>
          ) : null}
        </View>
        {resultado === null ? (
          <Button title="Confirmar" onPress={confirmar} disabled={!chuteValido} />
        ) : (
          <Button title={indice + 1 >= RODADAS ? 'Ver resultado' : 'Próximo'} onPress={proximo} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  emoji: {
    fontSize: 56,
    lineHeight: 66,
  },
  nome: {
    textAlign: 'center',
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    borderWidth: 2,
    borderRadius: Radius.small,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.display,
    fontSize: 28,
    paddingVertical: 10,
  },
  resultado: {
    alignItems: 'center',
    gap: Spacing.one,
  },
});
