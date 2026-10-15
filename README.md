# CompassoCulinário

Aplicativo mobile em React Native que encontra restaurantes próximos, permite que o usuário os avalie e recomenda lugares usando **Filtragem Colaborativa baseada em usuários** (User-Based Collaborative Filtering).

Projeto de conclusão da disciplina de Desenvolvimento Mobile — Sistemas de Informação, UniRios.

## Funcionalidades

**Essencial (MVP)**

- Cadastro e login de usuário
- Restaurantes próximos em lista e mapa
- Detalhes do restaurante com notas por critério
- Avaliar, editar e excluir avaliações (CRUD)
- Onboarding com 5 avaliações iniciais (contorna o *cold start*)
- Recomendações com IA e explicação de cada uma

**Extras (se houver tempo)**

- Favoritos e lista "Quero ir"
- Filtros: categoria, preço, raio, aberto agora
- Foto anexada à avaliação
- Roleta "não sei onde comer"
- Modo grupo
- Perfil com estatísticas de gosto

## Tecnologias

| Camada | Tecnologia |
|---|---|
| App | React Native + Expo, TypeScript, Expo Router |
| Backend | Supabase (Auth, PostgreSQL + PostGIS, Storage) |
| Mapa e localização | react-native-maps, expo-location |
| Dados de restaurantes | OpenStreetMap (Overpass API) + cadastro manual |
| Recomendação | UBCF em TypeScript (Supabase Edge Function) |
| Organização | GitHub Projects, Figma, Jest |

## Como funciona a recomendação

1. **Matriz** usuário × restaurante montada a partir da tabela `avaliacao`.
2. **Similaridade** (cosseno ou Pearson) entre o usuário e os demais.
3. **k vizinhos** mais parecidos preveem a nota dos restaurantes não avaliados:

   `previsão(u,i) = média(u) + Σ sim(u,v)·(nota(v,i) − média(v)) / Σ |sim(u,v)|`

4. **Score final** combina a nota prevista com a distância.

Usuário novo sem avaliações recebe ranking por popularidade e distância até completar o onboarding.

## Modelo de dados

```
usuario (id PK, nome, email, avatar_url, criado_em)
categoria (id PK, nome)
restaurante (id PK, nome, categoria_id FK, latitude, longitude, endereco, faixa_preco, fonte)
avaliacao (id PK, usuario_id FK, restaurante_id FK, nota_geral, comida, atendimento, preco, ambiente, comentario, foto_url, criado_em)
favorito (id PK, usuario_id FK, restaurante_id FK, tipo)
```

- `usuario` 1:N `avaliacao` N:1 `restaurante`
- `usuario` 1:N `favorito` N:1 `restaurante`
- `categoria` 1:N `restaurante`

Detalhes do esquema em `supabase/migrations/`: `nota_geral` é a média dos quatro critérios (coluna gerada), a busca por raio usa PostGIS (`restaurantes_proximos(lat, lng, raio_m)`), a view `restaurante_resumo` agrega as notas, e todas as tabelas têm RLS ligado.

### Criar o banco em um projeto Supabase novo

```bash
npx supabase login
npx supabase db query --linked --project-ref SEU_PROJECT_REF -f supabase/migrations/20261015120000_schema_inicial.sql
npx supabase db query --linked --project-ref SEU_PROJECT_REF -f supabase/seed.sql
```

Reexecutar o `seed.sql` recria restaurantes e usuários de exemplo com IDs novos: sessões abertas com um usuário de exemplo deixam de funcionar (saia e entre de novo).

O `seed.sql` carrega 20 estabelecimentos reais de Paulo Afonso/BA (OpenStreetMap), 10 restaurantes fictícios de exemplo e 30 usuários fictícios (`*@exemplo.compassoculinario.app`, senha `senha123`) com avaliações geradas em três perfis de gosto, para que a recomendação tenha vizinhos na demonstração.

## Como executar

Pré-requisitos: Node.js e o app Expo Go no celular (ou um emulador).

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env` a partir do exemplo e preencha com a **Project URL** e a **publishable key** do seu projeto Supabase (Project Settings › API Keys):

   ```bash
   cp .env.example .env
   ```

3. Inicie o servidor de desenvolvimento e escaneie o QR code com o Expo Go:

   ```bash
   npx expo start
   ```

O cliente Supabase fica em `src/lib/supabase.ts`. A chave publicável é pública por natureza; a proteção dos dados é feita por políticas RLS no banco.

## Organização

O andamento do projeto é acompanhado no GitHub Project do repositório, com as colunas A Fazer, Em Desenvolvimento, Em Teste e Concluído.
