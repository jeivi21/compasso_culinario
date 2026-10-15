/** Filtros de categoria e preço aplicados em memória sobre a lista de restaurantes próximos. */

export type Filtros = {
  categoriaId: number | null;
  /** Faixas de preço aceitas (1–4); vazio = todas. */
  faixasPreco: number[];
};

export const FILTROS_VAZIOS: Filtros = { categoriaId: null, faixasPreco: [] };

type Filtravel = { categoria_id: number | null; faixa_preco: number | null };

export function aplicarFiltros<T extends Filtravel>(restaurantes: T[], filtros: Filtros): T[] {
  return restaurantes.filter((r) => {
    if (filtros.categoriaId !== null && r.categoria_id !== filtros.categoriaId) return false;
    if (filtros.faixasPreco.length > 0 && (r.faixa_preco === null || !filtros.faixasPreco.includes(r.faixa_preco))) {
      return false;
    }
    return true;
  });
}

export function filtrosAtivos(filtros: Filtros): boolean {
  return filtros.categoriaId !== null || filtros.faixasPreco.length > 0;
}
