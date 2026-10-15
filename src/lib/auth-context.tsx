import type { Session } from '@supabase/supabase-js';
import { createContext, use, useCallback, useEffect, useState, type PropsWithChildren } from 'react';

import { supabase } from '@/lib/supabase';

export type Perfil = {
  id: string;
  nome: string;
  email: string | null;
  onboarding_concluido: boolean;
};

type AuthContextValue = {
  /** Sessão atual do Supabase; `null` quando deslogado. */
  session: Session | null;
  /** Linha de public.usuario do usuário logado; `null` quando deslogado. */
  perfil: Perfil | null;
  /** `true` enquanto a sessão salva (e o perfil) ainda estão sendo restaurados. */
  isLoading: boolean;
  signOut: () => Promise<void>;
  /** Marca o onboarding como concluído no banco e no estado local. */
  concluirOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider />');
  }
  return value;
}

/**
 * Perfil do usuário. Se a consulta falhar (sem rede), devolve `null`: o app segue
 * para as abas sem bloquear o uso; o onboarding só é exigido quando o perfil carrega.
 */
async function carregarPerfil(usuarioId: string): Promise<Perfil | null> {
  try {
    const { data } = await supabase
      .from('usuario')
      .select('id, nome, email, onboarding_concluido')
      .eq('id', usuarioId)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restaura a sessão persistida e passa a ouvir login/logout/refresh.
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setIsLoading(false));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  // Carrega o perfil quando o usuário muda (não a cada refresh de token).
  // A flag `ativo` descarta respostas de um usuário anterior em login/logout rápidos.
  const usuarioId = session?.user.id ?? null;
  useEffect(() => {
    if (!usuarioId) return;
    let ativo = true;
    carregarPerfil(usuarioId).then((p) => ativo && setPerfil(p));
    return () => {
      ativo = false;
    };
  }, [usuarioId]);

  // Sem sessão não há perfil; derivado, sem setState em efeito.
  const perfilAtual = usuarioId && perfil?.id === usuarioId ? perfil : null;

  const concluirOnboarding = useCallback(async () => {
    if (!session) return;
    const { error } = await supabase
      .from('usuario')
      .update({ onboarding_concluido: true })
      .eq('id', session.user.id);
    if (error) throw error;
    setPerfil((p) => (p ? { ...p, onboarding_concluido: true } : p));
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        session,
        perfil: perfilAtual,
        isLoading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
        concluirOnboarding,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
