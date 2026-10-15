/** Funções puras de formatação, sem dependência de Supabase ou Expo (testáveis isoladamente). */

export function formatarDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}

export function formatarFaixaPreco(faixa: number | null): string {
  if (!faixa) return '';
  return '$'.repeat(Math.min(4, Math.max(1, faixa)));
}

export function formatarNota(nota: number | null): string {
  if (nota == null || Number.isNaN(Number(nota))) return '–';
  return Number(nota).toFixed(1).replace('.', ',');
}

export function formatarData(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
