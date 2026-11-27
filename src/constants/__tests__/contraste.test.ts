import { Colors } from '@/constants/theme';

/** Luminância relativa sRGB (WCAG 2.x). */
function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const FUNDOS = ['background', 'backgroundCard', 'backgroundElement'] as const;

describe.each(['light', 'dark'] as const)('contraste do tema %s', (modo) => {
  const t = Colors[modo];

  it.each(['text', 'textSecondary', 'textMuted', 'primaryDark', 'danger'] as const)(
    '%s tem 4.5:1 em todos os fundos',
    (cor) => {
      for (const fundo of FUNDOS) expect(contraste(t[cor], t[fundo])).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('texto sobre botões primário e de perigo tem 4.5:1', () => {
    expect(contraste(t.onPrimary, t.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(t.onDanger, t.danger)).toBeGreaterThanOrEqual(4.5);
  });

  it('estrelas e contornos de campo têm 3:1 (componentes não textuais)', () => {
    for (const fundo of FUNDOS) expect(contraste(t.star, t[fundo])).toBeGreaterThanOrEqual(3);
    expect(contraste(t.borderStrong, t.backgroundCard)).toBeGreaterThanOrEqual(3);
  });
});
