# RecebeAi - Gestão de Cobranças e Recebíveis
O **RecebeAi** ajuda pequenas e médias empresas a organizar clientes, recebíveis e o acompanhamento de cobranças.

---

## 🚀 Funcionalidades Principais

- **Dashboard Executivo Financeiro**: Visão em tempo real de valores a receber, total vencido, valores recuperados e índice de inadimplência da carteira.
- **Aging da Carteira & Individual**: Tabela consolidada de faixas de atraso (A vencer, 1-30 dias, 31-60 dias, 61-90 dias, >90 dias) para rápida tomada de decisão.
- **CRM de Clientes & Devedores**: Cadastro completo, classificação de risco de crédito (baixo, médio, alto), histórico de cobranças e títulos vinculados.
- **Gestão de Títulos & Recebíveis**: Emissão e controle de faturas, boletos e notas fiscais com baixa manual de pagamentos e filtros por status.
- **Acompanhamento de cobranças**: Organização de vencimentos e preparação de mensagens para envio manual.
- **Mensagens via WhatsApp com PIX**: Geração de mensagens com dados do recebível para abrir no WhatsApp; o envio, recebimento e a confirmação do PIX são feitos fora do RecebeAi.
- **Promessas de Pagamento & Acordos**: Registro de acordos e acompanhamento de status (Pendente, Cumprida, Quebrada).
- **Banco Supabase**: O schema contém políticas Row Level Security (RLS); revise a cobertura das políticas e as configurações do projeto antes de usar com dados de produção.

---

## 🛠️ Como Executar Localmente

### 1. Pré-requisitos
- **Node.js** (versão 22 ou superior)
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

Para novas alterações de banco, adicione um arquivo SQL versionado em `supabase/migrations` (nome no formato `YYYYMMDDHHMMSS_descricao.sql`). `supabase/schema.sql` documenta o schema inicial; migrations posteriores são a fonte de verdade para os incrementos.

O comando local `npm run supabase:sync` apenas audita a existência das tabelas; ele não aplica migrations. Para executá-lo, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente ou em `.env` e use Node.js 22 ou superior.

O isolamento entre empresas é aplicado no banco por RLS restritiva (não pode ser ampliada por uma policy permissiva adicional) e por chaves estrangeiras compostas que exigem que clientes, recebíveis, cobranças, promessas e prioridades pertençam à mesma empresa. A migration de cobrança aborta, sem apagar registros, se encontrar vínculos cruzados antigos; esses vínculos devem ser corrigidos antes de reaplicá-la. O deploy executa `supabase/tests/tenant_isolation.sql` depois das migrations: um teste transacional cria duas identidades temporárias, verifica leituras isoladas e rejeição de vínculos cruzados e remove os registros de teste. Para a validação final, confirme também no painel Supabase que as migrations, policies e constraints estão aplicadas.

---

## 💼 Cobrança e comercialização

O fluxo automático usa assinaturas mensais do Mercado Pago: o servidor cria o checkout, o webhook assinado consulta a assinatura diretamente à API do provedor e somente então atualiza o plano. O retorno do navegador não ativa acesso. Novas empresas ficam pendentes até essa confirmação; registros anteriores são mantidos ativos pela migration, sem exclusão de dados do banco.

Os registros fictícios de marketing/demonstração são mantidos isolados no navegador e só aparecem na sessão explícita de demonstração. Ao iniciar um login real ou cadastro, o app remove os dados locais da demonstração sem apagar contas, sessões ou preferências; os dados das empresas reais são carregados exclusivamente do Supabase.

Configure estas variáveis no ambiente de **produção da Vercel** (e também no preview/local de teste, quando aplicável):

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=chave-service-role-do-servidor
MP_ACCESS_TOKEN=access-token-privado-do-mercado-pago
MP_WEBHOOK_SECRET=assinatura-secreta-do-webhook
APP_BASE_URL=https://seu-dominio-de-producao
BILLING_ADMIN_EMAILS=admin1@seudominio.com,admin2@seudominio.com
```

`SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET` são segredos exclusivos do servidor. Não use prefixo `VITE_` e não os coloque no navegador, em arquivos versionados ou no GitHub Actions log. A URL pública e chave publishable do Supabase continuam configuradas como `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

No Mercado Pago, habilite as notificações de assinatura `subscription_preapproval` e `subscription_authorized_payment` para `https://seu-dominio-de-producao/api/billing/webhook` e configure a mesma chave secreta em `MP_WEBHOOK_SECRET`. Faça primeiro testes com credenciais e assinaturas de teste. O plano Enterprise segue indisponível.

O fluxo manual é uma alternativa de revisão para assinaturas pendentes: o cliente solicita análise e um operador verifica o ID e o pagamento no painel do Mercado Pago antes de aprovar. Configure `BILLING_ADMIN_EMAILS` com e-mails confirmados do Supabase; a fila restrita fica em `/admin/pagamentos`. A decisão exige justificativa e é registrada. A observação enviada pelo cliente não é prova de pagamento.

Antes da comercialização, teste os fluxos automático e manual, além de criação, renovação, rejeição e cancelamento com a conta Mercado Pago do proprietário. Revise também os termos, privacidade, cancelamento e reembolso aplicáveis ao negócio. Como não há empresas reais legadas no banco neste momento, as novas contas começam pendentes e só recebem acesso após confirmação de pagamento.

## 🚀 Deploy na Vercel
1. **Deploy**:
   - O projeto já conta com o arquivo [`vercel.json`](vercel.json) configurado para roteamento SPA sem erros de 404 ao recarregar a página.
   - Basta importar o repositório na Vercel e adicionar as variáveis de ambiente.
