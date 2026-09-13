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

## 🗄️ Conectando ao Banco de Dados Supabase (Produção)

1. Crie um projeto no [Supabase](https://supabase.com/).
2. No menu **SQL Editor**, copie e execute o conteúdo do arquivo [`supabase/schema.sql`](file:///c:/Users/Alexandre.dasilva/Documents/GitHub/Aplicativo-SAAS-RECEBEAI/supabase/schema.sql).
3. Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```
4. O aplicativo detectará automaticamente as credenciais e ativará o modo nuvem.

---

## 💼 Guia de Comercialização do SaaS

Para comercializar o RecebeAi no mercado brasileiro (B2B):
1. **Planos de Assinatura Recomendados**:
   - **Starter (R$ 119/mês)**: até 50 títulos, disparo manual WhatsApp, régua básica.
   - **Pro (R$ 299/mês)**: até 300 títulos, régua automática, aging detalhado, suporte WhatsApp.
   - **Enterprise (R$ 699/mês)**: títulos ilimitados, múltiplos usuários, API de boletos/PIX.
2. **Gateway de Assinaturas**:
   - Conecte um provedor como Asaas, Mercado Pago ou Stripe para cobrar as mensalidades dos assinantes via Cartão de Crédito ou PIX Recorrente.
3. **Deploy na Vercel**:
   - O projeto já conta com o arquivo [`vercel.json`](file:///c:/Users/Alexandre.dasilva/Documents/GitHub/Aplicativo-SAAS-RECEBEAI/vercel.json) configurado para roteamento SPA sem erros de 404 ao recarregar a página.
   - Basta importar o repositório na Vercel e adicionar as variáveis de ambiente.
