-- Duelos: registro de início de partida (anti-trapaça) e canal privado do Cabo de guerra.
--
-- 1. Cada jogador registra o início da partida (`iniciar_jogo`) antes de jogar, uma única
--    vez por rodada. Fechar o app no meio e jogar de novo a mesma semente deixa de ser
--    possível: o segundo início é recusado e só resta enviar o placar (ou desistir com 0).
-- 2. `registrar_placar` exige o início registrado e um tempo mínimo de partida, exceto
--    para desistência (placar 0). Em empate os inícios são zerados com os placares.
-- 3. O canal Realtime `cabo-<duelo>` passa a ser privado: só os dois participantes
--    recebem e enviam mensagens e presença.
--
-- Limite conhecido: o placar continua calculado no celular. Um cliente modificado ainda
-- pode informar um placar alto depois do tempo mínimo; validação completa exigiria
-- reproduzir as jogadas no servidor.

-- ---------------------------------------------------------------------------
-- 1. Início da partida
-- ---------------------------------------------------------------------------
alter table public.duelo
  add column if not exists inicio_desafiante timestamptz,
  add column if not exists inicio_desafiado timestamptz;

create or replace function public.iniciar_jogo(p_duelo_id uuid)
returns public.duelo
language plpgsql
security definer
set search_path = ''
as $$
declare
  d public.duelo;
  eu uuid := (select auth.uid());
begin
  select * into d from public.duelo where id = p_duelo_id for update;
  if d.id is null then raise exception 'Duelo não encontrado'; end if;
  if eu is null or (eu <> d.desafiante_id and eu <> d.desafiado_id) then
    raise exception 'Você não participa deste duelo';
  end if;
  if d.status <> 'em_andamento' then raise exception 'Este duelo não está em andamento'; end if;

  if eu = d.desafiante_id then
    if d.placar_desafiante is not null then raise exception 'Você já jogou esta rodada'; end if;
    if d.inicio_desafiante is not null then raise exception 'Você já começou esta rodada'; end if;
    update public.duelo set inicio_desafiante = now() where id = p_duelo_id returning * into d;
  else
    if d.placar_desafiado is not null then raise exception 'Você já jogou esta rodada'; end if;
    if d.inicio_desafiado is not null then raise exception 'Você já começou esta rodada'; end if;
    update public.duelo set inicio_desafiado = now() where id = p_duelo_id returning * into d;
  end if;
  return d;
end;
$$;

revoke all on function public.iniciar_jogo(uuid) from public, anon;
grant execute on function public.iniciar_jogo(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. registrar_placar com início obrigatório e tempo mínimo
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
  meu_inicio timestamptz;
  max_rodadas constant integer := 5;
  -- Nenhum minijogo termina em menos que isto; placar positivo antes disso é suspeito.
  duracao_minima constant interval := interval '5 seconds';
begin
  if p_placar is null or p_placar < 0 or p_placar > 100 then
    raise exception 'Placar inválido';
  end if;

  select * into d from public.duelo where id = p_duelo_id for update;
  if d.id is null then raise exception 'Duelo não encontrado'; end if;
  if d.status <> 'em_andamento' then raise exception 'Este duelo não está em andamento'; end if;
  if eu is null or (eu <> d.desafiante_id and eu <> d.desafiado_id) then
    raise exception 'Você não participa deste duelo';
  end if;

  meu_inicio := case when eu = d.desafiante_id then d.inicio_desafiante else d.inicio_desafiado end;
  if meu_inicio is null then raise exception 'Comece o jogo antes de enviar o placar'; end if;
  if p_placar > 0 and now() - meu_inicio < duracao_minima then
    raise exception 'Placar enviado cedo demais';
  end if;

  if eu = d.desafiante_id then
    if d.placar_desafiante is not null then raise exception 'Você já jogou esta rodada'; end if;
    d.placar_desafiante := p_placar;
  else
    if d.placar_desafiado is not null then raise exception 'Você já jogou esta rodada'; end if;
    d.placar_desafiado := p_placar;
  end if;

  if d.placar_desafiante is not null and d.placar_desafiado is not null then
    if d.placar_desafiante = d.placar_desafiado and d.rodada < max_rodadas then
      -- Empate: novo jogo, nova semente, placares e inícios zerados.
      update public.duelo
      set placar_desafiante = null,
          placar_desafiado = null,
          inicio_desafiante = null,
          inicio_desafiado = null,
          jogo = jogos[1 + floor(random() * array_length(jogos, 1))::integer],
          semente = floor(random() * 1000000)::integer,
          rodada = rodada + 1
      where id = p_duelo_id
      returning * into d;
      return d;
    end if;

    if d.placar_desafiante = d.placar_desafiado then
      -- Empates demais: desempate por sorteio para o duelo não ficar aberto para sempre.
      d.vencedor_id := case when random() < 0.5 then d.desafiante_id else d.desafiado_id end;
    else
      d.vencedor_id := case when d.placar_desafiante > d.placar_desafiado
        then d.desafiante_id else d.desafiado_id end;
    end if;
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

revoke all on function public.registrar_placar(uuid, numeric) from public, anon;
grant execute on function public.registrar_placar(uuid, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Canal privado do Cabo de guerra (Realtime Authorization)
-- ---------------------------------------------------------------------------
drop policy if exists "cabo: participantes recebem" on realtime.messages;
create policy "cabo: participantes recebem" on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension in ('broadcast', 'presence')
    and exists (
      select 1 from public.duelo d
      where (select realtime.topic()) = 'cabo-' || d.id::text
        and (select auth.uid()) in (d.desafiante_id, d.desafiado_id)
    )
  );

drop policy if exists "cabo: participantes enviam" on realtime.messages;
create policy "cabo: participantes enviam" on realtime.messages
  for insert to authenticated
  with check (
    realtime.messages.extension in ('broadcast', 'presence')
    and exists (
      select 1 from public.duelo d
      where (select realtime.topic()) = 'cabo-' || d.id::text
        and (select auth.uid()) in (d.desafiante_id, d.desafiado_id)
    )
  );
