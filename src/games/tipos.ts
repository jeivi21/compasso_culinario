import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentType } from 'react';

export type PropsJogo = {
  /** Semente compartilhada pelos dois jogadores. */
  semente: number;
  /** Chamado uma única vez com o placar final, de 0 a 100. */
  onFim: (placar: number) => void;
};

export type InfoJogo = {
  id: string;
  nome: string;
  descricao: string;
  /** Como o placar é calculado, em uma frase. */
  pontuacao: string;
  icone: keyof typeof Ionicons.glyphMap;
  /** Precisa de sensor de movimento (não funciona no web). */
  precisaSensor?: boolean;
  Componente: ComponentType<PropsJogo>;
};
