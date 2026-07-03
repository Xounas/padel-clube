# 🚀 Deploy do Padel Clube

Divisão de trabalho: **(A)** comandos locais que o Claude Code roda; **(B)** um
prompt pronto pro **Claude for Chrome** fazer os passos de navegador; **(C)** o
que só **você** deve digitar (segredos). Ordem: Supabase → GitHub → Vercel → Asaas.

---

## Pré-requisitos (você cria as contas, se ainda não tiver)
- Conta **GitHub**, **Vercel**, **Supabase**, **Asaas** (comece em **sandbox**).

---

## (A) Parte local — Claude Code executa
Subir o código pro GitHub (o Vercel importa de lá):

```bash
cd padel-clube
git init
git add .
git commit -m "Padel Clube — MVP"
gh repo create padel-clube --private --source=. --push
```

> Se não tiver o `gh` autenticado, faça `gh auth login` (abre o navegador uma vez).

---

## (B) Prompt para o Claude for Chrome  ← copie o bloco abaixo e cole no agente

```
Você vai me ajudar a publicar um app Next.js. Faça um passo de cada vez e, sempre
que precisar de uma CHAVE SECRETA, uma SENHA, um CARTÃO ou uma CONFIRMAÇÃO DE
PAGAMENTO, PARE e me peça — não invente nem prossiga sozinho nesses pontos.

PASSO 1 — SUPABASE
1. Abra https://supabase.com/dashboard e crie um novo projeto (região Brasil/São Paulo).
2. Quando pedir a senha do banco, PARE e peça para eu digitar.
3. Após criar, vá em "SQL Editor" > "New query".
4. PARE e me peça para colar o conteúdo do arquivo supabase/schema.sql. Cole o que
   eu enviar e clique em "Run". Confirme que rodou sem erro.
5. Vá em "Project Settings" > "API". Me mostre (para EU copiar) a Project URL, a
   anon key e a service_role key — não as guarde, só me aponte onde estão.

PASSO 2 — VERCEL
6. Abra https://vercel.com/new e importe o repositório "padel-clube" do meu GitHub.
7. Em "Environment Variables", PARE: eu vou te ditar cada par nome=valor. Adicione
   exatamente: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
   SUPABASE_SERVICE_ROLE_KEY, ASAAS_ENV=sandbox, ASAAS_API_KEY, ASAAS_WEBHOOK_TOKEN,
   ASAAS_BILLING=UNDEFINED, CRON_SECRET, DIAS_NEGATIVAR=30, CREDIT_PROVIDER=stub,
   CREDIT_MIN_SCORE=500.
8. Clique em "Deploy" e me diga a URL final (algo como https://padel-clube.vercel.app).

PASSO 3 — SUPABASE (promover admin)
9. Volte ao Supabase > SQL Editor e rode (troque pelo meu e-mail):
   update profiles set role='admin' where email='SEU_EMAIL';
   Obs.: só funciona depois que eu tiver criado minha conta no /login do app.

PASSO 4 — ASAAS (webhook)
10. Abra https://www.asaas.com (ambiente sandbox) > "Integrações" > "Webhooks".
11. Crie um webhook para a URL: <URL_DA_VERCEL>/api/webhooks/asaas
12. No campo de token/autenticação, use o MESMO valor de ASAAS_WEBHOOK_TOKEN
    (PARE e me peça). Marque os eventos de cobrança (PAYMENT_RECEIVED,
    PAYMENT_CONFIRMED, PAYMENT_OVERDUE, PAYMENT_CREATED).
13. Salve e me confirme que ficou "ativo".

Ao terminar, faça um resumo do que ficou pronto e do que ainda depende de mim.
```

---

## (C) Só você digita (segredos — nunca no agente autônomo)
- Senha do banco Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`, `ASAAS_API_KEY` (chave privada).
- `ASAAS_WEBHOOK_TOKEN` e `CRON_SECRET` — invente strings aleatórias fortes.
- Dados de cartão (só em teste real de adesão).

---

## Teste ponta a ponta (sandbox)
1. Acesse a URL da Vercel, crie sua conta em `/login`, promova-se a admin (passo 9).
2. `/admin/grupos` → **Novo grupo** (escolha 12x/18x/24x) → criar.
3. Saia, crie uma conta de "cliente", vá em `/app/aderir` → aderir a um grupo.
4. Aceite o contrato online em `/app/contrato/...`.
5. No painel Asaas sandbox, simule o pagamento da 1ª cobrança → o webhook marca
   "pago" e o cliente sobe na fila.
6. `/admin/contemplacao` → **Contemplar agora** → confira o contemplado e o lucro
   em `/admin/financeiro`.

## Ir para produção depois
- Trocar `ASAAS_ENV=production` + chave de produção do Asaas.
- Conectar bureau de crédito real (`CREDIT_PROVIDER` + credencial).
- Cron de cobrança já agendado em `vercel.json` (protegido por `CRON_SECRET`).
```
```
