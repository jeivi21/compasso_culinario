/** Validações básicas dos formulários. Cada função devolve a mensagem de erro ou `null`. */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarNome(nome: string): string | null {
  if (nome.trim().length < 2) return 'Informe seu nome.';
  if (nome.trim().length > 60) return 'Nome muito longo.';
  return null;
}

export function validarEmail(email: string): string | null {
  if (!email.trim()) return 'Informe seu e-mail.';
  if (!EMAIL_REGEX.test(email.trim())) return 'E-mail inválido.';
  return null;
}

export function validarSenha(senha: string): string | null {
  if (!senha) return 'Informe sua senha.';
  if (senha.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
  return null;
}

export function validarConfirmacaoSenha(senha: string, confirmacao: string): string | null {
  if (senha !== confirmacao) return 'As senhas não conferem.';
  return null;
}

/** Traduz as mensagens mais comuns do Supabase Auth. */
export function traduzirErroAuth(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Sem conexão. Verifique sua internet.';
  }
  return 'Não foi possível concluir. Tente novamente.';
}
