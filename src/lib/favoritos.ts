import { supabase } from '@/lib/supabase';

export type TipoFavorito = 'favorito' | 'quero_ir';

export type Favorito = {
  id: string;
  restaurante_id: string;
  tipo: TipoFavorito;
  criado_em: string;
  restaurante: {
    nome: string;
    endereco: string | null;
    faixa_preco: number | null;
    categoria: { nome: string } | null;
  } | null;
};

/** Marcações do usuário para um restaurante (pode ter as duas). */
export async function buscarMarcacoes(usuarioId: string, restauranteId: string): Promise<Set<TipoFavorito>> {
  const { data, error } = await supabase
    .from('favorito')
    .select('tipo')
    .eq('usuario_id', usuarioId)
    .eq('restaurante_id', restauranteId);
  if (error) throw error;
  return new Set((data ?? []).map((f) => f.tipo as TipoFavorito));
}

/** Liga ou desliga uma marcação. Devolve o novo estado. */
export async function alternarMarcacao(
  usuarioId: string,
  restauranteId: string,
  tipo: TipoFavorito,
  marcadoAtualmente: boolean,
): Promise<boolean> {
  if (marcadoAtualmente) {
    const { error } = await supabase
      .from('favorito')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('restaurante_id', restauranteId)
      .eq('tipo', tipo);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase
    .from('favorito')
    .upsert({ usuario_id: usuarioId, restaurante_id: restauranteId, tipo }, { onConflict: 'usuario_id,restaurante_id,tipo' });
  if (error) throw error;
  return true;
}

export async function listarFavoritos(usuarioId: string, tipo: TipoFavorito): Promise<Favorito[]> {
  const { data, error } = await supabase
    .from('favorito')
    .select('id, restaurante_id, tipo, criado_em, restaurante(nome, endereco, faixa_preco, categoria(nome))')
    .eq('usuario_id', usuarioId)
    .eq('tipo', tipo)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Favorito[];
}

export async function removerFavorito(id: string) {
  const { error } = await supabase.from('favorito').delete().eq('id', id);
  if (error) throw error;
}
