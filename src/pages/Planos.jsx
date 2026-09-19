import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "../api/base44Client";
import {
  Check,
  Zap,
  ShieldCheck,
  CreditCard,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function Planos() {
  const [searchParams] = useSearchParams();
  const [loadingPlano, setLoadingPlano] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState("mensal"); // mensal | anual

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      setStatusMessage({
        type: "success",
        title: "Assinatura realizada com sucesso!",
        desc: "Seu plano foi atualizado. Aproveite todos os recursos avançados do RecebeAi."
      });
    } else if (status === "canceled") {
      setStatusMessage({
        type: "warning",
        title: "Checkout não concluído",
        desc: "O processo de pagamento foi cancelado. Se tiver dúvidas, fale com nosso suporte."
      });
    }
  }, [searchParams]);

  const handleAssinar = async (planoKey) => {
    try {
      setLoadingPlano(planoKey);
      const res = await base44.functions.invoke("criarCheckoutStripe", {
        plano: planoKey,
        periodo: billingPeriod
      });

      if (res && res.data && res.data.url) {
        window.location.href = res.data.url;
      } else {
        // Modo demo ou fallback
        const nomePlano =
          planoKey === "enterprise"
            ? "Enterprise"
            : planoKey === "profissional"
            ? "Profissional"
            : "Essencial";
        setTimeout(() => {
          setStatusMessage({
            type: "success",
            title: `Plano ${nomePlano} selecionado!`,
            desc: "Ambiente de demonstração: simulação de checkout concluída com sucesso."
          });
          setLoadingPlano(null);
        }, 1200);
      }
    } catch (err) {
      console.error("Erro ao criar checkout:", err);
      alert("Não foi possível iniciar o checkout no momento. Tente novamente.");
      setLoadingPlano(null);
    }
  };

  const planos = [
    {
      id: "essencial",
      nome: "Essencial",
      descricao: "Ideal para pequenas empresas e autônomos organizarem e automatizarem suas cobranças.",
      precoMensal: 149,
      precoAnual: 119, // ~20% off
      destaque: false,
      recursos: [
        "Até 300 clientes cadastrados",
        "Até R$ 100k em recebíveis gerenciados",
        "Pipeline Kanban de cobrança completo",
        "Régua de cobrança preventiva e reativa (5 etapas)",
        "Templates personalizáveis de WhatsApp e E-mail",
        "Cálculo de Aging List e DSO em tempo real",
        "Importação de títulos e faturas via CSV",
        "Suporte por e-mail em até 24h úteis"
      ],
      cta: "Começar com Essencial",
      corBadge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    },
    {
      id: "profissional",
      nome: "Profissional",
      badge: "Mais Popular",
      descricao: "Solução completa com automação de IA, régua avançada e sem limites de carteira.",
      precoMensal: 349,
      precoAnual: 279, // ~20% off
      destaque: true,
      recursos: [
        "Clientes e recebíveis ilimitados",
        "IA Financeira para diagnóstico e insights de inadimplência",
        "Disparo automatizado de régua via WhatsApp API",
        "Priorização preditiva de devedores por score de risco",
        "Relatórios consolidados de taxa de recuperação vs meta",
        "Gestão de acordos e promessas com alertas de quebra",
        "Histórico e auditoria completa de importações em lote",
        "Suporte prioritário via WhatsApp com time especialista"
      ],
      cta: "Assinar Profissional",
      corBadge: "bg-emerald-500 text-white"
    },
    {
      id: "enterprise",
      nome: "Enterprise",
      badge: "Corporativo",
      descricao: "Para médias e grandes operações que exigem escala, múltiplos acessos e integrações diretas.",
      precoMensal: 799,
      precoAnual: 639, // ~20% off
      destaque: false,
      isEnterprise: true,
      recursos: [
        "Tudo do plano Profissional incluso",
        "Múltiplos usuários com controle de permissões por equipe",
        "API aberta de integração direta com ERPs e Bancos",
        "Regras de régua multicanal 100% customizadas com Webhooks",
        "IA Financeira avançada para negociações e acordos complexos",
        "Painel Master multi-empresas e relatórios customizados",
        "Onboarding e treinamento exclusivo para sua equipe",
        "Gerente de contas dedicado com SLA de suporte em até 1h"
      ],
      cta: "Contratar Enterprise",
      corBadge: "bg-purple-600 text-white"
    }
  ];

  const faqs = [
    {
      q: "Posso cancelar a qualquer momento?",
      a: "Sim, você pode cancelar sua assinatura mensal ou anual a qualquer momento sem multas ou taxas adicionais."
    },
    {
      q: "Como funciona a cobrança?",
      a: "O pagamento é processado com total segurança via Stripe através de cartão de crédito ou boleto bancário recorrente."
    },
    {
      q: "Há período de teste gratuito?",
      a: "Oferecemos 7 dias de garantia incondicional. Se não notar aumento na recuperação dos seus recebíveis, devolvemos 100% do valor."
    },
    {
      q: "Preciso de integração técnica para começar?",
      a: "Não! Você pode começar em menos de 3 minutos importando sua planilha de clientes ou cadastrando diretamente no sistema."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-16">
      {/* Header */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          Planos Transparentes e Sem Surpresas
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Recupere mais recebíveis com o plano certo
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Automatize réguas, calcule prazos médios de recebimento (DSO) e conte com Inteligência Artificial para acelerar o fluxo de caixa.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center pt-2">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl inline-flex items-center gap-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setBillingPeriod("mensal")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                billingPeriod === "mensal"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod("anual")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all inline-flex items-center gap-1.5 ${
                billingPeriod === "anual"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              <span>Anual</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                -20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Banner status se veio do redirect stripe */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
              : "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="font-semibold">{statusMessage.title}</h4>
            <p className="text-sm opacity-90">{statusMessage.desc}</p>
          </div>
        </div>
      )}

      {/* Cards dos Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
        {planos.map((plano) => {
          const preco = billingPeriod === "anual" ? plano.precoAnual : plano.precoMensal;
          const isLoading = loadingPlano === plano.id;

          return (
            <div
              key={plano.id}
              className={`relative rounded-2xl p-8 flex flex-col justify-between transition-all duration-200 ${
                plano.destaque
                  ? "bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-gray-900 border-2 border-emerald-500 shadow-xl shadow-emerald-500/10"
                  : plano.isEnterprise
                  ? "bg-gradient-to-b from-purple-50/40 to-white dark:from-purple-950/20 dark:to-gray-900 border-2 border-purple-500/60 shadow-lg shadow-purple-500/10"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md"
              }`}
            >
              {plano.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm ${
                      plano.destaque
                        ? "bg-emerald-600 text-white"
                        : "bg-purple-600 text-white"
                    }`}
                  >
                    {plano.badge}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {plano.nome}
                  </h3>
                  {plano.destaque && (
                    <Zap className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                  )}
                  {plano.isEnterprise && (
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 min-h-[44px] mb-6">
                  {plano.descricao}
                </p>

                {/* Preço */}
                <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-500 font-medium">R$</span>
                  <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {preco}
                  </span>
                  <span className="text-sm text-gray-500 font-medium">,00/mês</span>
                  {billingPeriod === "anual" && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold ml-2">
                      (cobrado anualmente)
                    </span>
                  )}
                </div>

                {/* Lista de Recursos */}
                <div className="space-y-3 mb-8">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    O que está incluso:
                  </p>
                  <ul className="space-y-3">
                    {plano.recursos.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <div
                          className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                            plano.destaque
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                              : plano.isEnterprise
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Botão CTA */}
              <button
                onClick={() => handleAssinar(plano.id)}
                disabled={isLoading}
                className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                  plano.destaque
                    ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-600/20"
                    : plano.isEnterprise
                    ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-purple-600/20"
                    : "bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Conectando ao Stripe...</span>
                  </>
                ) : (
                  <>
                    <span>{plano.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                Garantia de 7 Dias
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Devolução integral e sem burocracia se não ficar satisfeito.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                Pagamento 100% Seguro
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Processamento criptografado de ponta a ponta com Stripe.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                Ativação Instantânea
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Seus limites e recursos de IA liberados no primeiro segundo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-600" />
            Perguntas Frequentes
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tire suas dúvidas sobre os planos e contratação do RecebeAi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
            >
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                {faq.q}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
