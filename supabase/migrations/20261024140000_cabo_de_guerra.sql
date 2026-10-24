-- Adiciona o Cabo de guerra (jogo em tempo real) ao sorteio.
create or replace function public.jogos_disponiveis()
returns text[]
language sql
immutable
as $$
  select array['garcom', 'fatia', 'palpite', 'intruso', 'memoria', 'anagrama', 'cabo'];
$$;
