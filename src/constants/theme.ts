/**
 * Identidade visual do CompassoCulinário: paleta verde-água, fontes e espaçamentos.
 * As cores existem em modo claro e escuro; use `useTheme()` para ler o tema atual.
 */

export const Colors = {
  light: {
    text: '#0E2E2B',
    textSecondary: '#3F5F5B',
    textMuted: '#6F8F8A',
    background: '#F3FBF9',
    backgroundElement: '#DDF2EE',
    backgroundCard: '#FAFFFE',
    border: '#A8D5CE',
    primary: '#2EC4B6',
    primaryDark: '#0B7A70',
    onPrimary: '#0E2E2B',
    danger: '#B23A48',
    star: '#F2B705',
  },
  dark: {
    text: '#F3FBF9',
    textSecondary: '#CDE9E4',
    textMuted: '#8FB5AF',
    background: '#0E2E2B',
    backgroundElement: '#173F3B',
    backgroundCard: '#1C4945',
    border: '#2A5C57',
    primary: '#2EC4B6',
    primaryDark: '#7FE0D4',
    onPrimary: '#0E2E2B',
    danger: '#F28B82',
    star: '#F2B705',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Theme = (typeof Colors)[keyof typeof Colors];

/** Nomes registrados em `useFonts` no layout raiz. */
export const Fonts = {
  display: 'Fredoka_600SemiBold',
  displayMedium: 'Fredoka_500Medium',
  body: 'NunitoSans_400Regular',
  bodySemiBold: 'NunitoSans_600SemiBold',
  bodyBold: 'NunitoSans_700Bold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 24,
  pill: 999,
} as const;

export const MaxContentWidth = 800;
