import { supabase } from '@/lib/supabase';

export type EstatisticasPerfil = {
  avaliacoes: number;
  mediaDada: number | null;
  favoritos: number;
  queroIr: number;
  amigos: number;
  duelosJogados: number;
  duelosVencidos: number;
  /** Categoria mais avaliada pelo usuário, com a média que ele dá nela. */
  categoriaFavorita: { nome: string; quantidade: number; media: number } | null;
  membroDesde: string | null;
};

export async function buscarEstatisticas(usuarioId: string): Promise<EstatisticasPerfil> {
  const [avaliacoes, favoritos, amizades, duelos, usuario] = await Promise.all([
    supabase.from('avaliacao').select('nota_geral, restaurante(categoria(nome))').eq('usuario_id', usuarioId),
    supabase.from('favorito').select('tipo').eq('usuario_id', usuarioId),
    supabase.from('amizade').select('id').eq('status', 'aceita'),
    supabase.from('duelo').select('vencedor_id').eq('status', 'concluido'),
    supabase.from('usuario').select('criado_em').eq('id', usuarioId).maybeSingle(),
  ]);
  for (const r of [avaliacoes, favoritos, amizades, duelos, usuario]) {
    if (r.error) throw r.error;
  }

  const notas = (avaliacoes.data ?? []) as unknown as {
    nota_geral: number;
    restaurante: { categoria: { nome: string } | null } | null;
  }[];
  const porCategoria = new Map<string, { quantidade: number; soma: number }>();
  for (const a of notas) {
    const nome = a.restaurante?.categoria?.nome;
    if (!nome) continue;
    const atual = porCategoria.get(nome) ?? { quantidade: 0, soma: 0 };
    porCategoria.set(nome, { quantidade: atual.quantidade + 1, soma: atual.soma + Number(a.nota_geral) });
  }
  let categoriaFavorita: EstatisticasPerfil['categoriaFavorita'] = null;
  for (const [nome, { quantidade, soma }] of porCategoria) {
    if (!categoriaFavorita || quantidade > categoriaFavorita.quantidade) {
      categoriaFavorita = { nome, quantidade, media: soma / quantidade };
    }
  }

  const tipos = (favoritos.data ?? []) as { tipo: string }[];
  const concluidos = (duelos.data ?? []) as { vencedor_id: string | null }[];

  return {
    avaliacoes: notas.length,
    mediaDada: notas.length ? notas.reduce((s, a) => s + Number(a.nota_geral), 0) / notas.length : null,
    favoritos: tipos.filter((f) => f.tipo === 'favorito').length,
    queroIr: tipos.filter((f) => f.tipo === 'quero_ir').length,
    amigos: amizades.data?.length ?? 0,
    duelosJogados: concluidos.length,
    duelosVencidos: concluidos.filter((d) => d.vencedor_id === usuarioId).length,
    categoriaFavorita,
    membroDesde: usuario.data?.criado_em ?? null,
  };
}

export async function atualizarNome(usuarioId: string, nome: string) {
  const { error } = await supabase.from('usuario').update({ nome: nome.trim() }).eq('id', usuarioId);
  if (error) throw error;
}
