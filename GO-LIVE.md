# ✅ Go-Live — RaqueteClub (JM Soluções LTDA)

Checklist para sair do sandbox e operar de verdade. Ordem sugerida.

## 🔴 Legal / contábil (crítico — fazer ANTES de captar cliente real)
- [ ] **Advogado** validar o modelo: confirmar que NÃO é consórcio (BACEN), título
      de capitalização ou loteria. Revisar o contrato de adesão e a nota promissória.
- [ ] **Contador**: CNAE do CNPJ cobre a atividade? Regime tributário e alíquotas
      reais (ajustar `src/lib/taxas.ts`).
- [ ] Publicar **Termos de Uso** (`/termos`) e **Política de Privacidade**
      (`/privacidade`) revisados pelo advogado/DPO.

## 🟡 Técnico (rápido)
- [ ] **Asaas produção**: criar/verificar conta (KYC do CNPJ), gerar chave de
      produção e trocar no Vercel: `ASAAS_ENV=production`, `ASAAS_API_KEY=...`.
- [ ] Confirmar que o Asaas liberou **cartão de crédito**, **parcelamento** e
      **negativação/protesto** na conta de produção.
- [ ] Reconfigurar o **webhook** do Asaas (produção) → `/api/webhooks/asaas` com o
      `ASAAS_WEBHOOK_TOKEN`.
- [ ] Supabase: ligar **confirmação de e-mail** (Auth → Email) para cadastros reais.
- [ ] **Domínio próprio** (ex.: raqueteclub.com.br) na Vercel + atualizar a URL do
      webhook.
- [ ] Definir `CRON_SECRET` forte (já existe) e conferir o cron diário de cobrança.
- [ ] (Opcional) Tornar o repositório privado (exige Vercel Pro p/ deploy privado).

## 🟢 Produto (recomendado, não bloqueia piloto)
- [ ] **Bureau de crédito real** (`CREDIT_PROVIDER`) OU remover o score da tela de
      aprovação (hoje é um stub — número fictício).
- [ ] Avisos ao cliente (boas-vindas, "você foi contemplado", lembrete) por
      e-mail/WhatsApp.
- [ ] Fluxo de cancelamento/reembolso e política de saída do grupo.
- [ ] Backups do banco (Supabase) e monitoramento de erros.

## 🧹 Antes de abrir para o público
- [ ] **Limpar dados de teste** (ver `supabase/cleanup-testes.sql`).
- [ ] Criar os **grupos reais** com fotos e valores das raquetes.
- [ ] Testar 1 adesão real de ponta a ponta em produção (com cartão real, valor baixo).
