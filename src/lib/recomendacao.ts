import { supabase } from '@/lib/supabase';
import { buscarRestaurantesProximos, type RestauranteProximo } from '@/lib/restaurantes';
import { mediaBayesiana, montarMatriz, preverNotas, scoreFinal, type AvaliacaoUBCF } from '@/lib/ubcf';

export type Recomendacao = {
  restaurante: RestauranteProximo;
  score: number;
  /** Nota que o modelo prevê que o usuário daria (1–5). */
  notaPrevista: number;
  explicacao:
    | { tipo: 'ubcf'; vizinhos: { nome: string; similaridade: number; nota: number }[] }
    | { tipo: 'popular' };
};

export type ResultadoRecomendacao = {
  recomendacoes: Recomendacao[];
  /** `ubcf` quando houve vizinhos; `popular` no cold start (usuário novo ou sem vizinhos). */
  modo: 'ubcf' | 'popular';
  totalAvaliacoesDoUsuario: number;
};

/** Abaixo disso o usuário é tratado como novo e recebe o ranking por popularidade. */
const MIN_AVALIACOES_PARA_UBCF = 3;
const RAIO_METROS = 10_000;
const LIMITE = 20;

/**
 * Gera recomendações para o usuário:
 *  - carrega todas as avaliações (a matriz usuário × restaurante) e os
 *    restaurantes próximos com distância;
 *  - roda o UBCF; se não houver previsões, cai para popularidade;
 *  - combina nota e distância no score final e ordena.
 */
export async function recomendar(
  usuarioId: string,
  latitude: number,
  longitude: number,
): Promise<ResultadoRecomendacao> {
  const [avaliacoesRes, proximos, usuariosRes] = await Promise.all([
    supabase.from('avaliacao').select('usuario_id, restaurante_id, nota_geral'),
    buscarRestaurantesProximos(latitude, longitude, RAIO_METROS),
    supabase.from('usuario').select('id, nome'),
  ]);
  if (avaliacoesRes.error) throw avaliacoesRes.error;
  if (usuariosRes.error) throw usuariosRes.error;

  const avaliacoes: AvaliacaoUBCF[] = (avaliacoesRes.data ?? []).map((a) => ({
    usuarioId: a.usuario_id,
    itemId: a.restaurante_id,
    nota: Number(a.nota_geral),
  }));
  const nomes = new Map((usuariosRes.data ?? []).map((u) => [u.id, u.nome]));
  const porId = new Map(proximos.map((r) => [r.id, r]));
  const matriz = montarMatriz(avaliacoes);
  const minhas = matriz.get(usuarioId);
  const totalAvaliacoesDoUsuario = minhas?.size ?? 0;

  // --- UBCF -------------------------------------------------------------
  if (totalAvaliacoesDoUsuario >= MIN_AVALIACOES_PARA_UBCF) {
    const previsoes = preverNotas(matriz, usuarioId).filter((p) => porId.has(p.itemId));
    if (previsoes.length > 0) {
      const recomendacoes = previsoes
        .map((p) => {
          const restaurante = porId.get(p.itemId) as RestauranteProximo;
          return {
            restaurante,
            notaPrevista: p.notaPrevista,
            score: scoreFinal(p.notaPrevista, restaurante.distancia_m),
            explicacao: {
              tipo: 'ubcf' as const,
              vizinhos: p.vizinhos.slice(0, 3).map((v) => ({
                nome: nomes.get(v.usuarioId) ?? 'Usuário',
                similaridade: v.similaridade,
                nota: v.nota,
              })),
            },
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, LIMITE);
      return { recomendacoes, modo: 'ubcf', totalAvaliacoesDoUsuario };
    }
  }

  // --- Fallback: popularidade (média bayesiana) + proximidade -----------
  const somaGlobal = avaliacoes.reduce((s, a) => s + a.nota, 0);
  const mediaGlobal = avaliacoes.length > 0 ? somaGlobal / avaliacoes.length : 3;
  const somas = new Map<string, { soma: number; n: number }>();
  for (const a of avaliacoes) {
    const atual = somas.get(a.itemId) ?? { soma: 0, n: 0 };
    somas.set(a.itemId, { soma: atual.soma + a.nota, n: atual.n + 1 });
  }
  const recomendacoes = proximos
    .filter((r) => !minhas?.has(r.id))
    .map((restaurante) => {
      const s = somas.get(restaurante.id) ?? { soma: 0, n: 0 };
      const notaPrevista = mediaBayesiana(s.soma, s.n, mediaGlobal);
      return {
        restaurante,
        notaPrevista,
        score: scoreFinal(notaPrevista, restaurante.distancia_m),
        explicacao: { tipo: 'popular' as const },
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, LIMITE);
  return { recomendacoes, modo: 'popular', totalAvaliacoesDoUsuario };
}
