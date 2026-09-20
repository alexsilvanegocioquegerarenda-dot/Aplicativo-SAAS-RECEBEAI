import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getGreeting, formatCurrency, formatDate, daysBetween } from "@/lib/format";
import AgingTabela from "@/components/AgingTabela";
import { getDSOPeriodos, calcularDSOPeriodo } from "@/lib/dso";
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
  Calendar,
  Activity
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

  // Cálculo do DSO da Carteira (Days Sales Outstanding)
  const periodos = getDSOPeriodos();
  const dsoStats = calcularDSOPeriodo(recebiveis, periodos[0]); // últimos 30 dias
  const dsoDias = Math.round(dsoStats.dso || 0);

  const getStatusDSO = (dias) => {
    if (dias === 0) {
      return {
        label: "Sem dados",
        cor: "text-slate-600",
        bg: "bg-slate-50",
        border: "border-slate-200",
        badgeBg: "bg-slate-100 text-slate-700",
        barColor: "bg-slate-400",
        diag: "Cadastre ou importe faturas para calcular o prazo médio de recebimento da carteira.",
      };
    }
    if (dias <= 30) {
      return {
        label: "Excelente",
        cor: "text-emerald-700",
        bg: "bg-emerald-50/60",
        border: "border-emerald-200",
        badgeBg: "bg-emerald-100 text-emerald-800",
        barColor: "bg-emerald-500",
        diag: "Excelente! Seus clientes pagam em média dentro de 30 dias. Seu caixa opera com alta liquidez e previsibilidade.",
      };
    }
    if (dias <= 45) {
      return {
        label: "Saudável",
        cor: "text-blue-700",
        bg: "bg-blue-50/60",
        border: "border-blue-200",
        badgeBg: "bg-blue-100 text-blue-800",
        barColor: "bg-blue-500",
        diag: "Saudável. O prazo de recebimento está controlado. Ative lembretes preventivos D-3 para antecipar liquidações.",
      };
    }
    if (dias <= 60) {
      return {
        label: "Atenção",
        cor: "text-amber-700",
        bg: "bg-amber-50/60",
        border: "border-amber-200",
        badgeBg: "bg-amber-100 text-amber-800",
        barColor: "bg-amber-500",
        diag: "Atenção requerida. Seus clientes demoram mais de 45 dias para pagar. Recomendamos intensificar a régua no D+3 e D+10.",
      };
    }
    return {
      label: "Crítico",
      cor: "text-rose-700",
      bg: "bg-rose-50/60",
      border: "border-rose-200",
      badgeBg: "bg-rose-100 text-rose-800",
      barColor: "bg-rose-500",
      diag: "Alerta Crítico! O DSO elevado compromete o capital de giro. Priorize o contato com os maiores devedores listados abaixo.",
    };
  };

  const statusDSO = getStatusDSO(dsoDias);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      {/* Header com Saudações */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {getGreeting()}, Financeiro! 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Aqui está o panorama completo da carteira de recebíveis, DSO e cobranças hoje.
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

      {/* Grid de KPIs Financeiros com DSO */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              Índice sobre a carteira
            </div>
          </div>
        </div>

        {/* DSO da Carteira */}
        <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${statusDSO.bg} ${statusDSO.border}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">DSO da Carteira</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-slate-900">{dsoDias}</span>
              <span className="text-xs font-semibold text-slate-600">dias</span>
              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border shadow-xs ${statusDSO.cor} ${statusDSO.border}`}>
                {statusDSO.label}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-500">Prazo médio recebimento</span>
              <Link to="/dso" className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                Ver DSO &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Destaque: DSO da Carteira & Saúde Financeira */}
      <div className="mb-8 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/40 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading text-base font-bold text-slate-900">
                  DSO da Carteira (Days Sales Outstanding)
                </h2>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${statusDSO.badgeBg} border ${statusDSO.border}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDSO.barColor} animate-pulse`} />
                  {statusDSO.label} • {dsoDias} dias
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  Meta Recomendada: &le; 30 dias
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600 max-w-2xl leading-relaxed">
                {statusDSO.diag}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400 font-medium">Contas a Receber (AR)</div>
              <div className="text-sm font-bold text-slate-800">{formatCurrency(dsoStats.ar || totalAberto)}</div>
            </div>
            <Link
              to="/dso"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
            >
              <span>Relatório de DSO</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Barra Termômetro do DSO */}
        <div className="mt-5 pt-4 border-t border-indigo-100/70">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
            <span>Escala de Liquidez do RecebeAi:</span>
            <span className="text-indigo-900 font-bold">Posição Atual: {dsoDias} dias</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 flex">
            <div className="w-[33%] bg-emerald-400" title="Excelente (0 a 30 dias)" />
            <div className="w-[17%] bg-blue-400" title="Saudável (31 a 45 dias)" />
            <div className="w-[17%] bg-amber-400" title="Atenção (46 a 60 dias)" />
            <div className="w-[33%] bg-rose-500" title="Crítico (> 60 dias)" />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
            <span className="text-emerald-700 font-semibold">0 - 30d (Excelente)</span>
            <span className="text-blue-700 font-semibold">31 - 45d (Saudável)</span>
            <span className="text-amber-700 font-semibold">46 - 60d (Atenção)</span>
            <span className="text-rose-700 font-semibold">&gt; 60d (Crítico)</span>
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
            <div className="flex items-center gap-2">
              <Link
                to="/dso"
                title="Ver relatório analítico de DSO"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <Activity className="h-3.5 w-3.5" />
                <span>DSO: {dsoDias} dias</span>
              </Link>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                Tempo Real
              </span>
            </div>
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
