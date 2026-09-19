import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate, daysBetween, calcRecebivelStatus } from "@/lib/format";
import { calcAgingFaixa, agingFaixaConfig } from "@/lib/aging";
import {
  Clock,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
  Receipt,
  User,
  ExternalLink,
  ChevronRight,
  Filter,
  Search
} from "lucide-react";

const KANBAN_STAGES = [
  {
    id: "pendente",
    label: "Pendente",
    desc: "A vencer ou em dia",
    icon: Clock,
    accent: "text-slate-600",
    dot: "bg-slate-400",
    headerBg: "bg-slate-50 border-slate-200",
    countBadge: "bg-slate-200 text-slate-700",
  },
  {
    id: "em_cobranca",
    label: "Em Cobrança",
    desc: "Vencidos sem acordo",
    icon: AlertTriangle,
    accent: "text-red-600",
    dot: "bg-red-500",
    headerBg: "bg-red-50/70 border-red-200",
    countBadge: "bg-red-200 text-red-800",
  },
  {
    id: "prometido",
    label: "Prometido",
    desc: "Acordo de pagamento firmado",
    icon: HeartHandshake,
    accent: "text-amber-600",
    dot: "bg-amber-500",
    headerBg: "bg-amber-50/70 border-amber-200",
    countBadge: "bg-amber-200 text-amber-800",
  },
  {
    id: "liquidado",
    label: "Liquidado",
    desc: "Valores quitados",
    icon: CheckCircle2,
    accent: "text-emerald-600",
    dot: "bg-emerald-500",
    headerBg: "bg-emerald-50/70 border-emerald-200",
    countBadge: "bg-emerald-200 text-emerald-800",
  },
];

export default function Kanban() {
  const [loading, setLoading] = useState(true);
  const [recebiveis, setRecebiveis] = useState([]);
  const [promessas, setPromessas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");

  const carregarDados = async () => {
    try {
      const [recList, promList, cliList] = await Promise.all([
        base44.entities.Recebivel.list(),
        base44.entities.Promessa.list(),
        base44.entities.Cliente.list(),
      ]);
      setRecebiveis(recList);
      setPromessas(promList);
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

  // Identifica quais recebíveis possuem promessa ativa
  const recebiveisPrometidosSet = useMemo(() => {
    const set = new Set();
    promessas.forEach((p) => {
      if (["aberta", "pendente"].includes(p.status)) {
        if (p.recebivel_id) set.add(p.recebivel_id);
      }
    });
    return set;
  }, [promessas]);

  // Agrupa os recebíveis nos 4 estágios do Kanban
  const colunas = useMemo(() => {
    const grupos = {
      pendente: [],
      em_cobranca: [],
      prometido: [],
      liquidado: [],
    };

    recebiveis.forEach((r) => {
      const statusCalc = calcRecebivelStatus(r);
      const dias = daysBetween(r.vencimento);
      const saldo = r.status === "pago" ? 0 : Math.max(0, (Number(r.valor) || 0) - (Number(r.valor_pago) || 0));
      const faixaAging = calcAgingFaixa(dias, statusCalc);
      const clienteNome = r.cliente_nome || clientesMap[r.cliente_id]?.nome || "Cliente";

      // Filtro de busca
      if (
        busca &&
        !clienteNome.toLowerCase().includes(busca.toLowerCase()) &&
        !(r.nota_fiscal || "").toLowerCase().includes(busca.toLowerCase())
      ) {
        return;
      }

      let estagio = "pendente";
      if (r.status === "pago" || statusCalc === "pago") {
        estagio = "liquidado";
      } else if (recebiveisPrometidosSet.has(r.id)) {
        estagio = "prometido";
      } else if (statusCalc === "atrasado" || dias > 0) {
        estagio = "em_cobranca";
      } else {
        estagio = "pendente";
      }

      grupos[estagio].push({
        ...r,
        statusCalc,
        dias,
        saldo: r.status === "pago" ? Number(r.valor) : saldo,
        faixaAging,
        clienteNome,
      });
    });

    // Ordena cada coluna por maior saldo
    Object.keys(grupos).forEach((col) => {
      grupos[col].sort((a, b) => b.saldo - a.saldo);
    });

    return grupos;
  }, [recebiveis, recebiveisPrometidosSet, clientesMap, busca]);

  const handleMarcarPago = async (id, valorTotal) => {
    await base44.entities.Recebivel.update(id, {
      status: "pago",
      valor_pago: valorTotal,
      data_pagamento: new Date().toISOString().split("T")[0],
    });
    await carregarDados();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header da Página */}
      <div className="border-b border-slate-200 bg-white px-5 py-6 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Kanban de Recebíveis
              </h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                Pipeline Visual
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {recebiveis.length} títulos distribuídos por estágio de recuperação e cobrança
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cliente ou NF..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <Link
              to="/recebiveis"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Receipt className="h-4 w-4" />
              <span>Ver Tabela</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Área das Colunas Kanban */}
      <div className="flex-1 overflow-x-auto p-5 md:p-8">
        <div className="grid min-w-[1080px] grid-cols-4 gap-5">
          {KANBAN_STAGES.map((coluna) => {
            const cards = colunas[coluna.id] || [];
            const saldoTotal = cards.reduce((acc, c) => acc + c.saldo, 0);
            const Icon = coluna.icon;

            return (
              <div
                key={coluna.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-slate-100/70 shadow-sm"
              >
                {/* Cabeçalho da Coluna */}
                <div className={`rounded-t-2xl border-b p-4 ${coluna.headerBg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ${coluna.accent}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="font-heading text-sm font-bold text-slate-900">{coluna.label}</h2>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${coluna.countBadge}`}>
                            {cards.length}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{coluna.desc}</p>
                      </div>
                    </div>
                    <span className={`h-2.5 w-2.5 rounded-full ${coluna.dot}`} />
                  </div>

                  <div className="mt-3 flex items-baseline justify-between border-t border-slate-200/60 pt-2 text-xs">
                    <span className="font-medium text-slate-500">Volume Total:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(saldoTotal)}</span>
                  </div>
                </div>

                {/* Lista de Cards da Coluna */}
                <div
                  className="flex-1 space-y-3 overflow-y-auto p-3.5"
                  style={{ maxHeight: "calc(100vh - 270px)" }}
                >
                  {cards.length === 0 ? (
                    <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/50 p-4 text-center">
                      <p className="text-xs font-medium text-slate-400">Nenhum título neste estágio</p>
                    </div>
                  ) : (
                    cards.map((item) => {
                      const cfgFaixa = item.faixaAging ? agingFaixaConfig[item.faixaAging] : null;

                      return (
                        <div
                          key={item.id}
                          className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
                        >
                          {/* Nome do Cliente & Valor */}
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/clientes/${item.cliente_id}`}
                              className="font-medium text-slate-900 hover:text-blue-600 hover:underline line-clamp-1 text-sm"
                              title={item.clienteNome}
                            >
                              {item.clienteNome}
                            </Link>
                            <span className="shrink-0 font-heading text-sm font-bold text-slate-900">
                              {formatCurrency(item.saldo)}
                            </span>
                          </div>

                          {/* NF & Vencimento */}
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <span>{item.nota_fiscal ? `NF ${item.nota_fiscal}` : "Sem NF"}</span>
                            <span>Venc.: {formatDate(item.vencimento)}</span>
                          </div>

                          {/* Badges de Aging e Status de Atraso */}
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 pt-2.5">
                            {cfgFaixa && (
                              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${cfgFaixa.badge}`}>
                                {cfgFaixa.label}
                              </span>
                            )}

                            {item.statusCalc === "atrasado" && item.dias > 0 && (
                              <span className="text-[11px] font-bold text-red-600">
                                {item.dias} {item.dias === 1 ? "dia atrasado" : "dias atrasados"}
                              </span>
                            )}

                            {coluna.id === "liquidado" && (
                              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Pago
                              </span>
                            )}
                          </div>

                          {/* Ações rápidas no Hover */}
                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                            <Link
                              to={`/clientes/${item.cliente_id}`}
                              className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600"
                            >
                              <span>Ver cliente</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>

                            {coluna.id !== "liquidado" && (
                              <button
                                onClick={() => handleMarcarPago(item.id, item.valor)}
                                className="font-semibold text-emerald-600 hover:underline"
                                title="Liquidar título"
                              >
                                Marcar como pago
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
