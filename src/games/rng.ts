/**
 * Gerador pseudoaleatório determinístico (mulberry32). A mesma semente gera a
 * mesma sequência nos dois celulares, então os dois jogadores enfrentam as
 * mesmas rodadas.
 */
export function criarRng(semente: number) {
  let a = semente >>> 0;
  return function proximo(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inteiro em [min, max]. */
export function inteiro(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Embaralha uma cópia do array (Fisher-Yates). */
export function embaralhar<T>(rng: () => number, itens: T[]): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Limita um valor ao intervalo [0, 100] com duas casas. */
export function pontuacao(valor: number): number {
  return Math.round(Math.min(100, Math.max(0, valor)) * 100) / 100;
}
