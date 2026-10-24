import { supabase } from '@/lib/supabase';

export type StatusAmizade = 'pendente' | 'aceita' | 'recusada';

export type UsuarioResumo = { id: string; nome: string; email: string | null };

export type Amizade = {
  id: string;
  solicitante_id: string;
  destinatario_id: string;
  status: StatusAmizade;
  criado_em: string;
  solicitante: UsuarioResumo | null;
  destinatario: UsuarioResumo | null;
};

/** Vínculo visto do ponto de vista do usuário logado. */
export type Vinculo = {
  amizadeId: string;
  status: StatusAmizade;
  /** `true` quando foi o usuário logado quem enviou o pedido. */
  enviadoPorMim: boolean;
  outro: UsuarioResumo;
};

const SELECT_AMIZADE =
  'id, solicitante_id, destinatario_id, status, criado_em, ' +
  'solicitante:usuario!amizade_solicitante_id_fkey(id, nome, email), ' +
  'destinatario:usuario!amizade_destinatario_id_fkey(id, nome, email)';

function paraVinculo(a: Amizade, meuId: string): Vinculo | null {
  const enviadoPorMim = a.solicitante_id === meuId;
  const outro = enviadoPorMim ? a.destinatario : a.solicitante;
  if (!outro) return null;
  return { amizadeId: a.id, status: a.status, enviadoPorMim, outro };
}

/** Todos os vínculos do usuário (amigos, pedidos recebidos e enviados). */
export async function listarVinculos(meuId: string): Promise<Vinculo[]> {
  const { data, error } = await supabase
    .from('amizade')
    .select(SELECT_AMIZADE)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as Amizade[]).flatMap((a) => {
    const v = paraVinculo(a, meuId);
    return v ? [v] : [];
  });
}

export async function buscarUsuarios(termo: string): Promise<UsuarioResumo[]> {
  const { data, error } = await supabase.rpc('buscar_usuarios', { termo });
  if (error) throw error;
  return (data ?? []) as UsuarioResumo[];
}

export async function enviarPedido(meuId: string, destinatarioId: string) {
  const { error } = await supabase
    .from('amizade')
    .insert({ solicitante_id: meuId, destinatario_id: destinatarioId });
  if (error) throw error;
}

export async function responderPedido(amizadeId: string, aceitar: boolean) {
  const { error } = await supabase
    .from('amizade')
    .update({ status: aceitar ? 'aceita' : 'recusada', respondido_em: new Date().toISOString() })
    .eq('id', amizadeId);
  if (error) throw error;
}

/** Cancela um pedido enviado, desfaz uma amizade ou apaga uma recusa (libera novo pedido). */
export async function removerVinculo(amizadeId: string) {
  const { error } = await supabase.from('amizade').delete().eq('id', amizadeId);
  if (error) throw error;
}

/** Traduz os erros mais prováveis ao enviar pedido. */
export function traduzirErroAmizade(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes('amizade_par_unico_idx') || m.includes('duplicate')) {
    return 'Já existe um pedido ou amizade com essa pessoa.';
  }
  return 'Não foi possível concluir. Verifique sua conexão.';
}
