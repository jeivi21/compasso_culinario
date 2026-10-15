import {
  encontrarVizinhos,
  mediaBayesiana,
  mediaUsuario,
  montarMatriz,
  preverNotas,
  scoreFinal,
  similaridadePearson,
  type AvaliacaoUBCF,
} from '../ubcf';

function nota(usuarioId: string, itemId: string, valor: number): AvaliacaoUBCF {
  return { usuarioId, itemId, nota: valor };
}

// Ana e Bruno têm gosto parecido (curtem bar, não curtem café);
// Carla é o oposto. Diego avaliou pouco e não tem itens em comum com Ana.
const AVALIACOES: AvaliacaoUBCF[] = [
  nota('ana', 'bar1', 5), nota('ana', 'bar2', 4), nota('ana', 'cafe1', 2),
  nota('bruno', 'bar1', 5), nota('bruno', 'bar2', 4), nota('bruno', 'cafe1', 1), nota('bruno', 'bar3', 5), nota('bruno', 'cafe2', 2),
  nota('carla', 'bar1', 1), nota('carla', 'bar2', 2), nota('carla', 'cafe1', 5), nota('carla', 'bar3', 1), nota('carla', 'cafe2', 5),
  nota('diego', 'cafe2', 4),
];

describe('montarMatriz e mediaUsuario', () => {
  it('agrupa as notas por usuário e item', () => {
    const matriz = montarMatriz(AVALIACOES);
    expect(matriz.size).toBe(4);
    expect(matriz.get('ana')?.get('bar1')).toBe(5);
    expect(mediaUsuario(matriz.get('ana')!)).toBeCloseTo((5 + 4 + 2) / 3);
  });

  it('média de um usuário sem avaliações é 0', () => {
    expect(mediaUsuario(new Map())).toBe(0);
  });
});

describe('similaridadePearson', () => {
  const matriz = montarMatriz(AVALIACOES);

  it('é positiva para gostos parecidos e negativa para opostos', () => {
    const anaBruno = similaridadePearson(matriz.get('ana')!, matriz.get('bruno')!);
    const anaCarla = similaridadePearson(matriz.get('ana')!, matriz.get('carla')!);
    expect(anaBruno.similaridade).toBeGreaterThan(0.5);
    expect(anaCarla.similaridade).toBeLessThan(-0.5);
    expect(anaBruno.itensEmComum).toBe(3);
  });

  it('é 0 sem itens em comum suficientes', () => {
    const { similaridade, itensEmComum } = similaridadePearson(matriz.get('ana')!, matriz.get('diego')!);
    expect(similaridade).toBe(0);
    expect(itensEmComum).toBe(0);
  });

  it('é 0 quando um dos usuários dá sempre a mesma nota (sem variância)', () => {
    const a = new Map([['x', 3], ['y', 3], ['z', 3]]);
    const b = new Map([['x', 1], ['y', 5], ['z', 3]]);
    expect(similaridadePearson(a, b).similaridade).toBe(0);
  });

  it('encolhe a similaridade quando há poucos itens em comum', () => {
    // Correlação perfeita em 2 itens vale 2/5 = 0,4; em 5 itens vale 1.
    const a2 = new Map([['x', 1], ['y', 5]]);
    const b2 = new Map([['x', 2], ['y', 4]]);
    expect(similaridadePearson(a2, b2).similaridade).toBeCloseTo(0.4);
    const a5 = new Map([['a', 1], ['b', 2], ['c', 3], ['d', 4], ['e', 5]]);
    const b5 = new Map([['a', 2], ['b', 3], ['c', 4], ['d', 5], ['e', 6]]);
    expect(similaridadePearson(a5, b5).similaridade).toBeCloseTo(1);
  });
});

describe('encontrarVizinhos', () => {
  const matriz = montarMatriz(AVALIACOES);

  it('devolve só similaridades positivas, ordenadas', () => {
    const vizinhos = encontrarVizinhos(matriz, 'ana');
    expect(vizinhos.map((v) => v.usuarioId)).toEqual(['bruno']);
  });

  it('respeita o k', () => {
    const muitos: AvaliacaoUBCF[] = [...AVALIACOES];
    for (let i = 0; i < 20; i++) {
      muitos.push(nota(`u${i}`, 'bar1', 5), nota(`u${i}`, 'bar2', 4), nota(`u${i}`, 'cafe1', 2));
    }
    expect(encontrarVizinhos(montarMatriz(muitos), 'ana', { k: 3 })).toHaveLength(3);
  });

  it('usuário desconhecido não tem vizinhos', () => {
    expect(encontrarVizinhos(matriz, 'ninguem')).toEqual([]);
  });
});

describe('preverNotas', () => {
  const matriz = montarMatriz(AVALIACOES);

  it('prevê nota alta para o bar e baixa para o café que Ana não avaliou', () => {
    const previsoes = preverNotas(matriz, 'ana');
    const porItem = Object.fromEntries(previsoes.map((p) => [p.itemId, p.notaPrevista]));
    expect(porItem.bar3).toBeGreaterThan(4);
    expect(porItem.cafe2).toBeLessThan(2.5);
  });

  it('não prevê itens que o usuário já avaliou', () => {
    const itens = preverNotas(matriz, 'ana').map((p) => p.itemId);
    expect(itens).not.toContain('bar1');
    expect(itens).not.toContain('cafe1');
  });

  it('ordena da maior para a menor nota prevista e informa os vizinhos', () => {
    const previsoes = preverNotas(matriz, 'ana');
    expect(previsoes[0].notaPrevista).toBeGreaterThanOrEqual(previsoes[previsoes.length - 1].notaPrevista);
    expect(previsoes[0].vizinhos[0].usuarioId).toBe('bruno');
  });

  it('mantém a previsão entre 1 e 5', () => {
    const extremos = montarMatriz([
      nota('alvo', 'a', 5), nota('alvo', 'b', 5), nota('alvo', 'c', 4),
      nota('viz', 'a', 1), nota('viz', 'b', 1), nota('viz', 'c', 0.5), nota('viz', 'novo', 5),
    ]);
    for (const p of preverNotas(extremos, 'alvo')) {
      expect(p.notaPrevista).toBeGreaterThanOrEqual(1);
      expect(p.notaPrevista).toBeLessThanOrEqual(5);
    }
  });

  it('sem vizinhos, não há previsões (cold start)', () => {
    expect(preverNotas(matriz, 'diego')).toEqual([]);
  });
});

describe('mediaBayesiana e scoreFinal', () => {
  it('puxa itens com poucas notas para a média global', () => {
    // Um único 5 com média global 3,2 fica bem abaixo de 5.
    expect(mediaBayesiana(5, 1, 3.2)).toBeLessThan(3.6);
    // Trinta notas 4,5 ficam perto de 4,5.
    expect(mediaBayesiana(4.5 * 30, 30, 3.2)).toBeGreaterThan(4.3);
  });

  it('score cresce com a nota e cai com a distância', () => {
    expect(scoreFinal(5, 0)).toBeCloseTo(1);
    expect(scoreFinal(1, 10_000)).toBeCloseTo(0);
    expect(scoreFinal(4, 500)).toBeGreaterThan(scoreFinal(4, 5000));
    expect(scoreFinal(4.5, 3000)).toBeGreaterThan(scoreFinal(3, 3000));
  });
});
