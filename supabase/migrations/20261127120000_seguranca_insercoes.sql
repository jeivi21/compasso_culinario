-- Endurecimento de segurança, parte 2 (auditoria de 27/11/2026).
--
-- A migração de 19/11 limitou os UPDATEs, mas os INSERTs continuavam aceitando qualquer
-- coluna. Isto permitia, por exemplo, criar uma amizade já "aceita" ou um duelo já
-- "em_andamento" com o placar do adversário preenchido.
--
-- 1. amizade: insert só de (solicitante_id, destinatario_id), sempre pendente.
-- 2. duelo: insert só de (desafiante, desafiado, restaurante do desafiante), sempre pendente.
-- 3. aceitar_duelo: valida o restaurante, revalida a amizade e sorteia nova semente.
-- 4. registrar_placar: depois de 5 empates seguidos o vencedor é sorteado.
-- 5. buscar_usuarios: e-mail só por correspondência exata; curingas escapados.
-- 6. restaurante: remove o cadastro manual pelo cliente (o app não usa).
-- 7. avaliacao: datas e foto_url deixam de ser definidas pelo cliente.
-- 8. usuario: limites de nome e avatar no banco (não só no app).
-- 9. restaurantes_proximos: raio limitado e resultado com teto.

-- ---------------------------------------------------------------------------
-- 1. amizade
-- ---------------------------------------------------------------------------
revoke insert on public.amizade from anon, authenticated;
grant insert (solicitante_id, destinatario_id) on public.amizade to authenticated;

drop policy if exists "amizade: solicitante cria" on public.amizade;
create policy "amizade: solicitante cria" on public.amizade
  for insert to authenticated
  with check (
    solicitante_id = (select auth.uid())
    and status = 'pendente'
    and respondido_em is null
  );

-- ---------------------------------------------------------------------------
-- 2. duelo
-- ---------------------------------------------------------------------------
revoke insert on public.duelo from anon, authenticated;
grant insert (desafiante_id, desafiado_id, restaurante_desafiante_id) on public.duelo to authenticated;

drop policy if exists "duelo: desafiante cria para amigo" on public.duelo;
create policy "duelo: desafiante cria para amigo" on public.duelo
  for insert to authenticated
  with check (
    desafiante_id = (select auth.uid())
    and status = 'pendente'
    and jogo is null
    and restaurante_desafiado_id is null
    and placar_desafiante is null
    and placar_desafiado is null
    and vencedor_id is null
    and rodada = 1
    and exists (
      select 1 from public.amizade a
      where a.status = 'aceita'
        and ((a.solicitante_id = desafiante_id and a.destinatario_id = desafiado_id)
          or (a.solicitante_id = desafiado_id and a.destinatario_id = desafiante_id))
    )
  );

-- ---------------------------------------------------------------------------
-- 3. aceitar_duelo
-- ---------------------------------------------------------------------------
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
  if p_restaurante_id is null
     or not exists (select 1 from public.restaurante r where r.id = p_restaurante_id) then
    raise exception 'Restaurante inválido';
  end if;
  if p_restaurante_id = d.restaurante_desafiante_id then
    raise exception 'Escolha um restaurante diferente do seu adversário';
  end if;
  if not exists (
    select 1 from public.amizade a
    where a.status = 'aceita'
      and ((a.solicitante_id = d.desafiante_id and a.destinatario_id = d.desafiado_id)
        or (a.solicitante_id = d.desafiado_id and a.destinatario_id = d.desafiante_id))
  ) then
    raise exception 'Vocês não são mais amigos';
  end if;

  -- Semente nova: o desafiante não pode treinar a partida antes do aceite.
  update public.duelo
  set restaurante_desafiado_id = p_restaurante_id,
      jogo = jogos[1 + floor(random() * array_length(jogos, 1))::integer],
      semente = floor(random() * 1000000)::integer,
      status = 'em_andamento'
  where id = p_duelo_id
  returning * into d;
  return d;
end;
$$;

revoke all on function public.aceitar_duelo(uuid, uuid) from public, anon;
grant execute on function public.aceitar_duelo(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. registrar_placar: teto de empates
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
  max_rodadas constant integer := 5;
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
    if d.placar_desafiante = d.placar_desafiado and d.rodada < max_rodadas then
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
-- 5. buscar_usuarios: sem oráculo de prefixo de e-mail
-- ---------------------------------------------------------------------------
create or replace function public.buscar_usuarios(termo text)
returns table (id uuid, nome text)
language sql
stable
security definer
set search_path = ''
as $$
  with t as (
    select
      trim(termo) as valor,
      replace(replace(replace(trim(termo), '\', '\\'), '%', '\%'), '_', '\_') as escapado
  )
  select u.id, u.nome
  from public.usuario u, t
  where (select auth.uid()) is not null
    and u.id <> (select auth.uid())
    and char_length(t.valor) between 2 and 100
    and (u.nome ilike '%' || t.escapado || '%' or lower(u.email) = lower(t.valor))
  order by u.nome
  limit 20;
$$;

revoke all on function public.buscar_usuarios(text) from public, anon;
grant execute on function public.buscar_usuarios(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. restaurante: sem cadastro pelo cliente
-- ---------------------------------------------------------------------------
drop policy if exists "restaurante: usuário logado cadastra" on public.restaurante;
revoke insert, update, delete on public.restaurante from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. avaliacao: cliente define só as notas e o comentário
-- ---------------------------------------------------------------------------
revoke insert, update on public.avaliacao from anon, authenticated;
grant insert (usuario_id, restaurante_id, comida, atendimento, preco, ambiente, comentario)
  on public.avaliacao to authenticated;
grant update (comida, atendimento, preco, ambiente, comentario) on public.avaliacao to authenticated;

-- ---------------------------------------------------------------------------
-- 8. usuario: limites no banco
-- ---------------------------------------------------------------------------
-- `not valid`: vale para novas escritas sem travar a migração por dados antigos.
alter table public.usuario
  add constraint usuario_nome_tamanho check (char_length(trim(nome)) between 2 and 60) not valid,
  add constraint usuario_avatar_https check (avatar_url is null or avatar_url ~ '^https://') not valid;

create or replace function public.criar_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  nome_informado text := left(trim(coalesce(new.raw_user_meta_data ->> 'nome', '')), 60);
begin
  if char_length(nome_informado) < 2 then
    nome_informado := left(split_part(new.email, '@', 1), 60);
  end if;
  if char_length(nome_informado) < 2 then
    nome_informado := 'Usuário';
  end if;

  insert into public.usuario (id, nome, email)
  values (new.id, nome_informado, new.email);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. restaurantes_proximos: raio entre 100 m e 20 km, no máximo 300 linhas
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
  where lat between -90 and 90
    and lng between -180 and 180
    and extensions.st_dwithin(
      r.localizacao,
      extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography,
      least(greatest(coalesce(raio_m, 5000), 100), 20000)
    )
  order by distancia_m
  limit 300;
$$;
