# RecebeAi - Plataforma SaaS de Gestão de Cobranças e Recebíveis
O **RecebeAi** é uma solução completa de Software como Serviço (SaaS) desenvolvida para pequenas e médias empresas reduzirem a inadimplência e automatizarem o fluxo de contas a receber.

---

## 🚀 Funcionalidades Principais

- **Dashboard Executivo Financeiro**: Visão em tempo real de valores a receber, total vencido, valores recuperados e índice de inadimplência da carteira.
- **Aging da Carteira & Individual**: Tabela consolidada de faixas de atraso (A vencer, 1-30 dias, 31-60 dias, 61-90 dias, >90 dias) para rápida tomada de decisão.
- **CRM de Clientes & Devedores**: Cadastro completo, classificação de risco de crédito (baixo, médio, alto), histórico de cobranças e títulos vinculados.
- **Gestão de Títulos & Recebíveis**: Emissão e controle de faturas, boletos e notas fiscais com baixa manual de pagamentos e filtros por status.
- **Régua de Cobrança Multicanal**: Automação de lembretes preventivos (D-3, D0) e cobranças incisivas pós-vencimento (D+3, D+10).
- **Disparo Direto via WhatsApp com PIX**: Gerador inteligente de links do WhatsApp com substituição automática de dados do devedor e chave PIX da empresa.
- **Promessas de Pagamento & Acordos**: Registro de acordos e acompanhamento de status (Pendente, Cumprida, Quebrada).
- **Multi-tenancy & Banco Supabase**: Suporte a Row Level Security (RLS) para isolar os dados de cada empresa cliente.

---

## 🛠️ Como Executar Localmente

### 1. Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **NPM** instalado

### 2. Instalação das Dependências
```bash
npm install
```

### 3. Rodar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:5173` no seu navegador. O aplicativo já inicializa pré-populado com dados realistas em **Modo Demonstração** mesmo sem banco configurado!

### 4. Gerar Build de Produção
```bash
npm run build
```

---

## 🗄️ Deploy automático (GitHub, Supabase e Vercel)

O workflow em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) executa testes e build em pull requests para `main`. Após um merge ou push na `main`, aplica as migrations de [`supabase/migrations`](supabase/migrations) no Supabase e, se tudo passar, publica o build de produção na Vercel.

Configure estes **Actions secrets** no repositório do GitHub (`Settings > Secrets and variables > Actions`):

- `SUPABASE_ACCESS_TOKEN`: token de acesso pessoal criado no painel Supabase.
- `SUPABASE_PROJECT_ID`: referência do projeto Supabase.
- `SUPABASE_DB_PASSWORD`: senha do banco PostgreSQL do projeto.
- `VERCEL_TOKEN`: token de acesso da Vercel.
- `VERCEL_ORG_ID`: ID da equipe/conta da Vercel (`orgId` do `.vercel/project.json`).
- `VERCEL_PROJECT_ID`: ID do projeto Vercel conectado a este repositório.

O job de deploy usa o ambiente GitHub `production`; secrets cadastrados nesse ambiente ficam disponíveis para ele. `VERCEL_ORG_ID` deve ser o `orgId` da conta/equipe que possui o projeto, copiado do `.vercel/project.json`, sem espaços ou quebras de linha. O usuário dono do token precisa ter acesso a essa conta e ao projeto.

Configure também, nas variáveis de ambiente de **produção** do projeto Vercel, os valores usados pelo frontend:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

O frontend usa a chave pública `anon`/publishable; nunca configure uma `service_role` no frontend. Para evitar deploys duplicados ou fora de ordem, desative o deploy Git automático da integração Vercel com GitHub e deixe a publicação de produção a cargo deste workflow. PRs não alteram o banco nem publicam na Vercel.

O workflow também repassa explicitamente a senha do banco Supabase ao comando `supabase db push` e escopa a publicação Vercel para a organização correta, evitando que o ambiente de produção seja deployado em outra conta ou projeto.

Para novas alterações de banco, adicione um arquivo SQL versionado em `supabase/migrations` (nome no formato `YYYYMMDDHHMMSS_descricao.sql`). O arquivo `supabase/schema.sql` permanece como referência do schema completo.

O comando local `npm run supabase:sync` apenas audita a existência das tabelas; ele não aplica migrations. Para executá-lo, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente ou em `.env` e use Node.js 22 ou superior.

---

## 💼 Guia de Comercialização do SaaS

Para comercializar o RecebeAi no mercado brasileiro (B2B):
1. **Planos de Assinatura**:
   - **Essencial (R$ 149,00/mês)**: até 300 clientes, R$ 100k gerenciados, Kanban, régua de 5 etapas, templates WhatsApp/Email, cálculo de Aging e DSO.
   - **Profissional (R$ 349,00/mês)**: clientes e recebíveis ilimitados, IA Financeira de diagnóstico, régua automatizada WhatsApp API, score preditivo de cobrança, gestão de acordos.
   - **Enterprise (R$ 799,00/mês)**: multi-usuários por equipe, API aberta para ERPs e Bancos, régua multicanal customizada com Webhooks, IA para negociações complexas, onboarding e gerente de conta dedicado.
2. **Gateway de Assinaturas**:
   - Conecte um provedor como Asaas, Mercado Pago ou Stripe para cobrar as mensalidades dos assinantes via Cartão de Crédito ou PIX Recorrente.
3. **Deploy na Vercel**:
   - O projeto já conta com o arquivo [`vercel.json`](vercel.json) configurado para roteamento SPA sem erros de 404 ao recarregar a página.
   - Basta importar o repositório na Vercel e adicionar as variáveis de ambiente.
