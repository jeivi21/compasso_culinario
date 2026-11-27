/** Cálculos de direção para a bússola. Funções puras (testáveis sem Expo). */

type Ponto = { latitude: number; longitude: number };

const RAD = Math.PI / 180;

/** Rumo inicial (azimute) de `de` até `para`, em graus a partir do norte, sentido horário (0–360). */
export function rumo(de: Ponto, para: Ponto): number {
  const φ1 = de.latitude * RAD;
  const φ2 = para.latitude * RAD;
  const Δλ = (para.longitude - de.longitude) * RAD;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

/**
 * Próximo ângulo equivalente a `alvo` pelo caminho mais curto a partir de `atual`.
 * Evita a agulha dar a volta inteira ao passar de 359° para 0°.
 */
export function anguloMaisProximo(atual: number, alvo: number): number {
  const diferenca = ((((alvo - atual) % 360) + 540) % 360) - 180;
  return atual + diferenca;
}

const PONTOS = ['norte', 'nordeste', 'leste', 'sudeste', 'sul', 'sudoeste', 'oeste', 'noroeste'];

/** Nome do ponto cardeal/colateral mais próximo (para leitores de tela). */
export function pontoCardeal(graus: number): string {
  return PONTOS[Math.round((((graus % 360) + 360) % 360) / 45) % 8];
}
