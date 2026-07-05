-- =====================================================================
-- PADEL CLUBE — Clube de contemplação de raquetes (consórcio simplificado)
-- Schema Postgres / Supabase
-- Núcleo: GRUPOS -> COTAS -> COBRANÇAS (mensalidades) -> CONTEMPLAÇÕES
-- =====================================================================

-- Extensões
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role       as enum ('admin', 'participante');
  create type grupo_status     as enum ('formando', 'ativo', 'encerrado', 'cancelado');
  create type cota_status       as enum ('ativa', 'contemplada', 'inadimplente', 'cancelada', 'quitada');
  create type cobranca_status   as enum ('pendente', 'pago', 'atrasado', 'cancelado', 'estornado');
  create type forma_pagamento   as enum ('boleto', 'pix', 'cartao', 'cartao_recorrente');
  create type contemplacao_tipo as enum ('ordem', 'sorteio', 'lance');
  create type analise_status    as enum ('pendente', 'aprovado', 'recusado', 'nao_consultado');
  create type acao_cobranca_tipo as enum ('lembrete', 'notificacao', 'negativacao', 'protesto', 'juridico', 'acordo');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- PROFILES (espelha auth.users)
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'participante',
  nome        text not null default '',
  cpf         text,               -- necessário p/ Asaas gerar cobrança
  email       text,
  telefone    text,
  asaas_customer_id text,         -- id do cliente no Asaas
  -- análise de crédito na adesão
  score_credito        int,
  analise_credito_status analise_status not null default 'nao_consultado',
  analise_credito_em   timestamptz,
  criado_em   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- GRUPOS  (um "grupo de consórcio")
-- ---------------------------------------------------------------------
create table if not exists grupos (
  id                    uuid primary key default gen_random_uuid(),
  nome                  text not null,
  descricao             text,
  bem_descricao         text,                 -- ex.: "Raquete Adidas Metalbone 3.3"
  bem_valor             numeric(12,2) not null default 2500,  -- preço de mercado (o que o cliente "compra")
  bem_custo             numeric(12,2) not null default 1399,  -- custo real da raquete (p/ lucro)
  valor_mensal          numeric(12,2) not null default 110,   -- mensalidade da cota
  taxa_adm_percent      numeric(5,2) not null default 15,     -- % de adm (já embutido na margem)
  multa_atraso_percent  numeric(5,2) not null default 2,      -- multa sobre atraso (teto legal CDC)
  juros_dia_percent     numeric(6,4) not null default 0.0333, -- ~1% a.m. (teto legal)
  total_cotas           int not null default 24,   -- tamanho do grupo (nº de vagas)
  duracao_meses         int not null default 24,   -- nº de parcelas
  contemplados_por_mes  int not null default 1,    -- quantas raquetes por mês
  contemplavel_apos_parcelas int not null default 3, -- trava anti-calote: elegível só após N parcelas pagas
  contemplacao_padrao   contemplacao_tipo not null default 'ordem',
  status                grupo_status not null default 'formando',
  data_inicio           date,                  -- 1ª competência
  criado_em             timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- COTAS  (a "vaga" do participante dentro de um grupo)
-- Um participante pode ter várias cotas.
-- ---------------------------------------------------------------------
create table if not exists cotas (
  id             uuid primary key default gen_random_uuid(),
  grupo_id       uuid not null references grupos(id) on delete cascade,
  participante_id uuid references profiles(id) on delete set null,
  numero         int not null,                 -- nº da cota dentro do grupo (1..total_cotas)
  asaas_subscription_id text,                  -- assinatura recorrente no Asaas
  -- cartão tokenizado (débito automático) — NÃO guardamos o nº do cartão
  cartao_token   text,
  cartao_ultimos4 text,
  cartao_bandeira text,
  -- aceite do contrato + nota promissória (validade jurídica)
  aceite_em      timestamptz,
  aceite_ip      text,
  contrato_snapshot jsonb,                     -- valores congelados no momento da adesão
  status         cota_status not null default 'ativa',
  pontuacao      numeric(10,2) not null default 0, -- antiguidade + adimplência (fila de contemplação)
  contemplada_em date,
  data_adesao    date not null default current_date,
  criado_em      timestamptz not null default now(),
  unique (grupo_id, numero)
);
create index if not exists idx_cotas_grupo on cotas(grupo_id);
create index if not exists idx_cotas_part  on cotas(participante_id);

-- ---------------------------------------------------------------------
-- COBRANÇAS  (mensalidades / parcelas — sincronizadas com o Asaas)
-- ---------------------------------------------------------------------
create table if not exists cobrancas (
  id                uuid primary key default gen_random_uuid(),
  cota_id           uuid not null references cotas(id) on delete cascade,
  grupo_id          uuid not null references grupos(id) on delete cascade,
  competencia       date not null,             -- 1º dia do mês de referência (yyyy-mm-01)
  parcela_num       int,                       -- 1..duracao_meses
  valor             numeric(12,2) not null,
  valor_taxa_adm    numeric(12,2) not null default 0, -- parte da taxa de adm nesta parcela (RECEITA)
  vencimento        date not null,
  status            cobranca_status not null default 'pendente',
  forma             forma_pagamento,
  -- integração Asaas
  asaas_payment_id  text unique,
  asaas_invoice_url text,                       -- link da fatura (boleto/pix)
  asaas_pix_qr      text,
  -- liquidação
  data_pagamento    date,
  valor_pago        numeric(12,2),
  -- escalada de inadimplência
  dias_atraso       int not null default 0,
  notificado_em     timestamptz,   -- notificação prévia (Súmula 359 STJ) enviada
  negativado_em     timestamptz,   -- incluído no Serasa via Asaas
  protestado_em     timestamptz,   -- protesto em cartório via Asaas
  criado_em         timestamptz not null default now(),
  unique (cota_id, competencia)
);
create index if not exists idx_cob_cota   on cobrancas(cota_id);
create index if not exists idx_cob_status on cobrancas(status);
create index if not exists idx_cob_venc   on cobrancas(vencimento);

-- ---------------------------------------------------------------------
-- CONTEMPLAÇÕES  (quem foi contemplado em cada competência)
-- ---------------------------------------------------------------------
create table if not exists contemplacoes (
  id            uuid primary key default gen_random_uuid(),
  grupo_id      uuid not null references grupos(id) on delete cascade,
  cota_id       uuid not null references cotas(id) on delete cascade,
  competencia   date not null,
  tipo          contemplacao_tipo not null default 'ordem',
  posicao_fila  int,                            -- pontuação/posição no momento
  entregue      boolean not null default false, -- raquete entregue?
  entregue_em   date,
  obs           text,
  criado_em     timestamptz not null default now(),
  unique (grupo_id, cota_id)   -- uma cota só é contemplada uma vez
);
create index if not exists idx_cont_grupo on contemplacoes(grupo_id);

-- ---------------------------------------------------------------------
-- COBRANCA_ACOES  (log da régua de cobrança / escalada legal)
-- Trilha de auditoria: prova que a notificação prévia foi feita antes de negativar.
-- ---------------------------------------------------------------------
create table if not exists cobranca_acoes (
  id           uuid primary key default gen_random_uuid(),
  cobranca_id  uuid not null references cobrancas(id) on delete cascade,
  cota_id      uuid references cotas(id) on delete set null,
  tipo         acao_cobranca_tipo not null,
  canal        text,                 -- email | sms | whatsapp | serasa | cartorio
  resultado    text,                 -- enviado | pago | falhou | agendado
  detalhe      text,
  criado_em    timestamptz not null default now()
);
create index if not exists idx_acoes_cob on cobranca_acoes(cobranca_id);

-- ---------------------------------------------------------------------
-- WEBHOOK_EVENTS  (log bruto dos webhooks do Asaas — idempotência)
-- ---------------------------------------------------------------------
create table if not exists webhook_events (
  id           uuid primary key default gen_random_uuid(),
  provider     text not null default 'asaas',
  event_id     text,                            -- id do evento (idempotência)
  event_type   text,
  payload      jsonb not null,
  processado   boolean not null default false,
  recebido_em  timestamptz not null default now(),
  unique (provider, event_id)
);

-- =====================================================================
-- VIEWS de apoio
-- =====================================================================

-- Financeiro por grupo: arrecadação, custo das raquetes entregues e LUCRO real.
-- Lucro reconhecido = tudo que entrou (parcelas pagas) − custo das raquetes já entregues.
create or replace view v_financeiro_grupo as
select
  g.id   as grupo_id,
  g.nome as grupo,
  g.bem_custo,
  -- arrecadação
  count(c.*) filter (where c.status = 'pago')                    as parcelas_pagas,
  coalesce(sum(c.valor_pago) filter (where c.status = 'pago'),0) as arrecadado,
  coalesce(sum(c.valor),0)                                       as arrecadacao_prevista,
  -- custo já desembolsado (raquetes entregues) — usa custo_real quando informado
  count(ct.*) filter (where ct.entregue)                         as raquetes_entregues,
  coalesce(sum(coalesce(ct.custo_real, g.bem_custo)) filter (where ct.entregue),0) as custo_desembolsado,
  -- lucro em caixa (arrecadado − custo entregue)
  coalesce(sum(c.valor_pago) filter (where c.status = 'pago'),0)
    - coalesce(sum(coalesce(ct.custo_real, g.bem_custo)) filter (where ct.entregue),0) as lucro_caixa,
  -- lucro projetado ao fim do grupo
  (g.total_cotas * g.valor_mensal * g.duracao_meses) - (g.total_cotas * g.bem_custo) as lucro_projetado
from grupos g
left join cobrancas c    on c.grupo_id = g.id
left join contemplacoes ct on ct.grupo_id = g.id
group by g.id, g.nome, g.bem_custo, g.total_cotas, g.valor_mensal, g.duracao_meses;

-- Situação de inadimplência por cota
create or replace view v_inadimplencia as
select
  co.id as cota_id, co.grupo_id, co.numero, p.nome as participante,
  count(*) filter (where cb.status = 'atrasado')                 as parcelas_atrasadas,
  coalesce(sum(cb.valor) filter (where cb.status = 'atrasado'),0) as valor_em_atraso,
  min(cb.vencimento) filter (where cb.status = 'atrasado')        as atraso_mais_antigo
from cotas co
join grupos g on g.id = co.grupo_id
left join cobrancas cb on cb.cota_id = co.id
left join profiles p on p.id = co.participante_id
group by co.id, co.grupo_id, co.numero, p.nome;

-- =====================================================================
-- FUNÇÃO: recalcula pontuação da cota (fila de contemplação)
-- Pontuação = antiguidade (dias/30) + adimplência (parcelas pagas*10) - atrasos*15
-- =====================================================================
create or replace function recalc_pontuacao(p_cota_id uuid)
returns void language plpgsql as $$
declare
  v_ades     date;
  v_pagas    int;
  v_atrasos  int;
  v_pontos   numeric;
begin
  select data_adesao into v_ades from cotas where id = p_cota_id;
  select count(*) filter (where status = 'pago'),
         count(*) filter (where status = 'atrasado')
    into v_pagas, v_atrasos
    from cobrancas where cota_id = p_cota_id;

  v_pontos := (current_date - v_ades)/30.0 + coalesce(v_pagas,0)*10 - coalesce(v_atrasos,0)*15;
  update cotas set pontuacao = greatest(v_pontos, 0) where id = p_cota_id;
end $$;

-- =====================================================================
-- FUNÇÃO: contempla o próximo lote do grupo (por ordem/adimplência)
-- Retorna as cotas contempladas na competência informada.
-- =====================================================================
create or replace function contemplar_grupo(p_grupo_id uuid, p_competencia date)
returns setof cotas language plpgsql as $$
declare
  v_qtd       int;
  v_min_parc  int;
begin
  select contemplados_por_mes, contemplavel_apos_parcelas
    into v_qtd, v_min_parc
    from grupos where id = p_grupo_id;

  return query
  with elegiveis as (
    select co.*
    from cotas co
    where co.grupo_id = p_grupo_id
      and co.status = 'ativa'
      and co.aceite_em is not null   -- só quem aceitou o contrato online
      -- adimplente: sem nenhuma parcela em atraso
      and not exists (
        select 1 from cobrancas cb
        where cb.cota_id = co.id and cb.status = 'atrasado'
      )
      -- trava anti-calote: já pagou o mínimo de parcelas exigido
      and (
        select count(*) from cobrancas cb
        where cb.cota_id = co.id and cb.status = 'pago'
      ) >= v_min_parc
    order by co.pontuacao desc, co.data_adesao asc, co.numero asc
    limit v_qtd
  ),
  ins as (
    insert into contemplacoes (grupo_id, cota_id, competencia, tipo, posicao_fila)
    select p_grupo_id, e.id, p_competencia, 'ordem', e.pontuacao
    from elegiveis e
    on conflict (grupo_id, cota_id) do nothing
    returning cota_id
  ),
  upd as (
    update cotas set status = 'contemplada', contemplada_em = p_competencia
    where id in (select cota_id from ins)
    returning *
  )
  select * from upd;
end $$;

-- =====================================================================
-- RLS (Row Level Security)
-- =====================================================================
alter table profiles      enable row level security;
alter table grupos        enable row level security;
alter table cotas         enable row level security;
alter table cobrancas     enable row level security;
alter table contemplacoes enable row level security;
alter table cobranca_acoes enable row level security;

-- helper: é admin?
create or replace function is_admin()
returns boolean language sql stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- profiles: cada um vê o seu; admin vê todos
drop policy if exists profiles_self on profiles;
create policy profiles_self on profiles
  for select using (id = auth.uid() or is_admin());
drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles
  for update using (id = auth.uid() or is_admin());

-- grupos: todos autenticados leem; só admin escreve
drop policy if exists grupos_read on grupos;
create policy grupos_read on grupos for select using (auth.role() = 'authenticated');
drop policy if exists grupos_write on grupos;
create policy grupos_write on grupos for all using (is_admin()) with check (is_admin());

-- cotas: participante vê as suas; admin tudo
drop policy if exists cotas_read on cotas;
create policy cotas_read on cotas for select
  using (participante_id = auth.uid() or is_admin());
drop policy if exists cotas_write on cotas;
create policy cotas_write on cotas for all using (is_admin()) with check (is_admin());

-- cobrancas: participante vê as das suas cotas; admin tudo
drop policy if exists cob_read on cobrancas;
create policy cob_read on cobrancas for select using (
  is_admin() or exists (
    select 1 from cotas co where co.id = cobrancas.cota_id and co.participante_id = auth.uid()
  )
);
drop policy if exists cob_write on cobrancas;
create policy cob_write on cobrancas for all using (is_admin()) with check (is_admin());

-- contemplacoes: participante vê as suas; admin tudo
drop policy if exists cont_read on contemplacoes;
create policy cont_read on contemplacoes for select using (
  is_admin() or exists (
    select 1 from cotas co where co.id = contemplacoes.cota_id and co.participante_id = auth.uid()
  )
);
drop policy if exists cont_write on contemplacoes;
create policy cont_write on contemplacoes for all using (is_admin()) with check (is_admin());

-- cobranca_acoes: só admin (dados sensíveis de cobrança)
drop policy if exists acoes_admin on cobranca_acoes;
create policy acoes_admin on cobranca_acoes for all using (is_admin()) with check (is_admin());

-- =====================================================================
-- TRIGGER: cria profile automático ao registrar usuário
-- =====================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (id, email, nome)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nome',''))
  on conflict (id) do nothing;
  return new;
exception when others then
  -- nunca bloquear a criação do usuário por causa do profile
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================================
-- RAQUETE (modelo + imagem + descrição) — por GRUPO e por COTA
-- Idempotente: pode rodar no banco já existente.
-- =====================================================================
alter table grupos add column if not exists bem_modelo text;
alter table grupos add column if not exists bem_imagem_url text;
alter table cotas  add column if not exists raquete_modelo text;
alter table cotas  add column if not exists raquete_descricao text;
alter table cotas  add column if not exists raquete_imagem_url text;

-- Aprovação manual de cadastro + tipo de pagamento (cartão recorrente/parcelado)
alter type cota_status add value if not exists 'aguardando';  -- aguardando aprovação do admin
alter table cotas add column if not exists aprovada_em timestamptz;
alter table cotas add column if not exists pagamento_tipo text not null default 'recorrente';
  -- recorrente | parcelado
alter table cotas add column if not exists parcelas int;  -- nº de parcelas no cartão (parcelado)

-- Fluxo de compra/entrega da raquete ao contemplado (gestão logística + custo real)
alter table contemplacoes add column if not exists status_entrega text not null default 'aguardando';
  -- aguardando | comprado | enviado | entregue
alter table contemplacoes add column if not exists custo_real numeric(12,2);
alter table contemplacoes add column if not exists fornecedor text;
alter table contemplacoes add column if not exists rastreio text;

-- Bucket público de imagens de raquetes
insert into storage.buckets (id, name, public)
values ('raquetes', 'raquetes', true)
on conflict (id) do nothing;

-- Políticas do bucket: leitura pública, escrita/edição por autenticados
drop policy if exists raquetes_read   on storage.objects;
drop policy if exists raquetes_write  on storage.objects;
drop policy if exists raquetes_update on storage.objects;
drop policy if exists raquetes_delete on storage.objects;
create policy raquetes_read   on storage.objects for select
  using (bucket_id = 'raquetes');
create policy raquetes_write  on storage.objects for insert to authenticated
  with check (bucket_id = 'raquetes');
create policy raquetes_update on storage.objects for update to authenticated
  using (bucket_id = 'raquetes');
create policy raquetes_delete on storage.objects for delete to authenticated
  using (bucket_id = 'raquetes');
