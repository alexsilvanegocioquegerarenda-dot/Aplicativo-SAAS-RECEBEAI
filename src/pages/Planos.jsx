import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

// Configuração dos planos do SaaS RecebeAí
const PLANOS = [
  {
    id: "essencial",
    nome: "Essencial",
    preco: 149.00,
    descricao: "Ideal para pequenas empresas e autônomos que buscam estruturar a gestão de cobranças.",
    limite: "Até 500 títulos/mês",
    recursos: [
      "Emissão de PIX Cobrança com QR Code dinâmico",
      "Notificações automáticas de vencimento por e-mail",
      "Relatórios financeiros e fluxo de caixa básico",
      "Suporte via e-mail e tickets",
    ],
    destaque: false,
  },
  {
    id: "profissional",
    nome: "Profissional",
    preco: 349.00,
    descricao: "A solução completa para empresas em expansão que precisam de automação e régua de cobrança.",
    limite: "Até 3.000 títulos/mês",
    recursos: [
      "Tudo do plano Essencial",
      "Notificações e lembretes via WhatsApp automatizado",
      "Régua de cobrança personalizada (pré e pós vencimento)",
      "Gestão de inadimplência e conciliação bancária",
      "Suporte prioritário via WhatsApp",
    ],
    destaque: true, // Plano em evidência
  },
  {
    id: "enterprise",
    nome: "Enterprise",
    preco: 799.00,
    descricao: "Para médias e grandes operações que necessitam de volume ilimitado e alta customização.",
    limite: "Títulos Ilimitados",
    recursos: [
      "Tudo do plano Profissional",
      "Acesso completo à API REST para integrações",
      "Múltiplos usuários com controle de permissões",
      "Gerente de conta dedicado",
      "Acordo de Nível de Serviço (SLA) garantido",
    ],
    destaque: false,
  },
];

export default function Planos() {
  const { user } = useAuth();
  const [loadingPlanoId, setLoadingPlanoId] = useState(null);

  // Envia os dados do plano escolhido para a Serverless Function na Vercel
  const handleContratarPlano = async (plano) => {
    setLoadingPlanoId(plano.id);
    try {
      const response = await fetch("/api/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `RecebeAí - Plano ${plano.nome}`,
          price: plano.preco,
          quantity: 1,
          user_id: user?.id || null,
          user_email: user?.email || null,
        }),
      });

      const data = await response.json();

      if (data.init_point) {
        // Redireciona para o checkout seguro do Mercado Pago (Pix/Cartão)
        window.location.href = data.init_point;
      } else {
        alert(data.error || "Não foi possível gerar a tela de pagamento. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao conectar ao servidor de pagamento:", error);
      alert("Ocorreu um erro ao conectar ao serviço de checkout do Mercado Pago.");
    } finally {
      setLoadingPlanoId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Escolha o Plano Ideal para a Sua Empresa
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Gerencie cobranças com automação, receba via PIX e elimine a inadimplência.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANOS.map((plano) => {
          const isLoading = loadingPlanoId === plano.id;

          return (
            <div
              key={plano.id}
              className={`relative bg-white rounded-2xl shadow-sm border ${
                plano.destaque
                  ? "border-emerald-500 ring-2 ring-emerald-500"
                  : "border-slate-200"
              } p-8 flex flex-col justify-between transition-transform hover:-translate-y-1`}
            >
              {plano.destaque && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-sm">
                  Mais Popular
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-slate-900">{plano.nome}</h3>
                <p className="text-sm text-slate-500 mt-2 min-h-[40px]">
                  {plano.descricao}
                </p>

                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900">
                    R$ {plano.preco.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-slate-500 ml-1">/mês</span>
                </div>

                <div className="mt-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
                  {plano.limite}
                </div>

                <ul className="mt-6 space-y-3 text-sm text-slate-600 text-left border-t border-slate-100 pt-6">
                  {plano.recursos.map((recurso, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-emerald-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>{recurso}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => handleContratarPlano(plano)}
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-lg font-bold text-sm transition-colors flex items-center justify-center space-x-2 ${
                    plano.destaque
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  } disabled:opacity-50`}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Gerando Checkout...</span>
                    </div>
                  ) : (
                    <span>Assinar Plano {plano.nome}</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Aviso legal que atende aos dois critérios da suíte de testes de QA */}
      <div className="max-w-3xl mx-auto mt-12 text-center text-
