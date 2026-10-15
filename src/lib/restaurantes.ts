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

export type Restaurante = {
  id: string;
  nome: string;
  endereco: string | null;
  faixa_preco: number | null;
  telefone: string | null;
  latitude: number;
  longitude: number;
  fonte: 'osm' | 'manual';
  categoria: { nome: string; icone: string | null } | null;
};

export type ResumoNotas = {
  total_avaliacoes: number;
  media_geral: number | null;
  media_comida: number | null;
  media_atendimento: number | null;
  media_preco: number | null;
  media_ambiente: number | null;
};

export type Avaliacao = {
  id: string;
  usuario_id: string;
  restaurante_id: string;
  comida: number;
  atendimento: number;
  preco: number;
  ambiente: number;
  nota_geral: number;
  comentario: string | null;
  foto_url: string | null;
  criado_em: string;
  usuario: { nome: string } | null;
};

export type DetalhesRestaurante = {
  restaurante: Restaurante;
  resumo: ResumoNotas;
  avaliacoes: Avaliacao[];
};

const RESUMO_VAZIO: ResumoNotas = {
  total_avaliacoes: 0,
  media_geral: null,
  media_comida: null,
  media_atendimento: null,
  media_preco: null,
  media_ambiente: null,
};

export async function buscarDetalhesRestaurante(id: string): Promise<DetalhesRestaurante> {
  const [restaurante, resumo, avaliacoes] = await Promise.all([
    supabase
      .from('restaurante')
      .select('id, nome, endereco, faixa_preco, telefone, latitude, longitude, fonte, categoria(nome, icone)')
      .eq('id', id)
      .single(),
    supabase.from('restaurante_resumo').select('*').eq('restaurante_id', id).maybeSingle(),
    supabase
      .from('avaliacao')
      .select('*, usuario(nome)')
      .eq('restaurante_id', id)
      .order('criado_em', { ascending: false }),
  ]);
  if (restaurante.error) throw restaurante.error;
  if (resumo.error) throw resumo.error;
  if (avaliacoes.error) throw avaliacoes.error;
  return {
    restaurante: restaurante.data as unknown as Restaurante,
    resumo: (resumo.data as ResumoNotas | null) ?? RESUMO_VAZIO,
    avaliacoes: (avaliacoes.data ?? []) as unknown as Avaliacao[],
  };
}

export type NotasAvaliacao = {
  comida: number;
  atendimento: number;
  preco: number;
  ambiente: number;
  comentario: string | null;
};

/** Avaliação do usuário logado para um restaurante, ou `null` se ainda não avaliou. */
export async function buscarMinhaAvaliacao(usuarioId: string, restauranteId: string): Promise<Avaliacao | null> {
  const { data, error } = await supabase
    .from('avaliacao')
    .select('*, usuario(nome)')
    .eq('usuario_id', usuarioId)
    .eq('restaurante_id', restauranteId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Avaliacao | null;
}

export async function criarAvaliacao(usuarioId: string, restauranteId: string, notas: NotasAvaliacao) {
  const { error } = await supabase
    .from('avaliacao')
    .insert({ usuario_id: usuarioId, restaurante_id: restauranteId, ...notas });
  if (error) throw error;
}

export async function atualizarAvaliacao(id: string, notas: NotasAvaliacao) {
  const { error } = await supabase.from('avaliacao').update(notas).eq('id', id);
  if (error) throw error;
}

export async function excluirAvaliacao(id: string) {
  const { error } = await supabase.from('avaliacao').delete().eq('id', id);
  if (error) throw error;
}

/** Todas as avaliações do usuário, com o nome do restaurante, mais recentes primeiro. */
export async function buscarMinhasAvaliacoes(usuarioId: string): Promise<AvaliacaoComRestaurante[]> {
  const { data, error } = await supabase
    .from('avaliacao')
    .select('*, usuario(nome), restaurante(nome, categoria(nome))')
    .eq('usuario_id', usuarioId)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AvaliacaoComRestaurante[];
}

export type AvaliacaoComRestaurante = Avaliacao & {
  restaurante: { nome: string; categoria: { nome: string } | null } | null;
};

export type RestaurantePopular = {
  id: string;
  nome: string;
  categoria: string | null;
  faixa_preco: number | null;
  total_avaliacoes: number;
  media_geral: number | null;
};

/** Restaurantes com mais avaliações, usados no onboarding (lugares que o usuário provavelmente conhece). */
export async function buscarRestaurantesPopulares(limite = 12): Promise<RestaurantePopular[]> {
  const resumo = await supabase
    .from('restaurante_resumo')
    .select('restaurante_id, total_avaliacoes, media_geral')
    .order('total_avaliacoes', { ascending: false })
    .limit(limite);
  if (resumo.error) throw resumo.error;
  const ids = (resumo.data ?? []).map((r) => r.restaurante_id);
  if (ids.length === 0) return [];

  const restaurantes = await supabase
    .from('restaurante')
    .select('id, nome, faixa_preco, categoria(nome)')
    .in('id', ids);
  if (restaurantes.error) throw restaurantes.error;

  const porId = new Map(
    (restaurantes.data ?? []).map((r) => [
      r.id,
      r as unknown as { id: string; nome: string; faixa_preco: number | null; categoria: { nome: string } | null },
    ]),
  );
  return (resumo.data ?? []).flatMap((s) => {
    const r = porId.get(s.restaurante_id);
    if (!r) return [];
    return [
      {
        id: r.id,
        nome: r.nome,
        categoria: r.categoria?.nome ?? null,
        faixa_preco: r.faixa_preco,
        total_avaliacoes: s.total_avaliacoes,
        media_geral: s.media_geral,
      },
    ];
  });
}

/**
 * Avaliações rápidas do onboarding: uma nota só, replicada nos quatro critérios.
 * Usa upsert para o usuário poder refazer o onboarding sem duplicar.
 */
export async function salvarAvaliacoesRapidas(usuarioId: string, notas: { restauranteId: string; nota: number }[]) {
  if (notas.length === 0) return;
  const { error } = await supabase.from('avaliacao').upsert(
    notas.map((n) => ({
      usuario_id: usuarioId,
      restaurante_id: n.restauranteId,
      comida: n.nota,
      atendimento: n.nota,
      preco: n.nota,
      ambiente: n.nota,
    })),
    { onConflict: 'usuario_id,restaurante_id' },
  );
  if (error) throw error;
}

export type Categoria = { id: number; nome: string; icone: string | null };

export async function buscarCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase.from('categoria').select('id, nome, icone').order('nome');
  if (error) throw error;
  return data ?? [];
}

export type Filtros = {
  categoriaId: number | null;
  /** Faixas de preço aceitas (1–4); vazio = todas. */
  faixasPreco: number[];
};

export const FILTROS_VAZIOS: Filtros = { categoriaId: null, faixasPreco: [] };

/** Aplica os filtros de categoria e preço em memória (a busca por raio já veio do banco). */
export function aplicarFiltros(restaurantes: RestauranteProximo[], filtros: Filtros): RestauranteProximo[] {
  return restaurantes.filter((r) => {
    if (filtros.categoriaId !== null && r.categoria_id !== filtros.categoriaId) return false;
    if (filtros.faixasPreco.length > 0 && (r.faixa_preco === null || !filtros.faixasPreco.includes(r.faixa_preco))) {
      return false;
    }
    return true;
  });
}

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatarFaixaPreco(faixa: number | null): string {
  if (!faixa) return '';
  return '$'.repeat(Math.min(4, Math.max(1, faixa)));
}

export function formatarNota(nota: number | null): string {
  if (nota == null) return '–';
  return Number(nota).toFixed(1).replace('.', ',');
}
