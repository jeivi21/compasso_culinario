import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { criarRng, embaralhar, pontuacao } from '@/games/rng';
import type { PropsJogo } from '@/games/tipos';
import { estilosJogo, Instrucao, PainelJogo } from '@/games/ui';

const RODADAS = 5;
const PONTOS_MAX = 20;
const PONTOS_MIN_ACERTO = 4;

/** Pratos e comidas brasileiras com dica. */
const PRATOS: { nome: string; dica: string }[] = [
  { nome: 'FEIJOADA', dica: 'Feijão preto com carnes, prato de quarta e sábado' },
  { nome: 'MOQUECA', dica: 'Peixe no leite de coco e dendê' },
  { nome: 'ACARAJÉ', dica: 'Bolinho de feijão fradinho frito no dendê' },
  { nome: 'VATAPÁ', dica: 'Creme baiano de pão, camarão e amendoim' },
  { nome: 'BAIÃO', dica: 'Arroz com feijão verde e queijo coalho (… de dois)' },
  { nome: 'CUSCUZ', dica: 'Flocos de milho no vapor, café da manhã nordestino' },
  { nome: 'TAPIOCA', dica: 'Goma de mandioca na frigideira' },
  { nome: 'BRIGADEIRO', dica: 'Docinho de festa com granulado' },
  { nome: 'COXINHA', dica: 'Salgado de frango em formato de gota' },
  { nome: 'PAMONHA', dica: 'Milho verde cozido na própria palha' },
  { nome: 'CANJICA', dica: 'Milho branco doce com leite e canela' },
  { nome: 'QUINDIM', dica: 'Doce amarelo de gema e coco' },
  { nome: 'ESCONDIDINHO', dica: 'Carne de sol escondida sob purê de macaxeira' },
  { nome: 'BURITI', dica: 'Fruta do cerrado, doce e sorvete' },
  { nome: 'RAPADURA', dica: 'Bloco de açúcar de cana' },
  { nome: 'MUNGUNZÁ', dica: 'Como chamam a canjica no Nordeste' },
  { nome: 'SARAPATEL', dica: 'Miúdos de porco cozidos no sangue' },
  { nome: 'CARURU', dica: 'Quiabo com camarão seco' },
  { nome: 'PIRÃO', dica: 'Farinha de mandioca cozida no caldo do peixe' },
  { nome: 'BOBÓ', dica: 'Creme de aipim com camarão' },
  { nome: 'PASTEL', dica: 'Massa frita recheada, parceiro do caldo de cana' },
  { nome: 'EMPADA', dica: 'Tortinha de massa podre com recheio' },
  { nome: 'PAÇOCA', dica: 'Amendoim moído com açúcar e sal' },
  { nome: 'COCADA', dica: 'Doce de coco ralado' },
  { nome: 'GUARANÁ', dica: 'Refrigerante da fruta amazônica' },
];

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

/** Embaralha as letras garantindo que o resultado seja diferente da palavra. */
function embaralharLetras(rng: () => number, palavra: string): string {
  const letras = palavra.split('');
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const misturado = embaralhar(rng, letras).join('');
    if (misturado !== palavra) return misturado;
  }
  return letras.reverse().join('');
}

/**
 * Prato embaralhado: desembaralhe o nome de 5 pratos. Cada acerto vale 20 pontos
 * menos 1 por segundo (mínimo 4); pular ou errar vale 0.
 */
export function Anagrama({ semente, onFim }: PropsJogo) {
  const theme = useTheme();
  const rodadas = useMemo(() => {
    const rng = criarRng(semente);
    return embaralhar(rng, PRATOS)
      .slice(0, RODADAS)
      .map((p) => ({ ...p, embaralhado: embaralharLetras(rng, p.nome) }));
  }, [semente]);

  const [indice, setIndice] = useState(0);
  const [resposta, setResposta] = useState('');
  const [pontos, setPontos] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ texto: string; acertou: boolean } | null>(null);
  const [decorrido, setDecorrido] = useState(0);
  const inicio = useRef(0);
  const terminou = useRef(false);

  // Cada palavra nova reinicia o cronômetro.
  useEffect(() => {
    if (feedback) return;
    inicio.current = Date.now();
    const id = setInterval(() => setDecorrido((Date.now() - inicio.current) / 1000), 200);
    return () => clearInterval(id);
  }, [indice, feedback]);

  const rodada = rodadas[indice];

  function registrar(ganho: number, texto: string, acertou: boolean) {
    const novos = [...pontos, ganho];
    setPontos(novos);
    setFeedback({ texto, acertou });
    setTimeout(() => {
      if (novos.length >= RODADAS) {
        if (!terminou.current) {
          terminou.current = true;
          onFim(pontuacao(novos.reduce((s, p) => s + p, 0)));
        }
        return;
      }
      setIndice((i) => i + 1);
      setResposta('');
      setFeedback(null);
    }, 1200);
  }

  function confirmar() {
    if (feedback || !resposta.trim()) return;
    const segundos = (Date.now() - inicio.current) / 1000;
    if (normalizar(resposta) === normalizar(rodada.nome)) {
      const ganho = Math.max(PONTOS_MIN_ACERTO, PONTOS_MAX - segundos);
      registrar(ganho, `Isso! ${rodada.nome} (+${ganho.toFixed(0)})`, true);
    } else {
      registrar(0, `Era ${rodada.nome}.`, false);
    }
  }

  function pular() {
    if (feedback) return;
    registrar(0, `Era ${rodada.nome}.`, false);
  }

  const total = pontos.reduce((s, p) => s + p, 0);

  return (
    <View style={estilosJogo.container}>
      <PainelJogo
        itens={[
          { label: 'Palavra', valor: `${indice + 1}/${RODADAS}` },
          { label: 'Tempo', valor: `${decorrido.toFixed(0)}s` },
          { label: 'Pontos', valor: total.toFixed(0) },
        ]}
      />
      <Instrucao>Desembaralhe o nome do prato. Acentos não importam.</Instrucao>
      <View style={estilosJogo.area}>
        <View style={[styles.card, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
          <View style={styles.letras}>
            {rodada.embaralhado.split('').map((l, i) => (
              <View key={`${indice}-${i}`} style={[styles.letra, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="subtitle">{l}</ThemedText>
              </View>
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.dica}>
            Dica: {rodada.dica}
          </ThemedText>
          <TextInput
            value={resposta}
            onChangeText={setResposta}
            editable={!feedback}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="Sua resposta"
            placeholderTextColor={theme.textMuted}
            onSubmitEditing={confirmar}
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: feedback ? (feedback.acertou ? theme.primary : theme.danger) : theme.border,
              },
            ]}
          />
          {feedback ? (
            <ThemedText type="bold" themeColor={feedback.acertou ? 'primaryDark' : 'danger'} style={styles.dica}>
              {feedback.texto}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.botoes}>
          <Button title="Pular" variant="ghost" onPress={pular} disabled={!!feedback} style={styles.botao} />
          <Button title="Confirmar" onPress={confirmar} disabled={!!feedback || !resposta.trim()} style={styles.botao} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  letras: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  letra: {
    width: 34,
    height: 42,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dica: {
    textAlign: 'center',
  },
  input: {
    alignSelf: 'stretch',
    fontFamily: Fonts.display,
    fontSize: 24,
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderWidth: 2,
    borderRadius: Radius.small,
  },
  botoes: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  botao: {
    flex: 1,
  },
});
