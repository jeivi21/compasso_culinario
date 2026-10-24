import { Anagrama } from '@/games/anagrama';
import { Cabo } from '@/games/cabo';
import { Fatia } from '@/games/fatia';
import { Garcom } from '@/games/garcom';
import { Intruso } from '@/games/intruso';
import { Memoria } from '@/games/memoria';
import { Palpite } from '@/games/palpite';
import type { InfoJogo } from '@/games/tipos';

/** Os ids batem com `jogos_disponiveis()` no banco, que faz o sorteio. */
export const JOGOS: Record<string, InfoJogo> = {
  garcom: {
    id: 'garcom',
    nome: 'Garçom equilibrista',
    descricao: 'Incline o celular para manter o prato na bandeja por 20 segundos.',
    pontuacao: '100 pontos menos 15 por prato que cair.',
    icone: 'phone-portrait-outline',
    precisaSensor: true,
    Componente: Garcom,
  },
  fatia: {
    id: 'fatia',
    nome: 'Fatia perfeita',
    descricao: 'A faca desliza sobre a pizza; toque para cortar bem no centro. Três cortes.',
    pontuacao: 'Média da precisão dos três cortes.',
    icone: 'cut-outline',
    Componente: Fatia,
  },
  palpite: {
    id: 'palpite',
    nome: 'Chef do palpite',
    descricao: 'Chute o preço de cinco comidas e bebidas.',
    pontuacao: 'Quanto menor o erro, mais pontos; média das rodadas.',
    icone: 'cash-outline',
    Componente: Palpite,
  },
  intruso: {
    id: 'intruso',
    nome: 'Caça ao intruso',
    descricao: 'Ache o emoji diferente na grade. Cinco rodadas contra o relógio.',
    pontuacao: '20 pontos por rodada, menos 2 por segundo; erro soma 1,5 s.',
    icone: 'search-outline',
    Componente: Intruso,
  },
  memoria: {
    id: 'memoria',
    nome: 'Memória de sabores',
    descricao: 'A receita acende ingredientes em sequência; repita na ordem.',
    pontuacao: '10 pontos por nível completado, até 10 níveis.',
    icone: 'color-palette-outline',
    Componente: Memoria,
  },
  cabo: {
    id: 'cabo',
    nome: 'Cabo de guerra',
    descricao: 'Ao vivo: os dois tocam a tela por 10 segundos; cada toque puxa a corda para o seu lado.',
    pontuacao: 'Um ponto por toque. Os dois precisam estar na tela ao mesmo tempo.',
    icone: 'people-outline',
    sincrono: true,
    Componente: Cabo,
  },
  anagrama: {
    id: 'anagrama',
    nome: 'Prato embaralhado',
    descricao: 'Desembaralhe o nome de cinco pratos brasileiros.',
    pontuacao: '20 pontos por acerto, menos 1 por segundo (mínimo 4).',
    icone: 'text-outline',
    Componente: Anagrama,
  },
};

export function infoJogo(id: string | null | undefined): InfoJogo | null {
  return id ? (JOGOS[id] ?? null) : null;
}
