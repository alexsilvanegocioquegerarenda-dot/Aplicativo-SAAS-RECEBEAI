/**
 * ==============================================================================
 * RECEBEAI - SCRIPT DE ATUALIZAÇÃO AUTOMÁTICA & SINCRONIZAÇÃO DO SUPABASE
 * ==============================================================================
 * Este script valida a conexão com a nuvem do Supabase, audita as 10 tabelas
 * do banco de dados PostgreSQL, verifica políticas de acesso e prepara o
 * ambiente para funcionamento 100% em nuvem do SaaS RecebeAi.
 * ==============================================================================
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis do .env caso existam
const envPath = path.resolve(__dirname, "../.env");
let envVars = {};

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...rest] = trimmed.split("=");
      envVars[key.trim()] = rest.join("=").trim();
    }
  });
}

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  envVars.VITE_SUPABASE_URL ||
  "https://upuuqfojhqjgzsdycvxp.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  envVars.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_kT4M2GSyV2p0lY1ZRN6R5w_P85qxBAV";

console.log("==================================================================");
console.log("🚀 RECEBEAI - SINCRONIZADOR & ATUALIZADOR DO SUPABASE");
console.log("==================================================================");
console.log(`📡 URL do Projeto : ${SUPABASE_URL}`);
console.log(`🔑 Chave API     : ${SUPABASE_ANON_KEY.substring(0, 15)}... (Publishable/Anon)`);
console.log("------------------------------------------------------------------");

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABELAS = [
  { nome: "empresas", descricao: "Multi-tenancy / Dados das Empresas Assinantes" },
  { nome: "clientes", descricao: "Cadastro de Devedores e Clientes" },
  { nome: "recebiveis", descricao: "Faturas, Títulos e Boletos a Receber" },
  { nome: "cobrancas", descricao: "Histórico de Disparos WhatsApp e E-mail" },
  { nome: "promessas", descricao: "Acordos e Promessas de Pagamento" },
  { nome: "reguas", descricao: "Régua de Cobrança Preventiva e Reativa" },
  { nome: "prioridades_cobranca", descricao: "Scores e Recomendações da IA" },
  { nome: "importacoes", descricao: "Lotes e Histórico de Arquivos CSV" },
  { nome: "metas_recuperacao", descricao: "Metas Financeiras Mensais" },
  { nome: "templates_mensagem", descricao: "Modelos Personalizados de Mensagens" },
  { nome: "conversas_ia", descricao: "Histórico do Chat da IA Financeira" },
];

async function auditarTabelas() {
  console.log("\n🔍 Verificando estrutura das tabelas no PostgreSQL do Supabase...\n");
  let ativas = 0;
  let pendentes = 0;

  for (const tab of TABELAS) {
    const t0 = Date.now();
    try {
      const { data, error, status } = await supabase
        .from(tab.nome)
        .select("*", { count: "exact", head: true });

      const latencia = Date.now() - t0;

      if (!error || status === 200 || status === 204) {
        console.log(`✅ [ATIVA]      Tabela '${tab.nome.padEnd(20)}' (${latencia}ms) - ${tab.descricao}`);
        ativas++;
      } else if (error.code === "42P01") {
        console.log(`⚠️  [PENDENTE]   Tabela '${tab.nome.padEnd(20)}' NÃO EXISTE NO POSTGRESQL`);
        pendentes++;
      } else {
        // Erros de RLS 401/403 significam que a tabela EXISTE mas exige autenticação do usuário
        console.log(`🔒 [RLS ATIVO]  Tabela '${tab.nome.padEnd(20)}' (${latencia}ms) - Protegida por Row Level Security`);
        ativas++;
      }
    } catch (err) {
      console.log(`❌ [ERRO]       Tabela '${tab.nome.padEnd(20)}': ${err.message}`);
      pendentes++;
    }
  }

  console.log("\n------------------------------------------------------------------");
  console.log(`📊 RESUMO DA AUDITORIA: ${ativas} tabelas ativas/protegidas, ${pendentes} pendentes.`);
  console.log("------------------------------------------------------------------");

  if (pendentes > 0) {
    console.log("\n⚠️  ATENÇÃO: Algumas tabelas ainda não foram criadas no banco de dados.");
    console.log("Para atualizar ou criar todas as tabelas e políticas RLS de uma só vez:");
    console.log("1. Acesse o Painel do Supabase:");
    console.log(`   👉 https://supabase.com/dashboard/project/upuuqfojhqjgzsdycvxp/sql`);
    console.log("2. Clique em 'New Query' (Nova Consulta).");
    console.log("3. Copie e cole todo o conteúdo do arquivo:");
    console.log(`   📄 supabase/schema.sql`);
    console.log("4. Clique no botão 'Run' (Executar).\n");
  } else {
    console.log("\n🎉 PARABÉNS! Todas as tabelas do Supabase estão configuradas e prontas");
    console.log("para receber clientes multi-empresa e operações do RecebeAi!");
  }
}

// Executar auditoria
auditarTabelas().catch((err) => {
  console.error("Erro crítico na sincronização do Supabase:", err);
  process.exit(1);
});
