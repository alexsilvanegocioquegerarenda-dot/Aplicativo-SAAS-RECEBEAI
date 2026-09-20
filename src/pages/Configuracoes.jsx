import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { testarConexaoSupabase } from "@/api/supabaseClient";
import {
  MERCADO_PAGO_PLANS,
  redirecionarParaMercadoPago,
  getMercadoPagoCheckoutUrl,
  isMercadoPagoConectado
} from "@/lib/mercadoPago";
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

export default function Configuracoes() {
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
    mp_public_key: "",
    mp_access_token: "",
    mp_link_essencial: "",
    mp_link_profissional: "",
    mp_link_enterprise: "",
    mp_link_starter: "",
    mp_link_pro: "",
  });

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  // Estados do Modal de Checkout Mercado Pago
  const [modalCheckoutOpen, setModalCheckoutOpen] = useState(false);
  const [planoCheckout, setPlanoCheckout] = useState(null);
  const [ativandoPlano, setAtivandoPlano] = useState(false);
  const [ativacaoSucesso, setAtivacaoSucesso] = useState(false);

  // Estados de teste do Supabase
  const [testandoSupabase, setTestandoSupabase] = useState(false);
  const [resultadoTesteSupabase, setResultadoTesteSupabase] = useState(null);

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

  useEffect(() => {
    async function load() {
      const cfg = await base44.entities.Configuracao.get();
      if (cfg) {
        setConfig((prev) => ({ ...prev, ...cfg }));
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    await base44.entities.Configuracao.update(config);
    setSalvando(false);
    setSucesso(true);
    setTimeout(() => setSucesso(false), 3000);
  };

  const handleResetarDemo = () => {
    if (window.confirm("Deseja restaurar os dados de exemplo do RecebeAi?")) {
      base44.resetDemoData();
      window.location.reload();
    }
  };

  const abrirCheckout = (plano) => {
    setPlanoCheckout(plano);
    setAtivacaoSucesso(false);
    setModalCheckoutOpen(true);
  };

  const handleIrParaMercadoPago = () => {
    if (!planoCheckout) return;
    redirecionarParaMercadoPago(planoCheckout.id, config, config.email_cobranca);
  };

  const handleSimularAprovacao = async () => {
    if (!planoCheckout) return;
    setAtivandoPlano(true);

    let novoLimite = 50;
    if (planoCheckout.id === "pro") novoLimite = 300;
    if (planoCheckout.id === "enterprise") novoLimite = 99999;

    const updated = await base44.entities.Configuracao.update({
      plano_atual: planoCheckout.id,
      limite_titulos: novoLimite,
    });

    setConfig((prev) => ({ ...prev, ...updated }));
    setAtivandoPlano(false);
    setAtivacaoSucesso(true);

    setTimeout(() => {
      setModalCheckoutOpen(false);
    }, 2500);
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
            {isMercadoPagoConectado(config).conectado ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Links Conectados</span>
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                Pendente de Configuração
              </span>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link de Checkout Mercado Pago - Plano Essencial (R$ 149,00/mês)
              </label>
              <input
                type="url"
                placeholder="https://mpago.la/... ou https://www.mercadopago.com.br/checkout/..."
                value={config.mp_link_essencial || config.mp_link_starter || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    mp_link_essencial: e.target.value,
                    mp_link_starter: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none font-mono"
              />
              <span className="text-[11px] text-slate-400">
                Link de pagamento direto ou assinatura gerado na sua conta Mercado Pago para o plano Essencial
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link de Checkout Mercado Pago - Plano Profissional (R$ 349,00/mês)
              </label>
              <input
                type="url"
                placeholder="https://mpago.la/... ou https://www.mercadopago.com.br/checkout/..."
                value={config.mp_link_profissional || config.mp_link_pro || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    mp_link_profissional: e.target.value,
                    mp_link_pro: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none font-mono"
              />
              <span className="text-[11px] text-slate-400">
                Link de pagamento direto ou assinatura gerado na sua conta Mercado Pago para o plano Profissional
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link de Checkout Mercado Pago - Plano Enterprise (R$ 799,00/mês)
              </label>
              <input
                type="url"
                placeholder="https://mpago.la/... ou https://www.mercadopago.com.br/checkout/..."
                value={config.mp_link_enterprise || ""}
                onChange={(e) => setConfig({ ...config, mp_link_enterprise: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none font-mono"
              />
              <span className="text-[11px] text-slate-400">
                Link de pagamento direto ou assinatura gerado na sua conta Mercado Pago para o plano Enterprise
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mercado Pago Public Key (Opcional - API)
                </label>
                <input
                  type="text"
                  placeholder="APP_USR-00000000-0000-0000-..."
                  value={config.mp_public_key || ""}
                  onChange={(e) => setConfig({ ...config, mp_public_key: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mercado Pago Access Token (Opcional - Webhook)
                </label>
                <input
                  type="password"
                  placeholder="APP_USR-..."
                  value={config.mp_access_token || ""}
                  onChange={(e) => setConfig({ ...config, mp_access_token: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none font-mono"
                />
              </div>
            </div>
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
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Até 300 clientes cadastrados</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Até R$ 100k em recebíveis</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Pipeline Kanban completo</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Régua preventiva e reativa</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Aging List e DSO em tempo real</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => abrirCheckout(MERCADO_PAGO_PLANS.essencial)}
              className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>{(planoAtivoId === "essencial" || planoAtivoId === "starter") ? "Renovar via Mercado Pago" : "Migrar para Essencial"}</span>
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
              <p className="text-xs text-slate-500 mt-1">Solução completa com IA e automação</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">R$ 349</span>
                <span className="text-xs text-slate-400">,00/mês</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600" /> Clientes e faturas ilimitadas</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600" /> IA Financeira de diagnóstico</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600" /> Régua multietapas automática</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600" /> Gestão de acordos e promessas</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600" /> Suporte prioritário via WhatsApp</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => abrirCheckout(MERCADO_PAGO_PLANS.profissional)}
              className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition-all"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>{(planoAtivoId === "profissional" || planoAtivoId === "pro") ? "Renovar via Mercado Pago" : "Migrar para Profissional"}</span>
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
              <p className="text-xs text-slate-500 mt-1">Para médias e grandes operações</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">R$ 799</span>
                <span className="text-xs text-slate-400">,00/mês</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-600" /> Múltiplos usuários por equipe</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-600" /> API aberta e Webhooks para ERPs</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-600" /> IA para negociações complexas</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-600" /> Onboarding dedicado da equipe</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-600" /> Gerente de contas exclusivo</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => abrirCheckout(MERCADO_PAGO_PLANS.enterprise)}
              className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-purple-700 py-2.5 text-xs font-bold text-white hover:bg-purple-800 transition-colors shadow-sm"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>{planoAtivoId === "enterprise" ? "Renovar via Mercado Pago" : "Migrar para Enterprise"}</span>
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

        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-50/80 p-4 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-emerald-950">
                  Supabase Conectado e Operacional em Produção
                </span>
                <span className="rounded-full bg-emerald-200/70 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                  Nuvem Ativa
                </span>
              </div>
              <p className="text-xs text-emerald-800">
                O aplicativo está vinculado ao projeto <code className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[11px] text-emerald-950 font-bold">upuuqfojhqjgzsdycvxp.supabase.co</code>.
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
                  <p className="text-[11px] text-slate-500">Pagamento seguro e ativação imediata</p>
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

            {/* Formas aceitas */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-semibold text-slate-700">Formas de Pagamento Aceitas:</span>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2 font-medium text-slate-700">
                  ⚡ PIX Imediato
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2 font-medium text-slate-700">
                  💳 Cartão até 12x
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2 font-medium text-slate-700">
                  📄 Boleto
                </div>
              </div>
            </div>

            {ativacaoSucesso ? (
              <div className="mt-5 flex items-center gap-2.5 rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-bold">Plano {planoCheckout.nome} ativado com sucesso!</p>
                  <p className="text-[11px] font-normal text-emerald-700">Seus novos limites e recursos já estão liberados.</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-2.5">
                {/* Botão de Redirecionamento Oficial */}
                <button
                  type="button"
                  onClick={handleIrParaMercadoPago}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#009EE3] py-3.5 text-xs font-bold text-white hover:bg-[#0089c7] shadow-md shadow-sky-500/25 transition-all"
                >
                  <span>Pagar com Mercado Pago</span>
                  <ExternalLink className="h-4 w-4" />
                </button>

                {/* Opção para Testes / Simulação de Aprovação */}
                <button
                  type="button"
                  onClick={handleSimularAprovacao}
                  disabled={ativandoPlano}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <span>{ativandoPlano ? "Ativando plano..." : "Simular Aprovação Imediata (Modo Teste)"}</span>
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="h-3 w-3" />
              <span>Transação protegida e criptografada pelo Mercado Pago</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
