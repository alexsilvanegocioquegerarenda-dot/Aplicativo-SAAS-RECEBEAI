import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate, daysBetween } from "@/lib/format";
import {
  Sliders,
  Play,
  RotateCw,
  Send,
  Edit2,
  Check,
  X,
  MessageSquare,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from "lucide-react";

const DEGRAUS_REGUA = [
  {
    id: 1,
    dias_min: 1,
    dias_max: 7,
    tom: "amigável",
    titulo: "Lembrete amigável",
    descricao: "Tom gentil e cordial, aviso de vencimento",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  {
    id: 2,
    dias_min: 8,
    dias_max: 15,
    tom: "educado e firme",
    titulo: "Cobrança regular",
    descricao: "Tom educado, cobra regularização da pendência",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  {
    id: 3,
    dias_min: 16,
    dias_max: 30,
    tom: "firme",
    titulo: "Cobrança firme",
    descricao: "Tom firme, alerta sobre impacto no limite comercial",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  {
    id: 4,
    dias_min: 31,
    dias_max: 60,
    tom: "urgente",
    titulo: "Cobrança urgente",
    descricao: "Tom urgente, aviso de consequências contratuais",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  {
    id: 5,
    dias_min: 61,
    dias_max: 99999,
    tom: "enérgico",
    titulo: "Aviso final",
    descricao: "Tom enérgico, risco de protesto e cobrança jurídica",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
];

function getDegrauPorDias(dias) {
  return DEGRAUS_REGUA.find((d) => dias >= d.dias_min && dias <= d.dias_max) || DEGRAUS_REGUA[DEGRAUS_REGUA.length - 1];
}

export default function Regua() {
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [recebiveis, setRecebiveis] = useState([]);
  const [cobrancas, setCobrancas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [resultadoProcessamento, setResultadoProcessamento] = useState(null);

  // Edição inline de mensagem
  const [editandoId, setEditandoId] = useState(null);
  const [mensagemEdicao, setMensagemEdicao] = useState("");

  const carregarDados = async () => {
    try {
      const [recList, cobList, cliList] = await Promise.all([
        base44.entities.Recebivel.list(),
        base44.entities.Cobranca.list(),
        base44.entities.Cliente.list(),
      ]);
      setRecebiveis(recList);
      setCobrancas(cobList);
      setClientes(cliList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const clientesMap = useMemo(() => {
    const map = {};
    clientes.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [clientes]);

  // Contagem de recebíveis em atraso por degrau
  const contagemPorDegrau = useMemo(() => {
    const contagem = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    recebiveis.forEach((r) => {
      if (r.status === "pago") return;
      const dias = daysBetween(r.vencimento);
      if (dias >= 1) {
        const d = getDegrauPorDias(dias);
        contagem[d.id] = (contagem[d.id] || 0) + 1;
      }
    });
    return contagem;
  }, [recebiveis]);

  // Rascunhos pendentes gerados pela régua
  const rascunhosRegua = useMemo(() => {
    return cobrancas
      .filter((c) => c.origem === "regua" && c.status === "rascunho")
      .reverse();
  }, [cobrancas]);

  // Disparar processamento automático da régua
  const handleProcessarRegua = async () => {
    setProcessando(true);
    setResultadoProcessamento(null);
    try {
      const res = await base44.functions.invoke("processarRegua", {});
      setResultadoProcessamento(res.data);
      await carregarDados();
    } finally {
      setProcessando(false);
    }
  };

  // Enviar WhatsApp e atualizar status
  const handleEnviarWhatsApp = async (cobranca) => {
    const cliente = clientesMap[cobranca.cliente_id];
    const telefone = (cliente?.telefone || "").replace(/\D/g, "");

    if (!telefone) {
      alert("Este cliente não possui telefone/WhatsApp cadastrado.");
      return;
    }

    // Abre link do WhatsApp com mensagem personalizada
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(cobranca.mensagem)}`;
    window.open(url, "_blank");

    // Atualiza status da cobrança para enviada
    const atualizada = await base44.entities.Cobranca.update(cobranca.id, {
      status: "enviada",
      data_envio: new Date().toISOString().split("T")[0],
    });

    setCobrancas((prev) => prev.map((c) => (c.id === cobranca.id ? atualizada : c)));
  };

  const handleSalvarEdicao = async (id) => {
    const atualizada = await base44.entities.Cobranca.update(id, {
      mensagem: mensagemEdicao,
    });
    setCobrancas((prev) => prev.map((c) => (c.id === id ? atualizada : c)));
    setEditandoId(null);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Régua de Cobrança Automatizada
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              5 Degraus
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Escalonamento de mensagens e tom de cobrança progressivo conforme os dias de atraso de cada título
          </p>
        </div>

        <button
          onClick={handleProcessarRegua}
          disabled={processando}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {processando ? (
            <RotateCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4 fill-white" />
          )}
          <span>{processando ? "Processando títulos..." : "Processar Régua Agora"}</span>
        </button>
      </div>

      {/* Alerta de Resultado do Processamento */}
      {resultadoProcessamento && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 shadow-sm">
          <div className="flex items-center gap-2 font-bold">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>Processamento Concluído com Sucesso!</span>
          </div>
          <p className="mt-1">
            {resultadoProcessamento.gerados > 0
              ? `Foram gerados ${resultadoProcessamento.gerados} novo(s) rascunho(s) de cobrança prontos para envio. Total de ${resultadoProcessamento.analisados} recebíveis em atraso analisados.`
              : "Todos os recebíveis em atraso já estão em dia com os seus respectivos degraus. Nenhum novo envio gerado."}
          </p>
        </div>
      )}

      {/* Visão dos 5 Degraus da Régua */}
      <div className="mb-10">
        <h2 className="font-heading text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-blue-600" />
          <span>Degraus do Fluxo de Cobrança</span>
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DEGRAUS_REGUA.map((degrau) => {
            const count = contagemPorDegrau[degrau.id] || 0;

            return (
              <div
                key={degrau.id}
                className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between ${degrau.border} ${degrau.bg}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${degrau.dot}`}>
                      {degrau.id}
                    </span>
                    <span className={`text-[11px] font-bold ${degrau.text}`}>
                      {degrau.dias_min === 61 ? "60+ dias" : `${degrau.dias_min} a ${degrau.dias_max}d`}
                    </span>
                  </div>

                  <h3 className="mt-3 font-heading text-sm font-bold text-slate-900">{degrau.titulo}</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{degrau.descricao}</p>
                </div>

                <div className="mt-4 border-t border-slate-200/50 pt-2.5 text-xs font-semibold">
                  {count > 0 ? (
                    <span className={degrau.text}>{count} recebível(eis) elegível(eis)</span>
                  ) : (
                    <span className="text-slate-400 font-normal">Nenhum título agora</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de Envios Prontos (Rascunhos) */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Envios Prontos da Régua
            </h2>
            <p className="text-xs text-slate-500">
              Rascunhos gerados pela régua prontos para disparo via WhatsApp
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {rascunhosRegua.length} rascunho(s)
          </span>
        </div>

        {rascunhosRegua.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-base font-semibold text-slate-900">Nenhum envio pendente</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              Clique em <strong>"Processar Régua Agora"</strong> acima para gerar automaticamente os rascunhos de cobrança conforme o tempo de atraso.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rascunhosRegua.map((cobranca) => {
              const degrau = DEGRAUS_REGUA.find((d) => d.id === cobranca.regua_step) || DEGRAUS_REGUA[0];
              const cliente = clientesMap[cobranca.cliente_id];
              const isEditando = editandoId === cobranca.id;

              return (
                <div
                  key={cobranca.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/clientes/${cobranca.cliente_id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 hover:underline text-sm"
                        >
                          {cobranca.cliente_nome || cliente?.nome || "Cliente"}
                        </Link>
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${degrau.bg} ${degrau.text} border ${degrau.border}`}>
                          Degrau {cobranca.regua_step || degrau.id} • Tom {cobranca.regua_tom || degrau.tom}
                        </span>
                        {cliente?.telefone && (
                          <span className="text-xs text-slate-400">
                            WhatsApp: {cliente.telefone}
                          </span>
                        )}
                      </div>

                      {/* Conteúdo da Mensagem */}
                      {isEditando ? (
                        <div className="mt-3">
                          <textarea
                            value={mensagemEdicao}
                            onChange={(e) => setMensagemEdicao(e.target.value)}
                            rows={4}
                            className="w-full rounded-xl border border-blue-400 p-3 text-xs outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => handleSalvarEdicao(cobranca.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Salvar Mensagem</span>
                            </button>
                            <button
                              onClick={() => setEditandoId(null)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {cobranca.mensagem}
                        </p>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    {!isEditando && (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => {
                            setEditandoId(cobranca.id);
                            setMensagemEdicao(cobranca.mensagem);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => handleEnviarWhatsApp(cobranca)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-700 transition-colors"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Enviar WhatsApp</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
