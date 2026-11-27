-- ---------------------------------------------------------------------------
-- Exclusão da própria conta
--
-- O cliente não pode apagar linhas de auth.users (exige service role). Esta
-- função roda como dono (security definer) e apaga somente o usuário do JWT.
-- A cascata remove public.usuario e, a partir dele, avaliações, favoritos,
-- amizades e duelos.
-- ---------------------------------------------------------------------------

-- duelo.vencedor_id não tinha regra de exclusão: quem venceu um duelo não
-- conseguiria apagar a conta. O duelo também é removido pela cascata de
-- desafiante_id/desafiado_id; o "set null" só evita o bloqueio da FK.
alter table public.duelo drop constraint if exists duelo_vencedor_id_fkey;
alter table public.duelo
  add constraint duelo_vencedor_id_fkey
  foreign key (vencedor_id) references public.usuario (id) on delete set null;

create or replace function public.excluir_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'não autenticado' using errcode = '42501';
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
