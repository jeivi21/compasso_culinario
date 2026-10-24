-- Duelos: dois amigos escolhem um restaurante cada e disputam um minijogo sorteado.
-- Cada um joga no próprio celular; o placar vai para o banco e, quando os dois
-- terminam, o vencedor é definido e o restaurante dele entra no "Quero ir" dos dois.

create table public.duelo (
  id uuid primary key default gen_random_uuid(),
  desafiante_id uuid not null references public.usuario (id) on delete cascade,
  desafiado_id uuid not null references public.usuario (id) on delete cascade,
  restaurante_desafiante_id uuid not null references public.restaurante (id) on delete cascade,
  restaurante_desafiado_id uuid references public.restaurante (id) on delete cascade,
  -- sorteado quando o desafiado aceita
  jogo text,
  -- semente para os dois jogadores verem as mesmas rodadas
  semente integer not null default floor(random() * 1000000)::integer,
  status text not null default 'pendente'
    check (status in ('pendente', 'em_andamento', 'concluido', 'recusado', 'cancelado')),
  placar_desafiante numeric(6, 2),
  placar_desafiado numeric(6, 2),
  vencedor_id uuid references public.usuario (id),
  -- quantas vezes o jogo foi re-sorteado por empate
  rodada integer not null default 1,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (desafiante_id <> desafiado_id)
);

create index duelo_desafiante_idx on public.duelo (desafiante_id, status);
create index duelo_desafiado_idx on public.duelo (desafiado_id, status);

create trigger duelo_atualizado_em
  before update on public.duelo
  for each row execute function public.marcar_atualizado_em();

alter table public.duelo enable row level security;

create policy "duelo: participantes leem" on public.duelo
  for select to authenticated
  using (desafiante_id = (select auth.uid()) or desafiado_id = (select auth.uid()));

-- Só pode desafiar quem é amigo (amizade aceita em qualquer direção).
create policy "duelo: desafiante cria para amigo" on public.duelo
  for insert to authenticated
  with check (
    desafiante_id = (select auth.uid())
    and exists (
      select 1 from public.amizade a
      where a.status = 'aceita'
        and ((a.solicitante_id = desafiante_id and a.destinatario_id = desafiado_id)
          or (a.solicitante_id = desafiado_id and a.destinatario_id = desafiante_id))
    )
  );

-- Recusar/cancelar passam por update direto; aceitar e pontuar passam pelas funções abaixo.
create policy "duelo: participantes atualizam" on public.duelo
  for update to authenticated
  using (desafiante_id = (select auth.uid()) or desafiado_id = (select auth.uid()))
  with check (desafiante_id = (select auth.uid()) or desafiado_id = (select auth.uid()));

-- Jogos disponíveis para sorteio.
create or replace function public.jogos_disponiveis()
returns text[]
language sql
immutable
as $$
  select array['garcom', 'fatia', 'palpite', 'intruso', 'memoria', 'anagrama'];
$$;

-- O desafiado aceita escolhendo o seu restaurante; o jogo é sorteado aqui.
create or replace function public.aceitar_duelo(p_duelo_id uuid, p_restaurante_id uuid)
returns public.duelo
language plpgsql
security definer
set search_path = ''
as $$
declare
  d public.duelo;
  jogos text[] := public.jogos_disponiveis();
begin
  select * into d from public.duelo where id = p_duelo_id for update;
  if d.id is null then raise exception 'Duelo não encontrado'; end if;
  if d.desafiado_id <> (select auth.uid()) then raise exception 'Só o desafiado pode aceitar'; end if;
  if d.status <> 'pendente' then raise exception 'Este duelo não está mais pendente'; end if;
  if p_restaurante_id = d.restaurante_desafiante_id then
    raise exception 'Escolha um restaurante diferente do seu adversário';
  end if;

  update public.duelo
  set restaurante_desafiado_id = p_restaurante_id,
      jogo = jogos[1 + floor(random() * array_length(jogos, 1))::integer],
      status = 'em_andamento'
  where id = p_duelo_id
  returning * into d;
  return d;
end;
$$;

-- Registra o placar de quem chamou. Quando os dois têm placar, define o vencedor
-- (empate re-sorteia o jogo) e salva o restaurante vencedor no "Quero ir" dos dois.
create or replace function public.registrar_placar(p_duelo_id uuid, p_placar numeric)
returns public.duelo
language plpgsql
security definer
set search_path = ''
as $$
declare
  d public.duelo;
  eu uuid := (select auth.uid());
  jogos text[] := public.jogos_disponiveis();
  restaurante_vencedor uuid;
begin
  select * into d from public.duelo where id = p_duelo_id for update;
  if d.id is null then raise exception 'Duelo não encontrado'; end if;
  if d.status <> 'em_andamento' then raise exception 'Este duelo não está em andamento'; end if;
  if eu <> d.desafiante_id and eu <> d.desafiado_id then raise exception 'Você não participa deste duelo'; end if;

  if eu = d.desafiante_id then
    if d.placar_desafiante is not null then raise exception 'Você já jogou esta rodada'; end if;
    d.placar_desafiante := p_placar;
  else
    if d.placar_desafiado is not null then raise exception 'Você já jogou esta rodada'; end if;
    d.placar_desafiado := p_placar;
  end if;

  if d.placar_desafiante is not null and d.placar_desafiado is not null then
    if d.placar_desafiante = d.placar_desafiado then
      -- Empate: novo jogo, nova semente, placares zerados.
      update public.duelo
      set placar_desafiante = null,
          placar_desafiado = null,
          jogo = jogos[1 + floor(random() * array_length(jogos, 1))::integer],
          semente = floor(random() * 1000000)::integer,
          rodada = rodada + 1
      where id = p_duelo_id
      returning * into d;
      return d;
    end if;

    d.vencedor_id := case when d.placar_desafiante > d.placar_desafiado then d.desafiante_id else d.desafiado_id end;
    restaurante_vencedor := case when d.vencedor_id = d.desafiante_id
      then d.restaurante_desafiante_id else d.restaurante_desafiado_id end;

    update public.duelo
    set placar_desafiante = d.placar_desafiante,
        placar_desafiado = d.placar_desafiado,
        vencedor_id = d.vencedor_id,
        status = 'concluido'
    where id = p_duelo_id
    returning * into d;

    insert into public.favorito (usuario_id, restaurante_id, tipo)
    values (d.desafiante_id, restaurante_vencedor, 'quero_ir'),
           (d.desafiado_id, restaurante_vencedor, 'quero_ir')
    on conflict (usuario_id, restaurante_id, tipo) do nothing;
    return d;
  end if;

  update public.duelo
  set placar_desafiante = d.placar_desafiante,
      placar_desafiado = d.placar_desafiado
  where id = p_duelo_id
  returning * into d;
  return d;
end;
$$;

-- Permite ao app ouvir mudanças do duelo em tempo real (RLS continua valendo).
alter publication supabase_realtime add table public.duelo;
