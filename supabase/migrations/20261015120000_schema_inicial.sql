-- Esquema inicial do CompassoCulinário.
-- Entidades: categoria, restaurante, usuario, avaliacao, favorito.
-- A tabela avaliacao é a matriz usuário × restaurante usada pela recomendação (UBCF).

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- categoria
-- ---------------------------------------------------------------------------
create table public.categoria (
  id serial primary key,
  nome text not null unique,
  icone text -- nome de ícone do Ionicons usado no app
);

-- ---------------------------------------------------------------------------
-- restaurante
-- ---------------------------------------------------------------------------
create table public.restaurante (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria_id integer references public.categoria (id),
  latitude double precision not null,
  longitude double precision not null,
  -- ponto geográfico derivado de latitude/longitude para busca por raio
  localizacao extensions.geography(point, 4326) generated always as (
    extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
  ) stored,
  endereco text,
  faixa_preco smallint check (faixa_preco between 1 and 4), -- 1 = $ ... 4 = $$$$
  telefone text,
  fonte text not null default 'manual' check (fonte in ('osm', 'manual')),
  osm_id bigint unique,
  criado_em timestamptz not null default now()
);

create index restaurante_localizacao_idx on public.restaurante using gist (localizacao);
create index restaurante_categoria_idx on public.restaurante (categoria_id);

-- ---------------------------------------------------------------------------
-- usuario (perfil público; a autenticação fica em auth.users)
-- ---------------------------------------------------------------------------
create table public.usuario (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text,
  avatar_url text,
  onboarding_concluido boolean not null default false,
  criado_em timestamptz not null default now()
);

-- Cria o perfil automaticamente quando um usuário se cadastra.
create or replace function public.criar_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuario (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger ao_criar_usuario_auth
  after insert on auth.users
  for each row execute function public.criar_perfil_usuario();

-- ---------------------------------------------------------------------------
-- avaliacao
-- ---------------------------------------------------------------------------
create table public.avaliacao (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuario (id) on delete cascade,
  restaurante_id uuid not null references public.restaurante (id) on delete cascade,
  comida smallint not null check (comida between 1 and 5),
  atendimento smallint not null check (atendimento between 1 and 5),
  preco smallint not null check (preco between 1 and 5),
  ambiente smallint not null check (ambiente between 1 and 5),
  -- média dos quatro critérios; é a nota usada pelo algoritmo de recomendação
  nota_geral numeric(3, 2) generated always as (
    (comida + atendimento + preco + ambiente) / 4.0
  ) stored,
  comentario text check (char_length(comentario) <= 500),
  foto_url text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (usuario_id, restaurante_id) -- uma avaliação por usuário por restaurante
);

create index avaliacao_restaurante_idx on public.avaliacao (restaurante_id);
create index avaliacao_usuario_idx on public.avaliacao (usuario_id);

create or replace function public.marcar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger avaliacao_atualizado_em
  before update on public.avaliacao
  for each row execute function public.marcar_atualizado_em();

-- ---------------------------------------------------------------------------
-- favorito
-- ---------------------------------------------------------------------------
create table public.favorito (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuario (id) on delete cascade,
  restaurante_id uuid not null references public.restaurante (id) on delete cascade,
  tipo text not null check (tipo in ('favorito', 'quero_ir')),
  criado_em timestamptz not null default now(),
  unique (usuario_id, restaurante_id, tipo)
);

create index favorito_usuario_idx on public.favorito (usuario_id);

-- ---------------------------------------------------------------------------
-- Resumo de notas por restaurante (usado nas listas e na tela de detalhes)
-- ---------------------------------------------------------------------------
create view public.restaurante_resumo
with (security_invoker = true)
as
select
  r.id as restaurante_id,
  count(a.id)::integer as total_avaliacoes,
  round(avg(a.nota_geral), 1) as media_geral,
  round(avg(a.comida), 1) as media_comida,
  round(avg(a.atendimento), 1) as media_atendimento,
  round(avg(a.preco), 1) as media_preco,
  round(avg(a.ambiente), 1) as media_ambiente
from public.restaurante r
left join public.avaliacao a on a.restaurante_id = r.id
group by r.id;

-- ---------------------------------------------------------------------------
-- Busca por raio: restaurantes a até `raio_m` metros de (lat, lng), com distância
-- ---------------------------------------------------------------------------
create or replace function public.restaurantes_proximos(
  lat double precision,
  lng double precision,
  raio_m integer default 5000
)
returns table (
  id uuid,
  nome text,
  categoria_id integer,
  categoria text,
  latitude double precision,
  longitude double precision,
  endereco text,
  faixa_preco smallint,
  distancia_m integer,
  total_avaliacoes integer,
  media_geral numeric
)
language sql
stable
set search_path = ''
as $$
  select
    r.id,
    r.nome,
    r.categoria_id,
    c.nome as categoria,
    r.latitude,
    r.longitude,
    r.endereco,
    r.faixa_preco,
    extensions.st_distance(
      r.localizacao,
      extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography
    )::integer as distancia_m,
    coalesce(s.total_avaliacoes, 0) as total_avaliacoes,
    s.media_geral
  from public.restaurante r
  left join public.categoria c on c.id = r.categoria_id
  left join public.restaurante_resumo s on s.restaurante_id = r.id
  where extensions.st_dwithin(
    r.localizacao,
    extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography,
    raio_m
  )
  order by distancia_m;
$$;

-- ---------------------------------------------------------------------------
-- Segurança (RLS). A chave publicável do app não protege nada; estas políticas sim.
-- ---------------------------------------------------------------------------
alter table public.categoria enable row level security;
alter table public.restaurante enable row level security;
alter table public.usuario enable row level security;
alter table public.avaliacao enable row level security;
alter table public.favorito enable row level security;

-- Catálogo: qualquer um lê; usuário logado pode cadastrar restaurante manualmente.
create policy "categoria: leitura pública" on public.categoria
  for select using (true);

create policy "restaurante: leitura pública" on public.restaurante
  for select using (true);

create policy "restaurante: usuário logado cadastra" on public.restaurante
  for insert to authenticated with check (fonte = 'manual');

-- Perfis: logados veem todos (nomes nas avaliações e vizinhos do UBCF); cada um edita o seu.
create policy "usuario: logados leem" on public.usuario
  for select to authenticated using (true);

create policy "usuario: edita o próprio" on public.usuario
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Avaliações: leitura pública; só o autor cria, edita e exclui.
create policy "avaliacao: leitura pública" on public.avaliacao
  for select using (true);

create policy "avaliacao: autor cria" on public.avaliacao
  for insert to authenticated with check (usuario_id = (select auth.uid()));

create policy "avaliacao: autor edita" on public.avaliacao
  for update to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

create policy "avaliacao: autor exclui" on public.avaliacao
  for delete to authenticated using (usuario_id = (select auth.uid()));

-- Favoritos: privados do usuário.
create policy "favorito: só o dono" on public.favorito
  for all to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
