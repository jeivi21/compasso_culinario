# CompassoCulinário

Aplicativo mobile em React Native que encontra restaurantes próximos, permite que o usuário os avalie e recomenda lugares usando **Filtragem Colaborativa baseada em usuários** (User-Based Collaborative Filtering), explicando o motivo de cada recomendação.

Projeto de conclusão da disciplina de Desenvolvimento Mobile — Sistemas de Informação, UniRios (2026.2).

- Planejamento (Fase 1): GitHub Project do repositório
- Dados de demonstração: Paulo Afonso/BA

## Funcionalidades

| Funcionalidade | Onde está |
|---|---|
| Cadastro, login com confirmação de e-mail e logout | `src/app/(auth)/`, `src/lib/auth-context.tsx` |
| Onboarding: avaliar 5 lugares conhecidos no primeiro acesso | `src/app/onboarding.tsx` |
| Restaurantes próximos em lista e mapa, com raio de 1 a 10 km | `src/app/(tabs)/mapa.tsx` |
| Filtros por categoria e faixa de preço | `src/components/barra-filtros.tsx` |
| Detalhes com nota geral, médias por critério e avaliações | `src/app/restaurante/[id]/index.tsx` |
| **CRUD de avaliações**: criar, listar, editar e excluir | `src/app/restaurante/[id]/avaliar.tsx`, `src/app/minhas-avaliacoes.tsx` |
| Recomendações "Para você" com nota prevista e explicação | `src/app/(tabs)/index.tsx`, `src/lib/recomendacao.ts` |
| Favoritos e lista "Quero ir" | `src/app/(tabs)/favoritos.tsx` |
| Perfil com atalho para as próprias avaliações | `src/app/(tabs)/perfil.tsx` |
| Modo claro e escuro, tela de erro global e rota 404 | `src/constants/theme.ts`, `src/components/tela-erro.tsx`, `src/app/+not-found.tsx` |

Validações: e-mail, senha (mínimo 6), confirmação de senha, nome, as quatro notas obrigatórias (1–5) e comentário até 500 caracteres. Erros de rede e de permissão mostram mensagem e botão de nova tentativa.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| App | React Native 0.86 + Expo SDK 57, TypeScript, Expo Router (rotas protegidas por sessão) |
| Backend | Supabase: Auth (e-mail/senha), PostgreSQL 17 + PostGIS, Row Level Security |
| Mapa e localização | `react-native-maps` com tiles CARTO/OpenStreetMap (sem chave do Google), `expo-location` |
| Dados dos restaurantes | OpenStreetMap (Overpass API) + cadastro manual no seed |
| Recomendação | UBCF em TypeScript puro (`src/lib/ubcf.ts`), executado no app |
| Testes e qualidade | Jest (`jest-expo`), ESLint (`eslint-config-expo`), TypeScript estrito |
| Identidade visual | Paleta verde-água, fontes Fredoka e Nunito Sans (Google Fonts) |

## Como funciona a recomendação

Implementada em `src/lib/ubcf.ts` (sem dependência de React ou Supabase) e integrada em `src/lib/recomendacao.ts`.

1. **Matriz usuário × restaurante** montada com a `nota_geral` de todas as avaliações.
2. **Similaridade de Pearson** entre o usuário e cada outro, calculada só sobre os restaurantes que ambos avaliaram. Com poucos itens em comum a similaridade é encolhida (`min(n, 5)/5`) para evitar "vizinhos perfeitos" por acaso.
3. **k = 10 vizinhos** com similaridade positiva preveem a nota dos restaurantes que o usuário ainda não avaliou:

   `previsão(u,i) = média(u) + Σ sim(u,v)·(nota(v,i) − média(v)) / Σ |sim(u,v)|`

4. **Score final** = 75 % nota prevista (normalizada) + 25 % proximidade (até 10 km).
5. **Explicação**: cada recomendação mostra os vizinhos que a geraram e a similaridade em %.

**Cold start:** usuário com menos de 3 avaliações, ou sem vizinhos, recebe o ranking por popularidade (média bayesiana, que puxa lugares com poucas notas para a média global) combinado com a distância. O onboarding pede 5 notas rápidas justamente para sair desse estado.

## Modelo de dados

```
usuario     (id PK → auth.users, nome, email, avatar_url, onboarding_concluido, criado_em)
categoria   (id PK, nome, icone)
restaurante (id PK, nome, categoria_id FK, latitude, longitude, localizacao geography, endereco,
             faixa_preco 1–4, telefone, fonte 'osm'|'manual', osm_id, criado_em)
avaliacao   (id PK, usuario_id FK, restaurante_id FK, comida, atendimento, preco, ambiente,
             nota_geral = média dos 4 (gerada), comentario, foto_url, criado_em, atualizado_em)
            UNIQUE (usuario_id, restaurante_id)
favorito    (id PK, usuario_id FK, restaurante_id FK, tipo 'favorito'|'quero_ir', criado_em)
            UNIQUE (usuario_id, restaurante_id, tipo)
```

- `usuario` 1:N `avaliacao` N:1 `restaurante`
- `usuario` 1:N `favorito` N:1 `restaurante`
- `categoria` 1:N `restaurante`

Esquema completo em `supabase/migrations/20261015120000_schema_inicial.sql`:

- trigger `ao_criar_usuario_auth` cria o perfil em `usuario` quando alguém se cadastra;
- função `restaurantes_proximos(lat, lng, raio_m)` faz a busca por raio com PostGIS;
- view `restaurante_resumo` agrega total e médias por critério;
- RLS em todas as tabelas: catálogo e avaliações são públicos para leitura; cada usuário só cria, edita e exclui as próprias avaliações e favoritos.

## Como executar

Pré-requisitos: Node.js 20+, um projeto no [Supabase](https://supabase.com) e o app **Expo Go** no celular (Android; no iOS o mapa não roda dentro do Expo Go).

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o banco no seu projeto Supabase (faça login no CLI uma vez; não é preciso a senha do banco):

   ```bash
   npx supabase login
   npx supabase db query --linked --project-ref SEU_PROJECT_REF -f supabase/migrations/20261015120000_schema_inicial.sql
   npx supabase db query --linked --project-ref SEU_PROJECT_REF -f supabase/seed.sql
   ```

3. Crie o `.env` a partir do exemplo e preencha com a **Project URL** e a **publishable key** (Project Settings › API Keys):

   ```bash
   cp .env.example .env
   ```

4. Inicie o servidor e escaneie o QR code com o Expo Go:

   ```bash
   npx expo start
   ```

A chave publicável é pública por natureza; a proteção dos dados é feita pelas políticas RLS do banco.

### Dados de demonstração

O `seed.sql` carrega 20 estabelecimentos reais de Paulo Afonso/BA (OpenStreetMap), 10 restaurantes fictícios e 30 usuários fictícios em três perfis de gosto (boteco, lanche, mesa) com ~400 avaliações, para a recomendação ter vizinhos. Qualquer usuário `*@exemplo.compassoculinario.app` entra com a senha `senha123` (ex.: `ana.souza@exemplo.compassoculinario.app`).

Reexecutar o `seed.sql` recria restaurantes e usuários com IDs novos: sessões abertas com um usuário de exemplo deixam de funcionar (saia e entre de novo).

Se você estiver fora de Paulo Afonso, negue a permissão de localização: o app usa o centro da cidade como posição padrão.

### Testes e verificação

```bash
npm test            # 32 testes unitários (UBCF, validação, filtros, formatação)
npx tsc --noEmit    # tipos
npx expo lint       # lint
```

## Roteiro da demonstração

1. Abrir o app e criar uma conta (ou entrar com um usuário de exemplo).
2. Onboarding: dar nota a 5 restaurantes conhecidos.
3. Aba **Para você**: recomendações com nota prevista e "usuários com gosto parecido".
4. Aba **Mapa**: lista e mapa dos restaurantes próximos; trocar o raio e filtrar por categoria.
5. Abrir um restaurante: médias por critério e avaliações.
6. **Criar** uma avaliação → voltar e ver na lista → **editar** → **excluir**.
7. Perfil › Minhas avaliações mostra o histórico; fechar e reabrir o app mantém a sessão e os dados.

## Estrutura do código

```
src/
  app/            rotas (Expo Router): (auth), (tabs), onboarding, restaurante/[id], minhas-avaliacoes
  components/     componentes de interface reutilizáveis
  constants/      tema (cores, fontes, espaçamentos)
  hooks/          useTheme, useColorScheme
  lib/            acesso a dados (Supabase), localização, recomendação, validação
  lib/__tests__/  testes unitários
supabase/
  migrations/     esquema do banco
  seed.sql        dados de demonstração
```

## Dificuldades e melhorias futuras

- **Cold start** da filtragem colaborativa: resolvido com onboarding + fallback por popularidade.
- **Dados reais escassos**: o OpenStreetMap tem poucos restaurantes cadastrados em Paulo Afonso; o seed completa com exemplos fictícios. Uma melhoria é permitir que usuários cadastrem restaurantes (a política RLS já permite inserir com `fonte = 'manual'`).
- **Escala do UBCF**: hoje o app baixa todas as avaliações (rápido com centenas de linhas; o Supabase limita a 1000 por consulta). Para crescer, o cálculo deve ir para uma função no banco ou Edge Function.
- **Fotos nas avaliações** (coluna `foto_url` já existe), **"aberto agora"** (precisa de horários), **modo grupo** e **roleta** ficaram como próximos passos.
