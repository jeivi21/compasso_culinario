-- Endurecimento de segurança (revisão de 19/11/2026).
--
-- 1. usuario: o e-mail deixa de ser legível por outros usuários (privilégio por coluna)
--    e só nome/avatar/onboarding podem ser editados pelo dono.
-- 2. buscar_usuarios: continua buscando por nome ou e-mail, mas não devolve o e-mail.
-- 3. amizade: só o destinatário responde (aceita/recusa); o solicitante cancela com delete.
-- 4. duelo: update direto só muda `status` para recusado (desafiado) ou cancelado
--    (desafiante) enquanto pendente. Aceitar e pontuar continuam pelas funções.
-- 5. registrar_placar: placar limitado a 0–100.

-- ---------------------------------------------------------------------------
-- 1. usuario: privilégios por coluna
-- ---------------------------------------------------------------------------
revoke all on public.usuario from anon, authenticated;
grant select (id, nome, avatar_url, onboarding_concluido, criado_em) on public.usuario to authenticated;
grant update (nome, avatar_url, onboarding_concluido) on public.usuario to authenticated;

-- ---------------------------------------------------------------------------
-- 2. buscar_usuarios sem e-mail no resultado
-- ---------------------------------------------------------------------------
drop function if exists public.buscar_usuarios(text);

create or replace function public.buscar_usuarios(termo text)
returns table (id uuid, nome text)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.nome
  from public.usuario u
  where (select auth.uid()) is not null
    and u.id <> (select auth.uid())
    and char_length(trim(termo)) >= 2
    and (u.nome ilike '%' || trim(termo) || '%' or u.email ilike trim(termo) || '%')
  order by u.nome
  limit 20;
$$;

revoke all on function public.buscar_usuarios(text) from public, anon;
grant execute on function public.buscar_usuarios(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. amizade: só o destinatário responde, e só enquanto pendente
-- ---------------------------------------------------------------------------
drop policy if exists "amizade: participantes atualizam" on public.amizade;

revoke update on public.amizade from anon, authenticated;
grant update (status, respondido_em) on public.amizade to authenticated;

create policy "amizade: destinatário responde" on public.amizade
  for update to authenticated
  using (destinatario_id = (select auth.uid()) and status = 'pendente')
  with check (destinatario_id = (select auth.uid()) and status in ('aceita', 'recusada'));

-- ---------------------------------------------------------------------------
-- 4. duelo: update direto só para recusar/cancelar um duelo pendente
-- ---------------------------------------------------------------------------
drop policy if exists "duelo: participantes atualizam" on public.duelo;

revoke update on public.duelo from anon, authenticated;
grant update (status) on public.duelo to authenticated;

create policy "duelo: recusar ou cancelar pendente" on public.duelo
  for update to authenticated
  using (
    status = 'pendente'
    and (desafiante_id = (select auth.uid()) or desafiado_id = (select auth.uid()))
  )
  with check (
    (status = 'recusado' and desafiado_id = (select auth.uid()))
    or (status = 'cancelado' and desafiante_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- 5. registrar_placar: valida o intervalo do placar
-- ---------------------------------------------------------------------------
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
  if p_placar is null or p_placar < 0 or p_placar > 100 then
    raise exception 'Placar inválido';
  end if;

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

-- As funções `security definer` só devem ser chamadas por usuários logados.
revoke all on function public.aceitar_duelo(uuid, uuid) from public, anon;
grant execute on function public.aceitar_duelo(uuid, uuid) to authenticated;
revoke all on function public.registrar_placar(uuid, numeric) from public, anon;
grant execute on function public.registrar_placar(uuid, numeric) to authenticated;
