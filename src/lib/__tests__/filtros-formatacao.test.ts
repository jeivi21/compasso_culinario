import { aplicarFiltros, FILTROS_VAZIOS, filtrosAtivos } from '../filtros';
import { formatarData, formatarDistancia, formatarFaixaPreco, formatarNota } from '../formatacao';

const LUGARES = [
  { id: 'a', categoria_id: 1, faixa_preco: 1 },
  { id: 'b', categoria_id: 1, faixa_preco: 3 },
  { id: 'c', categoria_id: 2, faixa_preco: 2 },
  { id: 'd', categoria_id: null, faixa_preco: null },
];

describe('aplicarFiltros', () => {
  it('sem filtros devolve tudo', () => {
    expect(aplicarFiltros(LUGARES, FILTROS_VAZIOS)).toHaveLength(4);
    expect(filtrosAtivos(FILTROS_VAZIOS)).toBe(false);
  });
  it('filtra por categoria', () => {
    const r = aplicarFiltros(LUGARES, { categoriaId: 1, faixasPreco: [] });
    expect(r.map((x) => x.id)).toEqual(['a', 'b']);
  });
  it('filtra por uma ou mais faixas de preço e exclui preço desconhecido', () => {
    expect(aplicarFiltros(LUGARES, { categoriaId: null, faixasPreco: [3] }).map((x) => x.id)).toEqual(['b']);
    expect(aplicarFiltros(LUGARES, { categoriaId: null, faixasPreco: [1, 2] }).map((x) => x.id)).toEqual(['a', 'c']);
  });
  it('combina categoria e preço', () => {
    expect(aplicarFiltros(LUGARES, { categoriaId: 1, faixasPreco: [2] })).toEqual([]);
    expect(filtrosAtivos({ categoriaId: 1, faixasPreco: [2] })).toBe(true);
  });
});

describe('formatação', () => {
  it('distância em metros até 999 m e em km acima', () => {
    expect(formatarDistancia(29)).toBe('29 m');
    expect(formatarDistancia(999)).toBe('999 m');
    expect(formatarDistancia(1000)).toBe('1,0 km');
    expect(formatarDistancia(1234)).toBe('1,2 km');
  });
  it('faixa de preço vira cifrões, limitada a 4', () => {
    expect(formatarFaixaPreco(null)).toBe('');
    expect(formatarFaixaPreco(0)).toBe('');
    expect(formatarFaixaPreco(2)).toBe('$$');
    expect(formatarFaixaPreco(9)).toBe('$$$$');
  });
  it('nota com vírgula e traço quando não há nota', () => {
    expect(formatarNota(null)).toBe('–');
    expect(formatarNota(Number('abc'))).toBe('–');
    expect(formatarNota(3.75)).toBe('3,8');
    expect(formatarNota('4.00' as unknown as number)).toBe('4,0');
  });
  it('data inválida vira vazio', () => {
    expect(formatarData('não é data')).toBe('');
    expect(formatarData('2026-10-15T12:00:00Z')).not.toBe('');
  });
});
