import { criarRng, embaralhar, inteiro, pontuacao } from '../rng';

describe('rng determinístico', () => {
  it('mesma semente gera a mesma sequência', () => {
    const a = criarRng(42);
    const b = criarRng(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('sementes diferentes geram sequências diferentes', () => {
    const a = criarRng(1)();
    const b = criarRng(2)();
    expect(a).not.toBe(b);
  });

  it('valores ficam em [0, 1)', () => {
    const rng = criarRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('inteiro respeita os limites e embaralhar preserva os itens', () => {
    const rng = criarRng(3);
    for (let i = 0; i < 200; i++) {
      const n = inteiro(rng, 2, 5);
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(5);
    }
    const itens = [1, 2, 3, 4, 5];
    const misturado = embaralhar(criarRng(9), itens);
    expect([...misturado].sort()).toEqual(itens);
    expect(itens).toEqual([1, 2, 3, 4, 5]);
  });

  it('pontuacao limita a 0–100 com duas casas', () => {
    expect(pontuacao(-5)).toBe(0);
    expect(pontuacao(150)).toBe(100);
    expect(pontuacao(33.3333)).toBe(33.33);
  });
});
