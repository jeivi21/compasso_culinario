-- Seed de demonstração do CompassoCulinário.
--
-- 1. Categorias.
-- 2. Restaurantes de Paulo Afonso/BA vindos do OpenStreetMap (fonte = 'osm')
--    e 10 restaurantes FICTÍCIOS de exemplo (fonte = 'manual') para a demo ter volume.
-- 3. 30 usuários fictícios (senha: senha123) divididos em 3 perfis de gosto,
--    com avaliações geradas de forma determinística. Sem isso a Filtragem
--    Colaborativa não tem vizinhos para comparar.
--
-- Pode ser executado mais de uma vez: limpa os dados de seed antes de inserir.

select setseed(0.42);

-- ---------------------------------------------------------------------------
-- Limpeza de execuções anteriores
-- ---------------------------------------------------------------------------
delete from auth.users where email like '%@exemplo.compassoculinario.app';
delete from public.restaurante where fonte = 'osm' or nome in (
  'Cantina do Vale', 'Sushi Rio', 'Café com Prosa', 'Pizzaria Bella Massa',
  'Burguer da Praça', 'Tempero da Chapada', 'Espetinho do Zé',
  'Pastelaria Central', 'Casa do Peixe', 'Doce Mel Café'
);

-- ---------------------------------------------------------------------------
-- 1. Categorias
-- ---------------------------------------------------------------------------
insert into public.categoria (nome, icone) values
  ('Regional', 'restaurant-outline'),
  ('Churrascaria', 'flame-outline'),
  ('Pizzaria', 'pizza-outline'),
  ('Lanches', 'fast-food-outline'),
  ('Bar', 'beer-outline'),
  ('Sorveteria e açaí', 'ice-cream-outline'),
  ('Japonesa', 'fish-outline'),
  ('Cafeteria', 'cafe-outline'),
  ('Self-service', 'nutrition-outline')
on conflict (nome) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Restaurantes
-- ---------------------------------------------------------------------------
insert into public.restaurante (nome, categoria_id, latitude, longitude, endereco, faixa_preco, fonte, osm_id)
select v.nome, c.id, v.lat, v.lng, v.endereco, v.faixa, 'osm', v.osm_id
from (values
  ('Visual',                                        'Bar',               -9.40128, -38.21717, null,                               2, 2542587940::bigint),
  ('O Gato Risonho',                                'Bar',               -9.40174, -38.21279, 'Rua Petrolina',                    2, 2542588691),
  ('Catedral',                                      'Bar',               -9.40106, -38.21726, null,                               2, 2544292625),
  ('Boteco Spartacus',                              'Bar',               -9.40111, -38.21703, null,                               1, 2544292848),
  ('GG-BAR',                                        'Bar',               -9.41032, -38.20509, null,                               1, 2544292849),
  ('Amazônia MIX',                                  'Lanches',           -9.40187, -38.21672, null,                               1, 2544295940),
  ('Mister Mix',                                    'Lanches',           -9.40197, -38.21667, null,                               1, 2544296014),
  ('Subway',                                        'Lanches',           -9.40417, -38.21617, null,                               2, 2544296646),
  ('Vila Matias',                                   'Bar',               -9.44787, -38.23840, null,                               2, 2549105209),
  ('Bar Bate Papo',                                 'Bar',               -9.40497, -38.21286, null,                               1, 2573478931),
  ('Pizzaria Mão na Massa',                         'Pizzaria',          -9.40643, -38.21566, null,                               2, 2573608948),
  ('Choparia da Ilha',                              'Bar',               -9.39824, -38.22982, null,                               2, 4116913567),
  ('Churrascaria e Pizzaria Rodízio Nativo Grill',  'Churrascaria',      -9.40065, -38.21963, null,                               3, 4211160193),
  ('Sorvetes Pingmel',                              'Sorveteria e açaí', -9.40126, -38.21972, null,                               1, 4211160194),
  ('Lanchonete Gloria',                             'Lanches',           -9.33954, -38.24748, null,                               1, 4719430292),
  ('Açaí Tupí',                                     'Sorveteria e açaí', -9.37705, -38.24081, null,                               1, 10230940203),
  ('Sorveteria Bom',                                'Sorveteria e açaí', -9.44339, -38.21583, null,                               1, 10231269237),
  ('Mazé Almoço 10 reais',                          'Self-service',      -9.40965, -38.21987, null,                               1, 11591978069),
  ('Bar e Churrascaria Boi e Bode na Brasa',        'Churrascaria',      -9.36105, -38.27492, 'Rodovia BA-210',                   2, 13163173436),
  ('Restaurante Popular Dom Mário Zanetta',         'Regional',          -9.39727, -38.23350, 'Avenida Antônio Carlos Magalhães', 1, 1436688941)
) as v(nome, categoria, lat, lng, endereco, faixa, osm_id)
join public.categoria c on c.nome = v.categoria;

-- Restaurantes fictícios (apenas para demonstração).
insert into public.restaurante (nome, categoria_id, latitude, longitude, endereco, faixa_preco, fonte)
select v.nome, c.id, v.lat, v.lng, v.endereco, v.faixa, 'manual'
from (values
  ('Cantina do Vale',      'Regional',     -9.40310, -38.21420, 'Rua Landulfo Alves, 120',     2),
  ('Sushi Rio',            'Japonesa',     -9.40220, -38.21890, 'Av. Getúlio Vargas, 455',     3),
  ('Café com Prosa',       'Cafeteria',    -9.40380, -38.21710, 'Praça das Mangueiras, 18',    2),
  ('Pizzaria Bella Massa', 'Pizzaria',     -9.40790, -38.21230, 'Rua Marechal Deodoro, 300',   2),
  ('Burguer da Praça',     'Lanches',      -9.40450, -38.21960, 'Praça Coronel Sá, 7',         1),
  ('Tempero da Chapada',   'Self-service', -9.39950, -38.21580, 'Rua Siqueira Campos, 88',     1),
  ('Espetinho do Zé',      'Churrascaria', -9.40880, -38.21810, 'Rua Rui Barbosa, 210',        1),
  ('Pastelaria Central',   'Lanches',      -9.40050, -38.21350, 'Rua Floriano Peixoto, 54',    1),
  ('Casa do Peixe',        'Regional',     -9.39620, -38.22410, 'Orla do Rio São Francisco',   3),
  ('Doce Mel Café',        'Cafeteria',    -9.40600, -38.21440, 'Rua Petrolina, 260',          2)
) as v(nome, categoria, lat, lng, endereco, faixa)
join public.categoria c on c.nome = v.categoria;

-- ---------------------------------------------------------------------------
-- 3. Usuários fictícios e avaliações
-- ---------------------------------------------------------------------------
-- Perfis de gosto:
--   boteco  → bares, churrascarias
--   lanche  → lanches, pizza, sorvete e açaí
--   mesa    → regional, japonesa, cafeteria, self-service
create temp table seed_usuario (nome text, email text, perfil text, id uuid default gen_random_uuid());
insert into seed_usuario (nome, email, perfil) values
  ('Ana Souza',        'ana.souza@exemplo.compassoculinario.app',       'boteco'),
  ('Bruno Lima',       'bruno.lima@exemplo.compassoculinario.app',      'boteco'),
  ('Carla Mendes',     'carla.mendes@exemplo.compassoculinario.app',    'boteco'),
  ('Diego Rocha',      'diego.rocha@exemplo.compassoculinario.app',     'boteco'),
  ('Elaine Costa',     'elaine.costa@exemplo.compassoculinario.app',    'boteco'),
  ('Fábio Santos',     'fabio.santos@exemplo.compassoculinario.app',    'boteco'),
  ('Gabriela Nunes',   'gabriela.nunes@exemplo.compassoculinario.app',  'boteco'),
  ('Henrique Alves',   'henrique.alves@exemplo.compassoculinario.app',  'boteco'),
  ('Isabela Ferreira', 'isabela.ferreira@exemplo.compassoculinario.app','boteco'),
  ('João Pedro Dias',  'joao.dias@exemplo.compassoculinario.app',       'boteco'),
  ('Karen Oliveira',   'karen.oliveira@exemplo.compassoculinario.app',  'lanche'),
  ('Lucas Martins',    'lucas.martins@exemplo.compassoculinario.app',   'lanche'),
  ('Mariana Ribeiro',  'mariana.ribeiro@exemplo.compassoculinario.app', 'lanche'),
  ('Natan Barbosa',    'natan.barbosa@exemplo.compassoculinario.app',   'lanche'),
  ('Olívia Cardoso',   'olivia.cardoso@exemplo.compassoculinario.app',  'lanche'),
  ('Paulo Araújo',     'paulo.araujo@exemplo.compassoculinario.app',    'lanche'),
  ('Quésia Moura',     'quesia.moura@exemplo.compassoculinario.app',    'lanche'),
  ('Rafael Teixeira',  'rafael.teixeira@exemplo.compassoculinario.app', 'lanche'),
  ('Sara Gomes',       'sara.gomes@exemplo.compassoculinario.app',      'lanche'),
  ('Tiago Pereira',    'tiago.pereira@exemplo.compassoculinario.app',   'lanche'),
  ('Úrsula Freitas',   'ursula.freitas@exemplo.compassoculinario.app',  'mesa'),
  ('Vinícius Melo',    'vinicius.melo@exemplo.compassoculinario.app',   'mesa'),
  ('Wesley Campos',    'wesley.campos@exemplo.compassoculinario.app',   'mesa'),
  ('Ximena Duarte',    'ximena.duarte@exemplo.compassoculinario.app',   'mesa'),
  ('Yasmin Correia',   'yasmin.correia@exemplo.compassoculinario.app',  'mesa'),
  ('Zeca Batista',     'zeca.batista@exemplo.compassoculinario.app',    'mesa'),
  ('Amanda Lopes',     'amanda.lopes@exemplo.compassoculinario.app',    'mesa'),
  ('Bernardo Pinto',   'bernardo.pinto@exemplo.compassoculinario.app',  'mesa'),
  ('Camila Rezende',   'camila.rezende@exemplo.compassoculinario.app',  'mesa'),
  ('Daniel Fonseca',   'daniel.fonseca@exemplo.compassoculinario.app',  'mesa');

-- Contas de autenticação (o trigger ao_criar_usuario_auth cria o perfil em public.usuario).
-- Os campos de token precisam ser '' (não NULL), senão o serviço de auth falha no login.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
  extensions.crypt('senha123', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('nome', nome), now(), now(),
  '', '', '', '', '', '', '', ''
from seed_usuario;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, 'email',
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  now(), now(), now()
from seed_usuario;

update public.usuario set onboarding_concluido = true
where id in (select id from seed_usuario);

-- Afinidade de cada perfil com cada categoria (-1 = não curte, 0 = neutro, 1 = adora).
create temp table seed_afinidade (perfil text, categoria text, afinidade numeric);
insert into seed_afinidade values
  ('boteco', 'Bar', 1),            ('boteco', 'Churrascaria', 1),      ('boteco', 'Lanches', 0),
  ('boteco', 'Pizzaria', 0),       ('boteco', 'Sorveteria e açaí', -1),('boteco', 'Regional', 0),
  ('boteco', 'Japonesa', -1),      ('boteco', 'Cafeteria', -1),        ('boteco', 'Self-service', 0),
  ('lanche', 'Bar', 0),            ('lanche', 'Churrascaria', -1),     ('lanche', 'Lanches', 1),
  ('lanche', 'Pizzaria', 1),       ('lanche', 'Sorveteria e açaí', 1), ('lanche', 'Regional', -1),
  ('lanche', 'Japonesa', 0),       ('lanche', 'Cafeteria', 0),         ('lanche', 'Self-service', -1),
  ('mesa',   'Bar', -1),           ('mesa',   'Churrascaria', 0),      ('mesa',   'Lanches', -1),
  ('mesa',   'Pizzaria', 0),       ('mesa',   'Sorveteria e açaí', 0), ('mesa',   'Regional', 1),
  ('mesa',   'Japonesa', 1),       ('mesa',   'Cafeteria', 1),         ('mesa',   'Self-service', 1);

-- Qualidade intrínseca de cada restaurante (entre -0.6 e +0.6), fixa por nome.
create temp table seed_qualidade as
select r.id as restaurante_id, c.nome as categoria,
  ((('x' || substr(md5(r.nome), 1, 8))::bit(32)::bigint % 1000) / 1000.0 - 0.5) * 1.2 as qualidade
from public.restaurante r
join public.categoria c on c.id = r.categoria_id;

-- Cada usuário avalia cerca de 45% dos restaurantes, com viés forte do seu perfil.
insert into public.avaliacao (usuario_id, restaurante_id, comida, atendimento, preco, ambiente, comentario, criado_em)
select
  g.usuario_id, g.restaurante_id,
  g.comida, g.atendimento, g.preco, g.ambiente,
  case
    when (g.comida + g.atendimento + g.preco + g.ambiente) / 4.0 >= 4.5 then (array['Excelente, virou favorito!', 'Tudo impecável, recomendo.', 'Melhor da cidade na categoria.'])[1 + floor(random() * 3)::int]
    when (g.comida + g.atendimento + g.preco + g.ambiente) / 4.0 >= 3.5 then (array['Muito bom, voltaria.', 'Gostei bastante.', 'Boa opção para o dia a dia.'])[1 + floor(random() * 3)::int]
    when (g.comida + g.atendimento + g.preco + g.ambiente) / 4.0 >= 2.5 then (array['Razoável, nada demais.', 'Ok, mas esperava mais.', null])[1 + floor(random() * 3)::int]
    else (array['Não gostei.', 'Deixou a desejar.', null])[1 + floor(random() * 3)::int]
  end,
  now() - (random() * 90)::int * interval '1 day'
from (
  select
    u.id as usuario_id,
    q.restaurante_id,
    least(5, greatest(1, round(3.2 + 1.1 * a.afinidade + q.qualidade + (random() - 0.5) * 1.2)))::smallint as comida,
    least(5, greatest(1, round(3.4 + 0.6 * a.afinidade + q.qualidade + (random() - 0.5) * 1.6)))::smallint as atendimento,
    least(5, greatest(1, round(3.3 + 0.5 * a.afinidade + (random() - 0.5) * 1.6)))::smallint as preco,
    least(5, greatest(1, round(3.3 + 0.9 * a.afinidade + q.qualidade + (random() - 0.5) * 1.4)))::smallint as ambiente,
    random() as sorteio
  from seed_usuario u
  cross join seed_qualidade q
  join seed_afinidade a on a.perfil = u.perfil and a.categoria = q.categoria
) g
where g.sorteio < 0.45;

drop table seed_usuario;
drop table seed_afinidade;
drop table seed_qualidade;
