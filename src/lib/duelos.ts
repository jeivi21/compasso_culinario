import type { RealtimeChannel } from '@supabase/supabase-js';

import type { UsuarioResumo } from '@/lib/amigos';
import { supabase } from '@/lib/supabase';

export type StatusDuelo = 'pendente' | 'em_andamento' | 'concluido' | 'recusado' | 'cancelado';

export type RestauranteDuelo = { id: string; nome: string; categoria: { nome: string } | null };

export type Duelo = {
  id: string;
  desafiante_id: string;
  desafiado_id: string;
  restaurante_desafiante_id: string;
  restaurante_desafiado_id: string | null;
  jogo: string | null;
  semente: number;
  status: StatusDuelo;
  placar_desafiante: number | null;
  placar_desafiado: number | null;
  vencedor_id: string | null;
  rodada: number;
  criado_em: string;
  atualizado_em: string;
  desafiante: UsuarioResumo | null;
  desafiado: UsuarioResumo | null;
  restaurante_desafiante: RestauranteDuelo | null;
  restaurante_desafiado: RestauranteDuelo | null;
};

const SELECT_DUELO =
  '*, ' +
  'desafiante:usuario!duelo_desafiante_id_fkey(id, nome, email), ' +
  'desafiado:usuario!duelo_desafiado_id_fkey(id, nome, email), ' +
  'restaurante_desafiante:restaurante!duelo_restaurante_desafiante_id_fkey(id, nome, categoria(nome)), ' +
  'restaurante_desafiado:restaurante!duelo_restaurante_desafiado_id_fkey(id, nome, categoria(nome))';

export async function listarDuelos(): Promise<Duelo[]> {
  const { data, error } = await supabase
    .from('duelo')
    .select(SELECT_DUELO)
    .order('atualizado_em', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Duelo[];
}

export async function buscarDuelo(id: string): Promise<Duelo> {
  const { data, error } = await supabase.from('duelo').select(SELECT_DUELO).eq('id', id).single();
  if (error) throw error;
  return data as unknown as Duelo;
}

export async function criarDuelo(meuId: string, desafiadoId: string, restauranteId: string): Promise<string> {
  const { data, error } = await supabase
    .from('duelo')
    .insert({ desafiante_id: meuId, desafiado_id: desafiadoId, restaurante_desafiante_id: restauranteId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function aceitarDuelo(dueloId: string, restauranteId: string) {
  const { error } = await supabase.rpc('aceitar_duelo', { p_duelo_id: dueloId, p_restaurante_id: restauranteId });
  if (error) throw error;
}

export async function recusarDuelo(dueloId: string) {
  const { error } = await supabase.from('duelo').update({ status: 'recusado' }).eq('id', dueloId);
  if (error) throw error;
}

export async function cancelarDuelo(dueloId: string) {
  const { error } = await supabase.from('duelo').update({ status: 'cancelado' }).eq('id', dueloId);
  if (error) throw error;
}

export async function registrarPlacar(dueloId: string, placar: number) {
  const { error } = await supabase.rpc('registrar_placar', {
    p_duelo_id: dueloId,
    p_placar: Math.round(placar * 100) / 100,
  });
  if (error) throw error;
}

/** Ouve mudanças do duelo em tempo real; devolve a função de cancelar a inscrição. */
export function ouvirDuelo(dueloId: string, aoMudar: () => void): () => void {
  const canal: RealtimeChannel = supabase
    .channel(`duelo-${dueloId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'duelo', filter: `id=eq.${dueloId}` }, aoMudar)
    .subscribe();
  return () => {
    supabase.removeChannel(canal);
  };
}

/** Lado do usuário logado no duelo. */
export function meuLado(d: Duelo, meuId: string): 'desafiante' | 'desafiado' {
  return d.desafiante_id === meuId ? 'desafiante' : 'desafiado';
}

export function meuPlacar(d: Duelo, meuId: string): number | null {
  return meuLado(d, meuId) === 'desafiante' ? d.placar_desafiante : d.placar_desafiado;
}

export function placarAdversario(d: Duelo, meuId: string): number | null {
  return meuLado(d, meuId) === 'desafiante' ? d.placar_desafiado : d.placar_desafiante;
}

export function adversario(d: Duelo, meuId: string): UsuarioResumo | null {
  return meuLado(d, meuId) === 'desafiante' ? d.desafiado : d.desafiante;
}

export function traduzirErroDuelo(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes('row-level security') || m.includes('policy')) return 'Você só pode desafiar amigos.';
  if (m.includes('já jogou')) return 'Você já jogou esta rodada.';
  if (m.includes('diferente do seu adversário')) return 'Escolha um restaurante diferente do do seu adversário.';
  if (m.includes('não está mais pendente') || m.includes('não está em andamento')) {
    return 'Este duelo mudou de estado. Atualize a tela.';
  }
  return 'Não foi possível concluir. Verifique sua conexão.';
}
