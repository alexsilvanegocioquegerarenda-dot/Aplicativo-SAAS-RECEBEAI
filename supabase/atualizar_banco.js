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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente ou no arquivo .env antes da auditoria."
  );
  process.exit(1);
}

let parsedSupabaseUrl;
try {
  parsedSupabaseUrl = new URL(SUPABASE_URL);
} catch {
  console.error("VITE_SUPABASE_URL precisa ser uma URL válida do projeto Supabase.");
  process.exit(1);
}

if (
  parsedSupabaseUrl.protocol !== "https:" ||
  parsedSupabaseUrl.pathname !== "/" ||
  parsedSupabaseUrl.search ||
  parsedSupabaseUrl.hash
) {
  console.error(
    "VITE_SUPABASE_URL deve ser apenas a URL HTTPS do projeto, sem Markdown, caminho ou parâmetros."
  );
  process.exit(1);
}

if (typeof globalThis.WebSocket !== "function") {
  console.error(
    "A auditoria Supabase precisa de Node.js 22 ou superior, com WebSocket nativo."
  );
  process.exit(1);
}

console.log("==================================================================");
console.log("🚀 RECEBEAI - SINCRONIZADOR & ATUALIZADOR DO SUPABASE");
console.log("==================================================================");
console.log(`📡 URL do Projeto : ${parsedSupabaseUrl.origin}`);
console.log("🔑 Chave API     : configurada (publishable/anon)");
console.log("------------------------------------------------------------------");

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: {
    transport: globalThis.WebSocket,
  },
});

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
  let erros = 0;

  for (const tab of TABELAS) {
    const t0 = Date.now();
    try {
      const { error, status } = await supabase
        .from(tab.nome)
        .select("*", { count: "exact", head: true });

      const latencia = Date.now() - t0;

      if (!error) {
        console.log(`✅ [ATIVA]      Tabela '${tab.nome.padEnd(20)}' (${latencia}ms) - ${tab.descricao}`);
        ativas++;
      } else if (["42P01", "PGRST205"].includes(error.code)) {
        console.log(`⚠️  [PENDENTE]   Tabela '${tab.nome.padEnd(20)}' NÃO EXISTE NO POSTGRESQL`);
        pendentes++;
      } else if (
        error.code === "42501" ||
        [401, 403].includes(status || error.status)
      ) {
        console.log(`🔒 [RLS ATIVO]  Tabela '${tab.nome.padEnd(20)}' (${latencia}ms) - Protegida por Row Level Security`);
        ativas++;
      } else {
        console.error(
          `❌ [ERRO]       Tabela '${tab.nome.padEnd(20)}' (${latencia}ms): ${error.message}`
        );
        erros++;
      }
    } catch (err) {
      console.error(`❌ [ERRO]       Tabela '${tab.nome.padEnd(20)}': ${err.message}`);
      erros++;
    }
  }

  console.log("\n------------------------------------------------------------------");
  console.log(
    `📊 RESUMO DA AUDITORIA: ${ativas} tabelas ativas/protegidas, ${pendentes} pendentes, ${erros} erros.`
  );
  console.log("------------------------------------------------------------------");

  if (pendentes > 0) {
    console.log("\n⚠️  ATENÇÃO: Algumas tabelas ainda não foram criadas no banco de dados.");
    console.log("Para atualizar ou criar todas as tabelas e políticas RLS de uma só vez:");
    console.log("1. Acesse o projeto correto no painel Supabase e abra o SQL Editor.");
    console.log("2. Aplique as migrations versionadas em supabase/migrations.\n");
  }

  if (pendentes === 0 && erros === 0) {
    console.log("\n🎉 PARABÉNS! Todas as tabelas do Supabase estão configuradas e prontas");
    console.log("para receber clientes multi-empresa e operações do RecebeAi!");
  }

  if (pendentes > 0 || erros > 0) {
    process.exitCode = 1;
  }
}

// Executar auditoria
auditarTabelas().catch((err) => {
  console.error("Erro crítico na sincronização do Supabase:", err);
  process.exit(1);
});
