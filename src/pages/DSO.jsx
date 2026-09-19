import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate } from "@/lib/format";
import { getDSOPeriodos, calcularDSOPeriodo, calcularDSOClientes } from "@/lib/dso";
import {
  Clock,
  Calendar,
  DollarSign,
  TrendingDown,
  Users,
  ChevronRight,
  Receipt,
  HelpCircle,
  Activity,
  ArrowUpRight
} from "lucide-react";

export default function DSO() {
  const [loading, setLoading] = useState(true);
  const [recebiveis, setRecebiveis] = useState([]);
  const [clientes, setClientes] = useState([]);
  const periodos = useMemo(() => getDSOPeriodos(), []);
  const [periodoSelecionadoId, setPeriodoSelecionadoId] = useState("30");

  const periodoAtual = useMemo(() => {
    return periodos.find((p) => p.id === periodoSelecionadoId) || periodos[0];
  }, [periodos, periodoSelecionadoId]);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [recList, cliList] = await Promise.all([
          base44.entities.Recebivel.list(),
          base44.entities.Cliente.list(),
        ]);
        setRecebiveis(recList);
        setClientes(cliList);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  // Cálculos consolidados de DSO no período selecionado
  const metricasDSO = useMemo(() => {
    return calcularDSOPeriodo(recebiveis, periodoAtual);
  }, [recebiveis, periodoAtual]);

  // Ranking individual de clientes por DSO
  const rankingClientes = useMemo(() => {
    return calcularDSOClientes(recebiveis, periodoAtual, clientes);
  }, [recebiveis, periodoAtual, clientes]);

  const getDSOColor = (dsoValue) => {
    if (dsoValue > 60) return "text-red-600";
    if (dsoValue > 30) return "text-amber-600";
    return "text-emerald-600";
  };

  const getDSOBadge = (dsoValue) => {
    if (dsoValue > 60) return "bg-red-50 text-red-700 border-red-200";
    if (dsoValue > 30) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              DSO • Prazo Médio de Recebimento
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              Days Sales Outstanding
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Mede o tempo médio em dias que a sua empresa leva para transformar vendas a prazo em dinheiro no caixa
          </p>
        </div>

        {/* Seletor de Período */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {periodos.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodoSelecionadoId(p.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                periodoSelecionadoId === p.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-barra de Informação do Período */}
      <div className="mb-6 flex items-center justify-between text-xs text-slate-500">
        <div>
          Período analisado:{" "}
          <strong className="text-slate-800">
            {formatDate(periodoAtual.inicio)} até {formatDate(periodoAtual.fim)}
          </strong>{" "}
          ({metricasDSO.dias} dias)
        </div>
        <div className="hidden sm:flex items-center gap-1 text-slate-400">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Fórmula: (Contas a Receber ÷ Vendas a Crédito) × Dias do Período</span>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* DSO Consolidado */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>DSO Consolidado</span>
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
          <div className={`mt-2 font-heading text-3xl font-bold ${getDSOColor(metricasDSO.dso)}`}>
            {metricasDSO.dso.toFixed(1)}{" "}
            <span className="text-sm font-normal text-slate-500">dias</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {metricasDSO.dso <= 30 ? "Excelente liquidez" : metricasDSO.dso <= 60 ? "Atrasos moderados" : "Risco elevado de caixa"}
          </div>
        </div>

        {/* Contas a Receber */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Contas a Receber</span>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
            {formatCurrency(metricasDSO.ar)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Saldo total não liquidado</div>
        </div>

        {/* Vendas a Crédito */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Vendas a Crédito</span>
            <Receipt className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
            {formatCurrency(metricasDSO.vendasCredito)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Emitidas no período selecionado</div>
        </div>

        {/* Dias Médios para Pagar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Dias p/ Pagar (Média)</span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
            {metricasDSO.pagosCount > 0 ? `${metricasDSO.diasParaPagar.toFixed(1)} dias` : "—"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {metricasDSO.pagosCount} títulos pagos no período
          </div>
        </div>
      </div>

      {/* Tabela de DSO Individual por Cliente */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="font-heading text-base font-bold text-slate-900">
              DSO Individual por Cliente
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifique os clientes que mais demoram para liquidar suas faturas em ordem decrescente
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {rankingClientes.length} clientes com movimentação
          </span>
        </div>

        {rankingClientes.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Nenhum recebível registrado no período selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold text-right">DSO do Cliente</th>
                  <th className="hidden px-4 py-3 font-semibold text-right sm:table-cell">A Receber</th>
                  <th className="hidden px-4 py-3 font-semibold text-right md:table-cell">Vendas Crédito</th>
                  <th className="hidden px-4 py-3 font-semibold text-right lg:table-cell">Títulos Abertos</th>
                  <th className="hidden px-4 py-3 font-semibold text-right lg:table-cell">Média p/ Pagar</th>
                  <th className="px-4 py-3 text-center">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankingClientes.map((c) => {
                  const dsoColor = getDSOColor(c.dso);
                  const dsoBadge = getDSOBadge(c.dso);

                  return (
                    <tr key={c.cliente_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <Link
                          to={`/clientes/${c.cliente_id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 hover:underline block truncate max-w-xs"
                        >
                          {c.cliente_nome}
                        </Link>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold ${dsoBadge}`}>
                          {c.vendasCredito > 0 ? `${c.dso.toFixed(1)} dias` : c.ar > 0 ? "Crítico" : "—"}
                        </span>
                      </td>

                      <td className="hidden px-4 py-3.5 text-right font-semibold text-slate-900 sm:table-cell">
                        {formatCurrency(c.ar)}
                      </td>

                      <td className="hidden px-4 py-3.5 text-right text-slate-600 md:table-cell">
                        {formatCurrency(c.vendasCredito)}
                      </td>

                      <td className="hidden px-4 py-3.5 text-right text-slate-600 lg:table-cell">
                        {c.abertos}
                      </td>

                      <td className="hidden px-4 py-3.5 text-right text-slate-500 lg:table-cell">
                        {c.pagosCount > 0 ? `${c.diasParaPagar.toFixed(0)} dias` : "—"}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <Link
                          to={`/clientes/${c.cliente_id}`}
                          className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                          title="Ver detalhes do cliente"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
