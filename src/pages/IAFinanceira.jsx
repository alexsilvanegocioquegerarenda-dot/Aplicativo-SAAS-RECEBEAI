import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCw,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Trash2
} from "lucide-react";

const CHIPS_SUGESTOES = [
  "Quem devo cobrar hoje?",
  "Quais clientes possuem maior risco?",
  "Quanto tenho para receber nos próximos 30 dias?",
  "Qual cliente está quebrando mais promessas?",
  "Quem representa 80% da minha inadimplência?",
  "Analise minha carteira.",
];

export default function IAFinanceira() {
  const [mensagens, setMensagens] = useState([
    {
      role: "assistant",
      text: "Olá! Sou a IA Financeira do RecebeAi. Posso analisar sua carteira em tempo real, identificar devedores de alto risco, calcular projeções de caixa e recomendar estratégias de cobrança personalizadas.\n\nEscolha uma pergunta abaixo ou digite sua dúvida!",
    },
  ]);
  const [inputPergunta, setInputPergunta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const fimConversaRef = useRef(null);

  // Carrega histórico de conversas anteriores
  useEffect(() => {
    async function carregarHistorico() {
      try {
        const historico = await base44.entities.ConversaIA.list("-created_date", 10);
        if (historico && historico.length > 0) {
          const novas = [
            {
              role: "assistant",
              text: "Histórico recente carregado. Pergunte algo novo ou escolha um tópico abaixo:",
            },
          ];
          // Ordem cronológica
          [...historico].reverse().forEach((item) => {
            if (item.pergunta) novas.push({ role: "user", text: item.pergunta });
            if (item.resposta) novas.push({ role: "assistant", text: item.resposta });
          });
          setMensagens(novas);
        }
      } catch (e) {
        console.warn("Erro ao carregar histórico da IA:", e);
      }
    }
    carregarHistorico();
  }, []);

  // Auto-scroll
  useEffect(() => {
    fimConversaRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, carregando]);

  const handleEnviar = async (textoPersonalizado) => {
    const pergunta = textoPersonalizado || inputPergunta;
    if (!pergunta.trim() || carregando) return;

    setMensagens((prev) => [...prev, { role: "user", text: pergunta }]);
    setInputPergunta("");
    setCarregando(true);

    try {
      const res = await base44.functions.invoke("iaFinanceira", { pergunta });
      const resposta = res?.data?.resposta || "Não foi possível gerar a resposta. Tente novamente.";
      setMensagens((prev) => [...prev, { role: "assistant", text: resposta }]);
    } catch (e) {
      setMensagens((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Erro ao processar consulta: ${e.message || "tente novamente em instantes."}`,
        },
      ]);
    } finally {
      setCarregando(false);
    }
  };

  const handleLimparHistorico = async () => {
    setMensagens([
      {
        role: "assistant",
        text: "Conversa reiniciada. Em que posso ajudar na recuperação dos seus recebíveis hoje?",
      },
    ]);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col p-4 md:p-6">
      {/* Header do Chat */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg font-bold text-slate-900">IA Financeira Especializada</h1>
              <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                GPT-4 Turbo Carteira
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Análise instantânea de recebíveis, score de devedores e apoio a decisões de crédito
            </p>
          </div>
        </div>

        <button
          onClick={handleLimparHistorico}
          className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          title="Reiniciar chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {mensagens.map((msg, index) => {
          const isUser = msg.role === "user";

          return (
            <div key={index} className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  isUser
                    ? "bg-slate-900 text-white"
                    : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm"
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Balão */}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                    : "border border-slate-200 bg-white text-slate-800 shadow-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {carregando && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
              <RotateCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
              <span>Analisando base de recebíveis e histórico dos clientes...</span>
            </div>
          </div>
        )}

        <div ref={fimConversaRef} />
      </div>

      {/* Chips com Sugestões de Perguntas */}
      <div className="mt-3 mb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1.5">
          <Lightbulb className="h-3 w-3 text-amber-500" />
          <span>Sugestões rápidas de análise:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CHIPS_SUGESTOES.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleEnviar(chip)}
              disabled={carregando}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-xs hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 disabled:opacity-50 transition-all text-left"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Input de Envio */}
      <div className="border-t border-slate-200 pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEnviar();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Faça uma pergunta sobre a sua carteira de recebíveis..."
            value={inputPergunta}
            onChange={(e) => setInputPergunta(e.target.value)}
            disabled={carregando}
            className="flex-1 rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={carregando || !inputPergunta.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm shadow-blue-500/20 transition-colors"
          >
            {carregando ? <RotateCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
