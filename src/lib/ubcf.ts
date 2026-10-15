/**
 * Filtragem Colaborativa baseada em usuários (User-Based Collaborative Filtering).
 *
 * Módulo puro, sem dependência de React ou Supabase, para ser testado isoladamente.
 *
 * Passos:
 *  1. Matriz usuário × item a partir das avaliações.
 *  2. Similaridade de Pearson entre o usuário-alvo e cada outro usuário,
 *     calculada só sobre os itens que ambos avaliaram.
 *  3. Os k vizinhos mais parecidos (similaridade positiva) preveem a nota
 *     dos itens que o alvo ainda não avaliou:
 *       previsão(u,i) = média(u) + Σ sim(u,v)·(nota(v,i) − média(v)) / Σ |sim(u,v)|
 *  4. Quem chama combina a previsão com a distância para o ranking final.
 */

export type AvaliacaoUBCF = {
  usuarioId: string;
  itemId: string;
  nota: number;
};

export type Vizinho = {
  usuarioId: string;
  similaridade: number;
  /** Quantos itens o vizinho e o alvo avaliaram em comum. */
  itensEmComum: number;
};

export type Previsao = {
  itemId: string;
  notaPrevista: number;
  /** Vizinhos que avaliaram este item, do mais parecido ao menos. */
  vizinhos: { usuarioId: string; similaridade: number; nota: number }[];
};

export type OpcoesUBCF = {
  /** Número máximo de vizinhos considerados. */
  k?: number;
  /** Mínimo de itens em comum para a similaridade valer. */
  minItensEmComum?: number;
};

type MatrizUsuarios = Map<string, Map<string, number>>;

export function montarMatriz(avaliacoes: AvaliacaoUBCF[]): MatrizUsuarios {
  const matriz: MatrizUsuarios = new Map();
  for (const a of avaliacoes) {
    let itens = matriz.get(a.usuarioId);
    if (!itens) {
      itens = new Map();
      matriz.set(a.usuarioId, itens);
    }
    itens.set(a.itemId, a.nota);
  }
  return matriz;
}

export function mediaUsuario(itens: Map<string, number>): number {
  if (itens.size === 0) return 0;
  let soma = 0;
  for (const nota of itens.values()) soma += nota;
  return soma / itens.size;
}

/**
 * Correlação de Pearson sobre os itens em comum. Devolve 0 quando há poucos
 * itens em comum ou quando um dos lados não varia (desvio zero).
 * A similaridade é encolhida por min(n, 5)/5 para que poucos itens em comum
 * não gerem vizinhos "perfeitos" por acaso.
 */
export function similaridadePearson(
  a: Map<string, number>,
  b: Map<string, number>,
  minItensEmComum = 2,
): { similaridade: number; itensEmComum: number } {
  const comuns: string[] = [];
  for (const item of a.keys()) if (b.has(item)) comuns.push(item);
  if (comuns.length < minItensEmComum) return { similaridade: 0, itensEmComum: comuns.length };

  const mediaA = comuns.reduce((s, i) => s + (a.get(i) as number), 0) / comuns.length;
  const mediaB = comuns.reduce((s, i) => s + (b.get(i) as number), 0) / comuns.length;

  let numerador = 0;
  let somaA2 = 0;
  let somaB2 = 0;
  for (const item of comuns) {
    const da = (a.get(item) as number) - mediaA;
    const db = (b.get(item) as number) - mediaB;
    numerador += da * db;
    somaA2 += da * da;
    somaB2 += db * db;
  }
  if (somaA2 === 0 || somaB2 === 0) return { similaridade: 0, itensEmComum: comuns.length };

  const pearson = numerador / Math.sqrt(somaA2 * somaB2);
  const encolhimento = Math.min(comuns.length, 5) / 5;
  return { similaridade: pearson * encolhimento, itensEmComum: comuns.length };
}

/** Vizinhos do usuário-alvo com similaridade positiva, do mais parecido ao menos. */
export function encontrarVizinhos(
  matriz: MatrizUsuarios,
  usuarioId: string,
  { k = 10, minItensEmComum = 2 }: OpcoesUBCF = {},
): Vizinho[] {
  const alvo = matriz.get(usuarioId);
  if (!alvo) return [];
  const vizinhos: Vizinho[] = [];
  for (const [outroId, itens] of matriz) {
    if (outroId === usuarioId) continue;
    const { similaridade, itensEmComum } = similaridadePearson(alvo, itens, minItensEmComum);
    if (similaridade > 0) vizinhos.push({ usuarioId: outroId, similaridade, itensEmComum });
  }
  return vizinhos.sort((x, y) => y.similaridade - x.similaridade).slice(0, k);
}

/**
 * Prevê a nota do usuário-alvo para cada item que ele ainda não avaliou e que
 * pelo menos um vizinho avaliou. Notas ficam entre 1 e 5.
 */
export function preverNotas(matriz: MatrizUsuarios, usuarioId: string, opcoes: OpcoesUBCF = {}): Previsao[] {
  const alvo = matriz.get(usuarioId);
  if (!alvo) return [];
  const vizinhos = encontrarVizinhos(matriz, usuarioId, opcoes);
  if (vizinhos.length === 0) return [];

  const mediaAlvo = mediaUsuario(alvo);
  const mediasVizinhos = new Map(vizinhos.map((v) => [v.usuarioId, mediaUsuario(matriz.get(v.usuarioId)!)]));

  const candidatos = new Set<string>();
  for (const v of vizinhos) {
    for (const item of matriz.get(v.usuarioId)!.keys()) {
      if (!alvo.has(item)) candidatos.add(item);
    }
  }

  const previsoes: Previsao[] = [];
  for (const itemId of candidatos) {
    let numerador = 0;
    let denominador = 0;
    const contribuintes: Previsao['vizinhos'] = [];
    for (const v of vizinhos) {
      const nota = matriz.get(v.usuarioId)!.get(itemId);
      if (nota === undefined) continue;
      numerador += v.similaridade * (nota - (mediasVizinhos.get(v.usuarioId) as number));
      denominador += Math.abs(v.similaridade);
      contribuintes.push({ usuarioId: v.usuarioId, similaridade: v.similaridade, nota });
    }
    if (denominador === 0) continue;
    const bruta = mediaAlvo + numerador / denominador;
    previsoes.push({
      itemId,
      notaPrevista: Math.min(5, Math.max(1, bruta)),
      vizinhos: contribuintes,
    });
  }
  return previsoes.sort((x, y) => y.notaPrevista - x.notaPrevista);
}

/**
 * Média bayesiana usada no fallback (usuário novo ou sem vizinhos):
 * puxa itens com poucas avaliações para a média global, evitando que um
 * único 5 vença um restaurante com trinta notas 4,5.
 */
export function mediaBayesiana(soma: number, quantidade: number, mediaGlobal: number, peso = 5): number {
  return (soma + peso * mediaGlobal) / (quantidade + peso);
}

/**
 * Score final entre 0 e 1: combina a nota (1–5, normalizada) com a proximidade.
 * Distâncias além de `distanciaMaxima` contam como proximidade zero.
 */
export function scoreFinal(
  nota: number,
  distanciaMetros: number,
  { pesoNota = 0.75, distanciaMaxima = 10_000 }: { pesoNota?: number; distanciaMaxima?: number } = {},
): number {
  const notaNormalizada = (nota - 1) / 4;
  const proximidade = 1 - Math.min(distanciaMetros, distanciaMaxima) / distanciaMaxima;
  return pesoNota * notaNormalizada + (1 - pesoNota) * proximidade;
}
