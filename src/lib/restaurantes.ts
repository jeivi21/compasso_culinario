import { supabase } from '@/lib/supabase';

/** Linha devolvida pela função SQL `restaurantes_proximos`. */
export type RestauranteProximo = {
  id: string;
  nome: string;
  categoria_id: number | null;
  categoria: string | null;
  latitude: number;
  longitude: number;
  endereco: string | null;
  faixa_preco: number | null;
  distancia_m: number;
  total_avaliacoes: number;
  media_geral: number | null;
};

export async function buscarRestaurantesProximos(
  latitude: number,
  longitude: number,
  raioMetros: number,
): Promise<RestauranteProximo[]> {
  const { data, error } = await supabase.rpc('restaurantes_proximos', {
    lat: latitude,
    lng: longitude,
    raio_m: raioMetros,
  });
  if (error) throw error;
  return (data ?? []) as RestauranteProximo[];
}

export function formatarFaixaPreco(faixa: number | null): string {
  if (!faixa) return '';
  return '$'.repeat(Math.min(4, Math.max(1, faixa)));
}

export function formatarNota(nota: number | null): string {
  if (nota == null) return '–';
  return Number(nota).toFixed(1).replace('.', ',');
}
