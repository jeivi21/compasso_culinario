import {
  traduzirErroAuth,
  validarConfirmacaoSenha,
  validarEmail,
  validarNome,
  validarSenha,
} from '../validation';

describe('validarNome', () => {
  it('rejeita vazio, só espaços e muito longo', () => {
    expect(validarNome('')).not.toBeNull();
    expect(validarNome('   ')).not.toBeNull();
    expect(validarNome('a'.repeat(61))).not.toBeNull();
  });
  it('aceita nome normal', () => {
    expect(validarNome('João Victor')).toBeNull();
  });
});

describe('validarEmail', () => {
  it('rejeita vazio e formatos inválidos', () => {
    expect(validarEmail('')).toBe('Informe seu e-mail.');
    expect(validarEmail('joao')).toBe('E-mail inválido.');
    expect(validarEmail('joao@')).toBe('E-mail inválido.');
    expect(validarEmail('joao@site')).toBe('E-mail inválido.');
    expect(validarEmail('jo ao@site.com')).toBe('E-mail inválido.');
  });
  it('aceita e-mail válido, mesmo com espaços nas pontas', () => {
    expect(validarEmail('  joao@site.com.br ')).toBeNull();
  });
});

describe('validarSenha e confirmação', () => {
  it('exige pelo menos 6 caracteres', () => {
    expect(validarSenha('')).not.toBeNull();
    expect(validarSenha('12345')).not.toBeNull();
    expect(validarSenha('123456')).toBeNull();
  });
  it('confirmação precisa ser igual', () => {
    expect(validarConfirmacaoSenha('abc123', 'abc124')).not.toBeNull();
    expect(validarConfirmacaoSenha('abc123', 'abc123')).toBeNull();
  });
});

describe('traduzirErroAuth', () => {
  it('traduz as mensagens conhecidas do Supabase', () => {
    expect(traduzirErroAuth('Invalid login credentials')).toBe('E-mail ou senha incorretos.');
    expect(traduzirErroAuth('Email not confirmed')).toBe('Confirme seu e-mail antes de entrar.');
    expect(traduzirErroAuth('User already registered')).toBe('Este e-mail já está cadastrado.');
    expect(traduzirErroAuth('Request rate limit reached')).toMatch(/Muitas tentativas/);
    expect(traduzirErroAuth('TypeError: Network request failed')).toMatch(/Sem conexão/);
  });
  it('tem mensagem genérica para o resto', () => {
    expect(traduzirErroAuth('algo estranho')).toBe('Não foi possível concluir. Tente novamente.');
  });
});
