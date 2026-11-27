import { anguloMaisProximo, pontoCardeal, rumo } from '@/lib/rumo';

const centro = { latitude: -9.4064, longitude: -38.2154 };

describe('rumo', () => {
  it('aponta para os pontos cardeais', () => {
    expect(rumo(centro, { latitude: -9.3, longitude: -38.2154 })).toBeCloseTo(0, 0);
    expect(rumo(centro, { latitude: -9.4064, longitude: -38.1 })).toBeCloseTo(90, 0);
    expect(rumo(centro, { latitude: -9.5, longitude: -38.2154 })).toBeCloseTo(180, 0);
    expect(rumo(centro, { latitude: -9.4064, longitude: -38.3 })).toBeCloseTo(270, 0);
  });

  it('fica sempre entre 0 e 360', () => {
    const r = rumo(centro, { latitude: -9.41, longitude: -38.22 });
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(360);
  });
});

describe('anguloMaisProximo', () => {
  it('vai pelo caminho curto ao cruzar o norte', () => {
    expect(anguloMaisProximo(350, 10)).toBe(370);
    expect(anguloMaisProximo(10, 350)).toBe(-10);
  });
  it('mantém voltas acumuladas', () => {
    expect(anguloMaisProximo(720, 90)).toBe(810);
  });
});

describe('pontoCardeal', () => {
  it('arredonda para o ponto mais próximo', () => {
    expect(pontoCardeal(0)).toBe('norte');
    expect(pontoCardeal(44)).toBe('nordeste');
    expect(pontoCardeal(359)).toBe('norte');
    expect(pontoCardeal(-90)).toBe('oeste');
  });
});
