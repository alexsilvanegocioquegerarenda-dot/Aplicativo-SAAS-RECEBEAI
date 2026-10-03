import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  cancelMercadoPagoSubscription,
  fetchBillingStatus,
  requestManualBillingReview,
  startMercadoPagoCheckout,
} from "../lib/billing";
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
  const { user, refreshUserProfile, demoSession } = useAuth();
  const [loadingPlano, setLoadingPlano] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [cancelandoAssinatura, setCancelandoAssinatura] = useState(false);
  const [canCancelSubscription, setCanCancelSubscription] = useState(false);
  const [canRequestManualReview, setCanRequestManualReview] = useState(false);
  const [manualReviewStatus, setManualReviewStatus] = useState(null);
  const [mensagemRevisao, setMensagemRevisao] = useState("");
  const [solicitandoRevisao, setSolicitandoRevisao] = useState(false);

  useEffect(() => {
    let active = true;
    const status = searchParams.get("status");
    if (demoSession) {
      if (status === "success") {
        setStatusMessage({
          type: "warning",
          title: "Demonstração: nenhuma assinatura foi criada",
          desc: "Use uma conta real e o checkout configurado para testar uma contratação.",
        });
      }
      return () => { active = false; };
    }

    fetchBillingStatus().then((billing) => {
      if (!active) return;
      setCanCancelSubscription(billing.canCancel);
      setCanRequestManualReview(billing.canRequestManualReview);
      setManualReviewStatus(billing.manualReviewStatus);
      if (billing.status === "active" && user?.subscription_status !== "active") {
        void refreshUserProfile().catch((error) => {
          setStatusMessage({
            type: "warning",
            title: "Assinatura confirmada; atualize a sessão",
            desc: error.message || "Atualize a página para liberar o acesso ao plano.",
          });
        });
      }
      if (status === "success") {
        const isActive = billing.status === "active";
        setStatusMessage({
          type: isActive ? "success" : "warning",
          title: isActive ? "Assinatura confirmada" : "Aguardando confirmação do Mercado Pago",
          desc: isActive
            ? `O plano ${billing.plan} está ativo.`
            : "O retorno do checkout, sozinho, não confirma o pagamento. O acesso será liberado após a validação do webhook.",
        });
      }
    }).catch((error) => {
      if (active) {
        setStatusMessage({
          type: "warning",
          title: "Não foi possível consultar a assinatura",
          desc: error.message,
        });
      }
    });

    if (status === "canceled") {
      setStatusMessage({
        type: "warning",
        title: "Checkout não concluído",
        desc: "O processo foi cancelado. Nenhum plano é ativado pelo retorno do checkout."
      });
    }
    return () => { active = false; };
  }, [demoSession, refreshUserProfile, searchParams, user?.subscription_status]);

  const handleAssinar = async (planoKey) => {
    if (planoKey === "enterprise") return;
    try {
      setLoadingPlano(planoKey);
      await startMercadoPagoCheckout(planoKey);
    } catch (err) {
      setStatusMessage({
        type: "warning",
        title: "Não foi possível iniciar o checkout",
        desc: err.message || "Tente novamente ou fale com o responsável pela conta."
      });
      setLoadingPlano(null);
    }
  };

  const handleCancelarAssinatura = async () => {
    if (!window.confirm("Deseja cancelar a assinatura recorrente do Mercado Pago?")) return;
    setCancelandoAssinatura(true);
    try {
      await cancelMercadoPagoSubscription();
      const updatedUser = await refreshUserProfile();
      setCanCancelSubscription(false);
      setStatusMessage({
        type: "warning",
        title: "Assinatura cancelada",
        desc: "O Mercado Pago confirmou o cancelamento. O acesso pago foi encerrado.",
      });
      if (updatedUser?.subscription_status !== "canceled") {
        throw new Error("O Mercado Pago cancelou, mas o estado da conta ainda não foi atualizado. Atualize a página antes de continuar.");
      }
    } catch (error) {
      setStatusMessage({
        type: "warning",
        title: "Não foi possível cancelar a assinatura",
        desc: error.message,
      });
    } finally {
      setCancelandoAssinatura(false);
    }
  };

  const handleSolicitarRevisao = async (event) => {
    event.preventDefault();
    setSolicitandoRevisao(true);
    try {
      const { review } = await requestManualBillingReview(mensagemRevisao);
      setManualReviewStatus(review.status);
      setCanRequestManualReview(false);
      setMensagemRevisao("");
      setStatusMessage({
        type: "warning",
        title: "Revisão solicitada",
        desc: "A equipe responsável verificará a cobrança no Mercado Pago. Esta solicitação não ativa o plano.",
      });
    } catch (error) {
      setStatusMessage({
        type: "warning",
        title: "Não foi possível solicitar a revisão",
        desc: error.message,
      });
    } finally {
      setSolicitandoRevisao(false);
    }
  };

  const planos = [
    {
      id: "essencial",
      nome: "Essencial",
      descricao: "Ideal para pequenas empresas e autônomos organizarem seus recebíveis.",
      preco: 149,
      destaque: false,
      recursos: [
        "Cadastro e organização de clientes",
        "Gestão de recebíveis e vencimentos",
        "Baixa manual de pagamentos",
        "Visões de Aging e DSO",
        "Importação de dados por CSV",
        "Mensagens de cobrança preparadas para envio manual"
      ],
      cta: "Começar com Essencial",
      corBadge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    },
    {
      id: "profissional",
      nome: "Profissional",
      badge: "Mais Popular",
      descricao: "Ferramentas para acompanhar recebíveis, negociações e recuperação.",
      preco: 349,
      destaque: true,
      recursos: [
        "Recursos do plano Essencial",
        "Quadro Kanban para acompanhar cobranças e promessas",
        "Indicadores e análises calculados a partir da carteira",
        "Priorização orientativa de cobranças",
        "Metas e histórico de importações",
        "Templates de mensagens configuráveis"
      ],
      cta: "Assinar Profissional",
      corBadge: "bg-emerald-500 text-white"
    },
    {
      id: "enterprise",
      nome: "Enterprise",
      badge: "Corporativo",
      descricao: "Plano ainda indisponível para contratação automática.",
      preco: null,
      destaque: false,
      isEnterprise: true,
      recursos: [
        "A contratação será disponibilizada após definição de escopo e condições."
      ],
      cta: "Contratar Enterprise",
      corBadge: "bg-purple-600 text-white"
    }
  ];

  const faqs = [
    {
      q: "Como funciona o cancelamento?",
      a: "Consulte as condições de cancelamento apresentadas no checkout antes de concluir a contratação."
    },
    {
      q: "Como funciona a cobrança?",
      a: "O checkout cria uma assinatura recorrente mensal no Mercado Pago. O valor e as condições são apresentados antes da confirmação."
    },
    {
      q: "Quando meu plano será ativado?",
      a: "O retorno do checkout não comprova pagamento. A ativação só deve ser considerada após a confirmação da cobrança."
    },
    {
      q: "Preciso de integração técnica para começar?",
      a: "O tempo de configuração depende dos dados e da operação de cada empresa. Você pode cadastrar clientes manualmente ou importar dados por CSV."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-16">
      {/* Header */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          Planos e condições
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Recupere mais recebíveis com o plano certo
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Assinaturas mensais de R$ 149 (Essencial) e R$ 349 (Profissional). Confira as condições apresentadas pelo Mercado Pago antes de contratar.
        </p>

        {/* Badge Informativa */}
        <div className="flex items-center justify-center pt-1">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            O acesso é liberado somente após confirmação do Mercado Pago.
          </span>
        </div>
      </div>

      {/* O retorno do checkout não confirma pagamento nem altera a assinatura. */}
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

      {manualReviewStatus === "pending" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Sua solicitação de revisão manual está aguardando análise. Ela não ativa o plano automaticamente.
        </div>
      )}

      {manualReviewStatus === "rejected" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          A última solicitação de revisão foi encerrada sem aprovação. Se acredita que houve um erro, solicite uma nova análise.
        </div>
      )}

      {canRequestManualReview && (
        <form onSubmit={handleSolicitarRevisao} className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">Pagamento ainda não confirmado?</h2>
          <p className="mt-1 text-sm text-slate-600">
            Solicite uma revisão manual da assinatura pendente. A equipe verificará a cobrança no painel do Mercado Pago.
          </p>
          <label className="mt-3 block text-xs font-medium text-slate-700">
            Observação ou referência do pagamento (opcional; não informe dados de cartão)
            <textarea
              value={mensagemRevisao}
              onChange={(event) => setMensagemRevisao(event.target.value)}
              maxLength={1000}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={solicitandoRevisao}
            className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {solicitandoRevisao ? "Enviando solicitação..." : "Solicitar revisão manual"}
          </button>
        </form>
      )}

      {canCancelSubscription && ["active", "past_due"].includes(user?.subscription_status) && (
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">Plano atual: {user.plano}</p>
          <p className="mt-1">Alterações de plano ainda não estão disponíveis. Você pode cancelar a assinatura recorrente abaixo.</p>
          <button
            type="button"
            onClick={handleCancelarAssinatura}
            disabled={cancelandoAssinatura}
            className="mt-3 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-800 disabled:opacity-60"
          >
            {cancelandoAssinatura ? "Cancelando..." : "Cancelar assinatura"}
          </button>
        </section>
      )}

      {/* Cards dos Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
        {planos.map((plano) => {
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
                  {plano.preco == null ? (
                    <span className="text-xl font-bold text-gray-500">Indisponível no momento</span>
                  ) : (
                    <>
                      <span className="text-sm text-gray-500 font-medium">R$</span>
                      <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {plano.preco}
                      </span>
                      <span className="text-sm text-gray-500 font-medium">,00/mês</span>
                    </>
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
                disabled={isLoading || plano.id === "enterprise" || ["active", "past_due"].includes(user?.subscription_status)}
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
                    <span>Abrindo checkout...</span>
                  </>
                ) : (
                  <>
                    <span>{plano.id === "enterprise" ? "Indisponível no momento" : plano.cta}</span>
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
                Condições da contratação
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Confira cancelamento e reembolso no checkout antes de pagar.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                Checkout Mercado Pago
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                A assinatura mensal é criada no checkout seguro do Mercado Pago.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                Confirmação necessária
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                O webhook validado do Mercado Pago controla a ativação e o cancelamento.
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
