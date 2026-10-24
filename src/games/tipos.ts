import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentType } from 'react';

export type PropsJogo = {
  /** Semente compartilhada pelos dois jogadores. */
  semente: number;
  /** Chamado uma única vez com o placar final, de 0 a 100. */
  onFim: (placar: number) => void;
  /** Identificação do duelo, usada pelos jogos em tempo real. */
  contexto: {
    dueloId: string;
    lado: 'desafiante' | 'desafiado';
    nomeAdversario: string;
  };
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
  /** Os dois jogam ao mesmo tempo (tempo real). */
  sincrono?: boolean;
  Componente: ComponentType<PropsJogo>;
};
