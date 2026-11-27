/**
 * Identidade visual do CompassoCulinário: paleta verde-água, fontes e espaçamentos.
 * As cores existem em modo claro e escuro; use `useTheme()` para ler o tema atual.
 */

export const Colors = {
  light: {
    text: '#0E2E2B',
    textSecondary: '#3F5F5B',
    textMuted: '#486C66',
    background: '#F3FBF9',
    backgroundElement: '#DDF2EE',
    backgroundCard: '#FAFFFE',
    /** Contorno decorativo de cards. */
    border: '#A8D5CE',
    /** Contorno de campos de entrada (≥ 3:1 com o fundo, WCAG 1.4.11). */
    borderStrong: '#5E8A83',
    primary: '#2EC4B6',
    primaryDark: '#097068',
    onPrimary: '#0E2E2B',
    danger: '#B23A48',
    onDanger: '#FFFFFF',
    star: '#A87A00',
    overlay: 'rgba(14, 46, 43, 0.55)',
  },
  dark: {
    text: '#F3FBF9',
    textSecondary: '#CDE9E4',
    textMuted: '#9CC3BD',
    background: '#0E2E2B',
    backgroundElement: '#173F3B',
    backgroundCard: '#1C4945',
    border: '#2A5C57',
    borderStrong: '#609E97',
    primary: '#2EC4B6',
    primaryDark: '#7FE0D4',
    onPrimary: '#0E2E2B',
    danger: '#F7A39C',
    onDanger: '#0E2E2B',
    star: '#F2B705',
    overlay: 'rgba(0, 0, 0, 0.6)',
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

/** Opacidade padrão de qualquer elemento tocável enquanto pressionado. */
export const PressedOpacity = 0.75;

/** Área mínima de toque (pt), conforme HIG/Material. */
export const MinTouchTarget = 44;
