-- =====================================================================
-- LIMPEZA DE DADOS DE TESTE — RaqueteClub
-- Mantém: schema, tabelas, funções, políticas e sua conta de admin.
-- Apaga: grupos, cotas, cobranças, contemplações, ações e logs de teste.
-- Rode no Supabase SQL Editor. É IRREVERSÍVEL.
-- =====================================================================

-- Apagar grupos remove em cascata: cotas -> cobranças -> cobranca_acoes,
-- e contemplações (todas ligadas por ON DELETE CASCADE ao grupo/cota).
delete from grupos;

-- Logs independentes
delete from webhook_events;
delete from cobranca_acoes;   -- segurança (caso algo tenha ficado solto)

-- Resetar os dados de teste que ficaram no seu perfil admin
-- (mantém a conta, o e-mail e o papel de admin).
update profiles
   set cpf = null,
       telefone = null,
       score_credito = null,
       analise_credito_status = 'nao_consultado',
       analise_credito_em = null,
       asaas_customer_id = null
 where role = 'admin';

-- Conferência (deve retornar tudo 0)
select
  (select count(*) from grupos)        as grupos,
  (select count(*) from cotas)         as cotas,
  (select count(*) from cobrancas)     as cobrancas,
  (select count(*) from contemplacoes) as contemplacoes,
  (select count(*) from webhook_events) as webhooks;
