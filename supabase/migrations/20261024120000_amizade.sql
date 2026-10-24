-- Amizades: pedido enviado por um usuário a outro, que aceita ou recusa.

create table public.amizade (
  id uuid primary key default gen_random_uuid(),
  solicitante_id uuid not null references public.usuario (id) on delete cascade,
  destinatario_id uuid not null references public.usuario (id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'aceita', 'recusada')),
  criado_em timestamptz not null default now(),
  respondido_em timestamptz,
  check (solicitante_id <> destinatario_id)
);

-- Um único vínculo por par, em qualquer direção.
create unique index amizade_par_unico_idx
  on public.amizade (least(solicitante_id, destinatario_id), greatest(solicitante_id, destinatario_id));

create index amizade_destinatario_idx on public.amizade (destinatario_id, status);
create index amizade_solicitante_idx on public.amizade (solicitante_id, status);

alter table public.amizade enable row level security;

-- Cada um vê, cria (como solicitante), responde e desfaz só os vínculos de que participa.
create policy "amizade: participantes leem" on public.amizade
  for select to authenticated
  using (solicitante_id = (select auth.uid()) or destinatario_id = (select auth.uid()));

create policy "amizade: solicitante cria" on public.amizade
  for insert to authenticated
  with check (solicitante_id = (select auth.uid()));

create policy "amizade: participantes atualizam" on public.amizade
  for update to authenticated
  using (solicitante_id = (select auth.uid()) or destinatario_id = (select auth.uid()))
  with check (solicitante_id = (select auth.uid()) or destinatario_id = (select auth.uid()));

create policy "amizade: participantes excluem" on public.amizade
  for delete to authenticated
  using (solicitante_id = (select auth.uid()) or destinatario_id = (select auth.uid()));

-- Busca de usuários por nome ou e-mail (exclui o próprio), para enviar pedidos.
create or replace function public.buscar_usuarios(termo text)
returns table (id uuid, nome text, email text)
language sql
stable
security invoker
set search_path = ''
as $$
  select u.id, u.nome, u.email
  from public.usuario u
  where u.id <> (select auth.uid())
    and char_length(trim(termo)) >= 2
    and (u.nome ilike '%' || trim(termo) || '%' or u.email ilike trim(termo) || '%')
  order by u.nome
  limit 20;
$$;
