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
