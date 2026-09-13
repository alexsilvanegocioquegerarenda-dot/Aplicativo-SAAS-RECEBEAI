import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate, daysBetween, getGreeting } from "@/lib/format";
import AgingTabela from "@/components/AgingTabela";
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Clock,
  ArrowUpRight,
  MessageSquare,
  Users,
  Receipt,
  Sparkles,
  Calendar
} from "lucide-react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [recebiveis, setRecebiveis] = useState([]);
  const [promessas, setPromessas] = useState([]);

  const loadData = async () => {
    try {
      const [c, r, p] = await Promise.all([
        base44.entities.Cliente.list(),
        base44.entities.Recebivel.list(),
        base44.entities.Promessa.list(),
      ]);
      setClientes(c);
      setRecebiveis(r);
      setPromessas(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  // Cálculos consolidados
  const recebiveisEnriched = recebiveis.map((r) => {
    const dias = daysBetween(r.vencimento);
    const saldo = (Number(r.valor) || 0) - (Number(r.valor_pago) || 0);
    return {
      ...r,
      dias,
      saldo: r.status === "pago" ? 0 : saldo,
    };
  });

  const totalAberto = recebiveisEnriched
    .filter((r) => r.status !== "pago")
    .reduce((acc, r) => acc + r.saldo, 0);

  const totalVencido = recebiveisEnriched
    .filter((r) => r.status !== "pago" && r.dias > 0)
    .reduce((acc, r) => acc + r.saldo, 0);

  const totalPago = recebiveis
    .filter((r) => r.status === "pago")
    .reduce((acc, r) => acc + (Number(r.valor_pago) || Number(r.valor) || 0), 0);

  const totalGeral = totalAberto + totalPago;
  const taxaInadimplencia = totalGeral > 0 ? (totalVencido / totalGeral) * 100 : 0;

  // Clientes com maiores atrasos
  const clientesInadimplentes = clientes
    .map((c) => {
      const recs = recebiveisEnriched.filter((r) => String(r.cliente_id) === String(c.id) && r.status !== "pago");
      const vencidos = recs.filter((r) => r.dias > 0);
      const totalAtrasado = vencidos.reduce((acc, r) => acc + r.saldo, 0);
      const maiorAtraso = vencidos.length > 0 ? Math.max(...vencidos.map((r) => r.dias)) : 0;
      return {
        ...c,
        totalAtrasado,
        maiorAtraso,
        qtdTitulos: recs.length,
      };
    })
    .filter((c) => c.totalAtrasado > 0)
    .sort((a, b) => b.totalAtrasado - a.totalAtrasado);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      {/* Header com Saudações */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {getGreeting()}, Financeiro! 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Aqui está o panorama completo da carteira de recebíveis e cobranças hoje.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/cobrancas"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Disparar Cobranças WhatsApp</span>
          </Link>
          <Link
            to="/recebiveis"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Receipt className="h-4 w-4" />
            <span>Ver Títulos</span>
          </Link>
        </div>
      </div>

      {/* Grid de KPIs Financeiros */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total a Receber */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Total a Receber</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(totalAberto)}</div>
            <div className="mt-1 text-xs text-slate-500">
              {recebiveisEnriched.filter((r) => r.status !== "pago").length} títulos em aberto
            </div>
          </div>
        </div>

        {/* Total Vencido */}
        <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-red-50/40 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-red-600">Total Vencido</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-red-600">{formatCurrency(totalVencido)}</div>
            <div className="mt-1 text-xs text-red-700 font-medium">
              {recebiveisEnriched.filter((r) => r.status !== "pago" && r.dias > 0).length} títulos em atraso
            </div>
          </div>
        </div>

        {/* Total Recuperado / Pago */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-700">Recuperado / Pago</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-700">{formatCurrency(totalPago)}</div>
            <div className="mt-1 text-xs text-emerald-800">
              {recebiveis.filter((r) => r.status === "pago").length} títulos liquidados
            </div>
          </div>
        </div>

        {/* Taxa de Inadimplência */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Inadimplência</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">{taxaInadimplencia.toFixed(1)}%</div>
            <div className="mt-1 text-xs text-slate-500">
              Índice sobre o volume total da carteira
            </div>
          </div>
        </div>
      </div>

      {/* Grid Central: Aging da Carteira e Clientes Críticos */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Aging Consolidado */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900">Aging Geral da Carteira</h2>
              <p className="text-xs text-slate-500">Distribuição dos valores por faixa de atraso temporal</p>
            </div>
            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              Tempo Real
            </span>
          </div>

          <AgingTabela recebiveisEnriched={recebiveisEnriched} />
        </div>

        {/* Ações e Promessas Pendentes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-slate-900">Promessas da Semana</h2>
            <Link to="/promessas" className="text-xs font-semibold text-blue-600 hover:underline">
              Ver todas
            </Link>
          </div>

          {promessas.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma promessa pendente registrada.</p>
          ) : (
            <div className="space-y-3">
              {promessas.map((p) => {
                const cli = clientes.find((c) => String(c.id) === String(p.cliente_id));
                return (
                  <div key={p.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 truncate">{cli?.nome || "Cliente"}</span>
                      <span className="text-xs font-bold text-blue-600">{formatCurrency(p.valor_acordado)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      <span>Data: {formatDate(p.data_promessa)}</span>
                    </div>
                    {p.observacao && (
                      <p className="mt-2 text-xs text-slate-600 line-clamp-2 italic">"{p.observacao}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Clientes Críticos para Cobrança */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">Clientes com Maior Inadimplência</h2>
            <p className="text-xs text-slate-500">Priorize o contato com esses devedores para maximizar a recuperação</p>
          </div>
          <Link
            to="/clientes"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Ver todos os clientes <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {clientesInadimplentes.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            Nenhum cliente inadimplente no momento! Parabéns.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Títulos Atrasados</th>
                  <th className="pb-3">Maior Atraso</th>
                  <th className="pb-3">Valor Total Vencido</th>
                  <th className="pb-3 text-right">Ação Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientesInadimplentes.slice(0, 5).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5">
                      <Link to={`/clientes/${c.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                        {c.nome}
                      </Link>
                      <div className="text-xs text-slate-400">{c.cnpj || c.telefone}</div>
                    </td>
                    <td className="py-3.5 text-slate-600">{c.qtdTitulos}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        <Clock className="h-3 w-3" />
                        {c.maiorAtraso} dias
                      </span>
                    </td>
                    <td className="py-3.5 font-semibold text-red-600">{formatCurrency(c.totalAtrasado)}</td>
                    <td className="py-3.5 text-right">
                      <Link
                        to={`/clientes/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                      >
                        Abrir Ficha
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
