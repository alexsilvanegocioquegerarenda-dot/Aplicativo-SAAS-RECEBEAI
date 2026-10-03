import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { isSupabaseConfigured, supabase, testarConexaoSupabase } from "@/api/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { runTenantDiagnostic } from "@/lib/tenantDiagnostic";
import { MERCADO_PAGO_PLANS } from "@/lib/mercadoPago";
import { startMercadoPagoCheckout } from "@/lib/billing";
import {
  Settings,
  Building2,
  QrCode,
  Sparkles,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Check,
  Zap,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  Lock,
  X,
  ArrowRight,
  RefreshCw,
  Server
} from "lucide-react";

const diagnosticRelationshipLabels = {
  "recebiveis → clientes": "Cliente → Recebível",
  "cobrancas → clientes": "Cliente → Cobrança",
  "cobrancas → recebiveis": "Recebível → Cobrança",
  "promessas → clientes": "Cliente → Promessa",
  "promessas → recebiveis": "Recebível → Promessa",
  "prioridades_cobranca → clientes": "Cliente → Prioridade",
};

export default function Configuracoes() {
  const { user } = useAuth();
  const [config, setConfig] = useState({
    razao_social: "",
    cnpj: "",
    telefone_empresa: "",
    email_cobranca: "",
    chave_pix: "",
    tipo_chave_pix: "email",
    multa_percentual: 2.0,
    juros_mes_percentual: 1.0,
    plano_atual: "profissional",
    limite_titulos: 2000,
  });

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  // Estados do Modal de Checkout Mercado Pago
  const [modalCheckoutOpen, setModalCheckoutOpen] = useState(false);
  const [planoCheckout, setPlanoCheckout] = useState(null);
  const [ativandoPlano, setAtivandoPlano] = useState(false);
  const [ativacaoSucesso, setAtivacaoSucesso] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Estados de teste do Supabase
  const [testandoSupabase, setTestandoSupabase] = useState(false);
  const [resultadoTesteSupabase, setResultadoTesteSupabase] = useState(null);
  const [executandoDiagnostico, setExecutandoDiagnostico] = useState(false);
  const [diagnosticoTenant, setDiagnosticoTenant] = useState(null);
  const [empresaTesteId, setEmpresaTesteId] = useState("");
  const assinaturaExistente = ["active", "past_due"].includes(user?.subscription_status);

  const handleTestarSupabase = async () => {
    setTestandoSupabase(true);
    setResultadoTesteSupabase(null);
    try {
      const res = await testarConexaoSupabase();
      setResultadoTesteSupabase(res);
    } catch (err) {
      setResultadoTesteSupabase({ ok: false, mensagem: "Erro ao testar conexão: " + err.message });
    } finally {
      setTestandoSupabase(false);
    }
  };

  const handleExecutarDiagnosticoTenant = async () => {
    setExecutandoDiagnostico(true);
    setDiagnosticoTenant(null);
    try {
      const report = await runTenantDiagnostic({
        supabaseClient: supabase,
        demoMode: base44.isDemoMode(),
        otherCompanyId: empresaTesteId,
      });
      setDiagnosticoTenant(report);
    } catch (error) {
      setDiagnosticoTenant({
        session: { status: "FALHOU", reason: error.message || "Falha inesperada no diagnóstico." },
      });
    } finally {
      setExecutandoDiagnostico(false);
    }
  };

  useEffect(() => {
    async function load() {
      const cfg = await base44.entities.Configuracao.get();
      if (cfg) {
        setConfig((prev) => ({
          ...prev,
          ...cfg,
          telefone_empresa: cfg.telefone_empresa || cfg.telefone || "",
          email_cobranca: cfg.email_cobranca || cfg.email || "",
          plano_atual: cfg.plano_atual || cfg.plano || prev.plano_atual,
        }));
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await base44.entities.Configuracao.update({
        razao_social: config.razao_social,
        cnpj: config.cnpj,
        telefone: config.telefone_empresa,
        email: config.email_cobranca,
        chave_pix: config.chave_pix,
        tipo_chave_pix: config.tipo_chave_pix,
        multa_percentual: config.multa_percentual,
        juros_mes_percentual: config.juros_mes_percentual,
      });
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } finally {
      setSalvando(false);
    }
  };

  const handleResetarDemo = () => {
    if (window.confirm("Deseja restaurar os dados de exemplo do RecebeAi?")) {
      base44.resetDemoData();
      window.location.reload();
    }
  };

  const abrirCheckout = (plano) => {
    if (plano.id === "enterprise") return;
    setPlanoCheckout(plano);
    setAtivacaoSucesso(false);
    setModalCheckoutOpen(true);
  };

  const handleIrParaMercadoPago = () => {
    if (!planoCheckout) return;
    setAtivandoPlano(true);
    setCheckoutError("");
    startMercadoPagoCheckout(planoCheckout.id)
      .catch((error) => setCheckoutError(error.message))
      .finally(() => setAtivandoPlano(false));
  };

  const handleSimularAprovacao = async () => {
    if (!base44.isDemoMode() || !planoCheckout) return;
    setAtivandoPlano(true);

    let novoLimite = 300;
    if (planoCheckout.id === "profissional") novoLimite = 2000;
    if (planoCheckout.id === "enterprise") novoLimite = 99999;

    try {
      const updated = await base44.entities.Configuracao.update({
        plano_atual: planoCheckout.id,
        limite_titulos: novoLimite,
      });

      setConfig((prev) => ({ ...prev, ...updated }));
      setAtivacaoSucesso(true);

      setTimeout(() => {
        setModalCheckoutOpen(false);
      }, 2500);
    } finally {
      setAtivandoPlano(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  const planoAtivoId = config.plano_atual || "pro";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Configurações & Planos do SaaS
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Gerencie dados da sua empresa, chave PIX para recebimentos, integração Mercado Pago e planos.
        </p>
      </div>

      <form onSubmit={handleSalvar} className="space-y-8">
        {/* Bloco 1: Dados da Empresa */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h2 className="font-heading text-base font-bold text-slate-900">
              Dados da Empresa Credora
            </h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Razão Social / Nome Fantasia</label>
              <input
                type="text"
                value={config.razao_social}
                onChange={(e) => setConfig({ ...config, razao_social: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CNPJ da Empresa</label>
              <input
                type="text"
                value={config.cnpj}
                onChange={(e) => setConfig({ ...config, cnpj: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp de Cobrança</label>
              <input
                type="text"
                value={config.telefone_empresa}
                onChange={(e) => setConfig({ ...config, telefone_empresa: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">Número utilizado para receber respostas dos devedores</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Financeiro</label>
              <input
                type="email"
                value={config.email_cobranca}
                onChange={(e) => setConfig({ ...config, email_cobranca: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: PIX e Juros de Mora */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <QrCode className="h-5 w-5 text-emerald-600" />
            <h2 className="font-heading text-base font-bold text-slate-900">
              Recebimento via PIX & Parâmetros de Juros
            </h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chave PIX Principal</label>
              <input
                type="text"
                value={config.chave_pix}
                onChange={(e) => setConfig({ ...config, chave_pix: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">Esta chave é inserida automaticamente nas réguas e WhatsApp</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Chave PIX</label>
              <select
                value={config.tipo_chave_pix}
                onChange={(e) => setConfig({ ...config, tipo_chave_pix: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="cnpj">CNPJ / CPF</option>
                <option value="email">E-mail</option>
                <option value="telefone">Telefone</option>
                <option value="aleatoria">Chave Aleatória (EVP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Multa por Atraso (%)</label>
              <input
                type="number"
                step="0.1"
                value={config.multa_percentual}
                onChange={(e) => setConfig({ ...config, multa_percentual: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">Padrão nacional: até 2%</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Juros de Mora ao Mês (%)</label>
              <input
                type="number"
                step="0.1"
                value={config.juros_mes_percentual}
                onChange={(e) => setConfig({ ...config, juros_mes_percentual: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">Padrão: 1% ao mês (pro-rata)</span>
            </div>
          </div>
        </div>

        {/* Bloco 3: Integração Mercado Pago */}
        <div className="rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-50/50 to-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-white shadow-sm shadow-sky-500/30">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-heading text-base font-bold text-slate-900">
                  Integração Mercado Pago (Gateway de Pagamento)
                </h2>
                <p className="text-xs text-slate-500">
                  Configure os links de checkout do Mercado Pago para onde os clientes serão direcionados ao migrar de plano.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
              Checkout server-side
            </span>
          </div>

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <p className="font-semibold">Assinaturas e confirmação automática</p>
            <p className="mt-1">
              O checkout é criado no servidor e a ativação depende do webhook validado do Mercado Pago.
              Tokens privados são configurados somente nas variáveis de ambiente da Vercel, nunca neste painel.
            </p>
          </div>
        </div>

        {/* Botão de Salvar Alterações */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetarDemo}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar Dados de Demonstração</span>
          </button>

          <div className="flex items-center gap-3">
            {sucesso && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <Check className="h-4 w-4" /> Salvo com sucesso!
              </span>
            )}
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>{salvando ? "Salvando..." : "Salvar Configurações"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Bloco 4: Planos de Comercialização do SaaS RecebeAi com Checkout Mercado Pago */}
      <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <h2 className="font-heading text-lg font-bold text-slate-900">
                Planos de Assinatura RecebeAi
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Selecione o plano desejado para ser direcionado à tela de pagamentos do Mercado Pago.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold text-blue-800">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            Plano Atual: {planoAtivoId.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Essencial */}
          <div className={`rounded-2xl border p-5 bg-white flex flex-col justify-between transition-all ${
            planoAtivoId === "essencial" || planoAtivoId === "starter" ? "border-emerald-600 ring-2 ring-emerald-600/20 shadow-md" : "border-slate-200"
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-bold text-slate-900">Essencial</h3>
                {(planoAtivoId === "essencial" || planoAtivoId === "starter") && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Plano Atual
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Para autônomos e pequenas empresas</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">R$ 149</span>
                <span className="text-xs text-slate-400">,00/mês</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Cadastro de clientes e recebíveis</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Baixa manual de pagamentos</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Visões de Aging e DSO</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Importação de dados por CSV</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Mensagens preparadas para envio manual</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => abrirCheckout(MERCADO_PAGO_PLANS.essencial)}
              disabled={assinaturaExistente}
              className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>{assinaturaExistente ? "Assinatura existente" : "Abrir checkout"}</span>
            </button>
          </div>

          {/* Profissional (Destaque) */}
          <div className={`relative rounded-2xl border-2 p-5 bg-gradient-to-b from-blue-50/50 to-white shadow-md flex flex-col justify-between transition-all ${
            planoAtivoId === "profissional" || planoAtivoId === "pro" ? "border-blue-600 ring-2 ring-blue-600/20" : "border-blue-500"
          }`}>
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
              Mais Popular
            </span>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-bold text-slate-900">Profissional</h3>
                {(planoAtivoId === "profissional" || planoAtivoId === "pro") && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Plano Atual
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Indicadores e organização da carteira</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">R$ 349</span>
                <span className="text-xs text-slate-400">,00/mês</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600" /> Recursos do plano Essencial</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600" /> Kanban de cobranças e promessas</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600" /> Análises calculadas sobre a carteira</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600" /> Metas e histórico de importações</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600" /> Templates de mensagens</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => abrirCheckout(MERCADO_PAGO_PLANS.profissional)}
              disabled={assinaturaExistente}
              className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>{assinaturaExistente ? "Assinatura existente" : "Abrir checkout"}</span>
            </button>
          </div>

          {/* Enterprise */}
          <div className={`rounded-2xl border p-5 bg-white flex flex-col justify-between transition-all ${
            planoAtivoId === "enterprise" ? "border-purple-600 ring-2 ring-purple-600/20 shadow-md" : "border-slate-200"
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-bold text-slate-900">Enterprise</h3>
                {planoAtivoId === "enterprise" && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Plano Atual
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Ainda indisponível para contratação automática</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-base font-semibold text-slate-500">Indisponível no momento</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-purple-600" /> Escopo e condições ainda não definidos</li>
              </ul>
            </div>
            <button
              type="button"
              disabled
              className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-200 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Indisponível no momento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bloco 5: Status do Banco de Dados Supabase */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900">
                Banco de Dados em Nuvem (Supabase PostgreSQL)
              </h2>
              <p className="text-xs text-slate-500">
                Armazenamento centralizado com Row Level Security (RLS) e isolamento multi-empresa
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={testandoSupabase}
            onClick={handleTestarSupabase}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-sm self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testandoSupabase ? "animate-spin" : ""}`} />
            <span>{testandoSupabase ? "Testando..." : "Testar Conexão Supabase"}</span>
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Diagnóstico somente leitura</h3>
              <p className="mt-1 max-w-2xl text-xs text-slate-600">
                Usa apenas a sessão Supabase atual e respeita as permissões RLS. Nenhum dado é criado, alterado ou salvo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExecutarDiagnosticoTenant}
              disabled={executandoDiagnostico}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${executandoDiagnostico ? "animate-spin" : ""}`} />
              {executandoDiagnostico ? "Consultando..." : "Executar diagnóstico somente leitura"}
            </button>
          </div>
          <label className="mt-4 block max-w-lg text-xs font-medium text-slate-700">
            ID opcional de outra empresa para verificar se esta sessão consegue consultá-la
            <input
              value={empresaTesteId}
              onChange={(event) => setEmpresaTesteId(event.target.value)}
              placeholder="UUID da empresa de teste"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-800 placeholder:font-sans"
            />
          </label>

          {diagnosticoTenant && (
            <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 text-xs">
              <section>
                <h4 className="font-semibold text-slate-900">Usuário autenticado</h4>
                <p className="mt-1 text-slate-700">Status: <strong>{diagnosticoTenant.session?.status || "NÃO FOI POSSÍVEL TESTAR"}</strong></p>
                {diagnosticoTenant.session?.userId && <p className="mt-1 break-all font-mono text-slate-600">user.id: {diagnosticoTenant.session.userId}</p>}
                {diagnosticoTenant.session?.reason && <p className="mt-1 text-slate-600">{diagnosticoTenant.session.reason}</p>}
              </section>

              <section className="border-t border-slate-100 pt-3">
                <h4 className="font-semibold text-slate-900">Empresas vinculadas</h4>
                <p className="mt-1 text-slate-700">Quantidade: <strong>{diagnosticoTenant.companies?.count ?? "não disponível"}</strong></p>
                {diagnosticoTenant.companies?.companies?.map((company) => (
                  <p key={company.id} className="mt-1 break-all font-mono text-slate-600">empresa_id: {company.id}</p>
                ))}
                {diagnosticoTenant.companies?.count === 0 && (
                  <p className="mt-1 font-medium text-amber-800">Usuário autenticado, mas nenhuma empresa vinculada foi encontrada.</p>
                )}
                {(diagnosticoTenant.companies?.count ?? 0) > 1 && (
                  <p className="mt-1 font-medium text-amber-800">Mais de uma empresa vinculada ao usuário. Nenhuma empresa foi escolhida automaticamente.</p>
                )}
                {diagnosticoTenant.companies?.reason && diagnosticoTenant.companies.count !== 0 && diagnosticoTenant.companies.count <= 1 && (
                  <p className="mt-1 text-slate-600">{diagnosticoTenant.companies.reason}</p>
                )}
              </section>

              <section className="border-t border-slate-100 pt-3">
                <h4 className="font-semibold text-slate-900">Contagens visíveis das tabelas</h4>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {diagnosticoTenant.counts?.map((entry) => (
                    <div key={entry.table} className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
                      <p className="font-mono text-slate-800">{entry.table}</p>
                      <p className="mt-1 text-slate-600">{entry.status}: {entry.visibleCount ?? entry.reason}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border-t border-slate-100 pt-3">
                <h4 className="font-semibold text-slate-900">Verificação dos empresa_id</h4>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {diagnosticoTenant.tenantIntegrity?.map((entry) => (
                    <div key={entry.table} className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
                      <p className="font-mono text-slate-800">{entry.table}</p>
                      <p className="mt-1 text-slate-600">{entry.status}</p>
                      {entry.reason && <p className="mt-1 text-slate-500">{entry.reason}</p>}
                    </div>
                  ))}
                </div>
              </section>

              <section className="border-t border-slate-100 pt-3">
                <h4 className="font-semibold text-slate-900">Verificação dos relacionamentos</h4>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {diagnosticoTenant.relationships?.map((entry) => (
                    <div key={entry.relationship} className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
                      <p className="text-slate-800">{diagnosticRelationshipLabels[entry.relationship] || entry.relationship}</p>
                      <p className="mt-1 font-semibold text-slate-700">{entry.status}</p>
                      {entry.status === "NÃO FOI POSSÍVEL TESTAR"
                        ? <p className="mt-1 text-slate-600">NÃO FOI POSSÍVEL TESTAR — relacionamento não pôde ser consultado com a sessão atual.</p>
                        : entry.reason && <p className="mt-1 text-slate-500">{entry.reason}</p>}
                    </div>
                  ))}
                </div>
              </section>

              <section className="border-t border-slate-100 pt-3">
                <h4 className="font-semibold text-slate-900">Teste de outra empresa</h4>
                <p className="mt-1 text-slate-700">{diagnosticoTenant.otherCompanyIsolation?.status}</p>
                {diagnosticoTenant.otherCompanyIsolation?.reason && <p className="mt-1 text-slate-600">{diagnosticoTenant.otherCompanyIsolation.reason}</p>}
              </section>
            </div>
          )}
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <CheckCircle2 className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
            <div className="space-y-1 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900">
                  {resultadoTesteSupabase?.status === "connected"
                    ? "Supabase Conectado"
                    : resultadoTesteSupabase?.status === "permission_error"
                    ? "Erro de autenticação/permissão Supabase"
                    : resultadoTesteSupabase?.status === "connection_error"
                    ? "Sem conexão com Supabase"
                    : isSupabaseConfigured
                    ? "Supabase Configurado; conexão não verificada"
                    : "Supabase Não Configurado"}
                </span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  {resultadoTesteSupabase?.status === "connected" ? "Conexão verificada" : "Status não confirmado"}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Projeto configurado: <code className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[11px] text-emerald-950 font-bold">upuuqfojhqjgzsdycvxp.supabase.co</code>.
              </p>
              {resultadoTesteSupabase && (
                <div className={`mt-2.5 rounded-xl p-2.5 text-xs font-medium border ${
                  resultadoTesteSupabase.ok ? "bg-white text-emerald-800 border-emerald-300 shadow-xs" : "bg-red-50 text-red-800 border-red-200"
                }`}>
                  {resultadoTesteSupabase.ok ? "✅ " : "❌ "}
                  {resultadoTesteSupabase.mensagem} {resultadoTesteSupabase.duracao && `(Latência: ${resultadoTesteSupabase.duracao}ms)`}
                </div>
              )}
            </div>
          </div>

          {/* Lista de Tabelas Ativas */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tabelas Sincronizadas no PostgreSQL:
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                10 Tabelas Prontas
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
              {[
                "empresas",
                "clientes",
                "recebiveis",
                "cobrancas",
                "promessas",
                "reguas",
                "importacoes",
                "metas_recuperacao",
                "templates_mensagem",
                "conversas_ia",
              ].map((tab) => (
                <div key={tab} className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 font-mono text-[11px] text-slate-700 shadow-xs">
                  <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{tab}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dica da Vercel */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
            <Server className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-slate-800">Deploy na Vercel:</span> As credenciais do Supabase já estão embutidas com fallback seguro para produção. Caso queira gerenciá-las diretamente pelo painel da Vercel, basta adicionar as variáveis <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-slate-800">VITE_SUPABASE_URL</code> e <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-slate-800">VITE_SUPABASE_ANON_KEY</code> em <em>Settings &gt; Environment Variables</em>.
            </div>
          </div>

        </div>
      </div>

      {/* Modal de Checkout do Mercado Pago */}
      {modalCheckoutOpen && planoCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModalCheckoutOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/20">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-slate-900">Checkout Mercado Pago</h3>
                  <p className="text-[11px] text-slate-500">Assinatura mensal; ativação após confirmação do webhook</p>
                </div>
              </div>
              <button
                onClick={() => setModalCheckoutOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Resumo do Pedido */}
            <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">{planoCheckout.nome}</span>
                <span className="text-lg font-bold text-sky-900">R$ {planoCheckout.preco.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{planoCheckout.descricao}</p>
              <div className="mt-2 text-[11px] font-medium text-sky-700">
                Cobrança recorrente mensal via Mercado Pago
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <span className="text-xs text-slate-600">
                As formas de pagamento disponíveis serão informadas pelo Mercado Pago no checkout.
              </span>
            </div>

            {ativacaoSucesso ? (
              <div className="mt-5 flex items-center gap-2.5 rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-bold">Demonstração do plano {planoCheckout.nome} atualizada</p>
                  <p className="text-[11px] font-normal text-emerald-700">Nenhuma cobrança ou assinatura real foi criada.</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-2.5">
                {checkoutError && (
                  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                    {checkoutError}
                  </p>
                )}
                {/* Botão de Redirecionamento Oficial */}
                <button
                  type="button"
                  onClick={handleIrParaMercadoPago}
                  disabled={ativandoPlano}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#009EE3] py-3.5 text-xs font-bold text-white hover:bg-[#0089c7] shadow-md shadow-sky-500/25 transition-all"
                >
                  <span>{ativandoPlano ? "Preparando checkout..." : "Assinar com Mercado Pago"}</span>
                  <ExternalLink className="h-4 w-4" />
                </button>

                {/* Opção para Testes / Simulação de Aprovação */}
                {base44.isDemoMode() && <button
                  type="button"
                  onClick={handleSimularAprovacao}
                  disabled={ativandoPlano}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <span>{ativandoPlano ? "Atualizando demonstração..." : "Simular alteração (somente demonstração)"}</span>
                </button>}
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="h-3 w-3" />
              <span>A contratação é processada no checkout do Mercado Pago.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
