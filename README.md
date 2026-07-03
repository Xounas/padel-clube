# 🎾 Padel Clube — plataforma de contemplação de raquetes

Clube de assinatura estilo consórcio para raquetes de padel. Grupos pequenos,
mensalidade de R$80–100, contemplação por **ordem + adimplência**, cobrança
recorrente via **Asaas**, e o lucro na **taxa de administração**.

> ⚠️ **Aviso legal:** "consórcio" de bens (Lei 11.795/2008) é regulado pelo Banco
> Central e "sorteio" exige autorização da SECAP. Este produto é modelado como
> **clube de assinatura com contemplação por critério objetivo (fila)**, o que é
> mais defensável. Valide o modelo comercial com um advogado antes de escalar.

## Stack
- **Next.js 14** (App Router) + **TypeScript** → Vercel
- **Supabase** (Postgres + Auth + RLS)
- **Asaas** (cobrança recorrente, boleto/PIX/cartão, webhooks)

## Modelo de dados (o coração)
```
GRUPOS ──< COTAS ──< COBRANÇAS (mensalidades sincronizadas c/ Asaas)
   │          └──< CONTEMPLAÇÕES
   └─ taxa_adm_percent = LUCRO por parcela paga
```
- **grupos** — tamanho, valor mensal, taxa adm, nº contemplados/mês, duração.
- **cotas** — a vaga do participante no grupo (pode ter várias). Tem `pontuacao`.
- **cobrancas** — cada parcela; status atualizado pelo webhook do Asaas.
- **contemplacoes** — quem ganhou a raquete em cada mês.
- Funções SQL: `recalc_pontuacao()`, `contemplar_grupo()`.
- Views: `v_receita_adm` (lucro), `v_inadimplencia`.

## Números padrão (travados)
- Raquete: mercado R$2.500 / custo R$1.399. Mensalidade R$110 · 24 meses.
- Grupo padrão: 24 cotas · 1 contemplado/mês · trava de 3 parcelas p/ contemplar.
- Lucro ≈ R$1.241/cota (~R$29.784/grupo). Todos recebem até o fim.

## Setup
1. `cp .env.example .env.local` e preencha Supabase + Asaas (use **sandbox**).
2. No Supabase SQL Editor, rode `supabase/schema.sql`.
3. Crie seu 1º usuário no /login e promova a admin:
   `update profiles set role='admin' where email='voce@email.com';`
4. `npm install && npm run dev`.
5. No Asaas, aponte o webhook para `https://SEU_APP/api/webhooks/asaas`
   com o header token = `ASAAS_WEBHOOK_TOKEN`.
6. O cron de cobrança (`vercel.json`) roda diário; proteja com `CRON_SECRET`.

## Rotas
- `/` landing · `/login` auth
- `/app/aderir` adesão · `/app/minhas-cotas` área do participante
- `/admin/financeiro` · `/admin/grupos` · `/admin/cotas` · `/admin/cobrancas`
  · `/admin/inadimplencia` · `/admin/contemplacao`
- `/api/adesao` · `/api/webhooks/asaas` · `/api/cron/cobranca`

## Status
- [x] Schema + RLS + funções de contemplação/inadimplência
- [x] Cliente Asaas (customer + subscription + payment + negativação Serasa)
- [x] Webhook Asaas → sincroniza cobranças
- [x] Auth (login admin / participante) + guardas de rota
- [x] Fluxo de adesão (score → cliente Asaas → cota → assinatura recorrente)
- [x] Painel admin: grupos, cotas, cobranças, contemplação, financeiro
- [x] Área do participante: minhas cotas, parcelas, posição na fila
- [x] Subsistema de cobrança (cron + régua + negativação/protesto, limites legais)

## Pendências para produção
- **Análise de crédito real:** `src/lib/credito.ts` é um stub determinístico.
  Trocar por provider (Serasa/Boa Vista) via `CREDIT_PROVIDER`.
- **Cartão recorrente:** hoje a assinatura usa `billingType=UNDEFINED` (cliente
  paga na fatura Asaas). Débito automático no cartão exige tokenização (PCI).
- **Contrato + promissória:** gerar PDF com assinatura eletrônica (fase futura).
- Confirmar o payload exato da negativação Asaas (endereço/documentos do cliente).
