import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate, daysBetween, calcRecebivelStatus } from "@/lib/format";
import {
  calcAgingCarteira,
  calcAgingFaixa,
  agingFaixaConfig,
  AGING_FAIXAS_KEYS
} from "@/lib/aging";
import {
  Clock,
  AlertTriangle,
  Users,
  ChevronRight,
  TrendingDown,
  Sparkles,
  Receipt,
  X,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";

export default function Aging() {
  const [loading, setLoading] = useState(true);
  const [recebiveis, setRecebiveis] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [faixaSelecionada, setFaixaSelecionada] = useState(null);

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

  const clientesMap = useMemo(() => {
    const map = {};
    clientes.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [clientes]);

  // Enriquecimento dos recebíveis com cálculo de dias e saldo
  const recebiveisEnriched = useMemo(() => {
    return recebiveis.map((r) => {
      const statusCalc = calcRecebivelStatus(r);
      const dias = daysBetween(r.vencimento);
      const saldo = r.status === "pago" ? 0 : Math.max(0, (Number(r.valor) || 0) - (Number(r.valor_pago) || 0));
      const agingFaixa = calcAgingFaixa(dias, statusCalc);
      return {
        ...r,
        statusCalc,
        dias,
        saldo,
        agingFaixa,
      };
    });
  }, [recebiveis]);

  // Estatísticas das 7 faixas de aging
  const agingData = useMemo(() => {
    return calcAgingCarteira(recebiveisEnriched);
  }, [recebiveisEnriched]);

  // Cálculos consolidados para os cards superiores
  const metricas = useMemo(() => {
    const totalAberto = agingData.reduce((acc, f) => acc + f.valor, 0);
    const vencido = agingData
      .filter((f) => f.faixa !== "a_vencer")
      .reduce((acc, f) => acc + f.valor, 0);

    const percentualVencido = totalAberto > 0 ? (vencido / totalAberto) * 100 : 0;

    // Clientes inadimplentes distintos
    const clientesInadimplentesSet = new Set(
      recebiveisEnriched
        .filter((r) => r.statusCalc !== "pago" && r.dias > 0 && r.cliente_id)
        .map((r) => r.cliente_id)
    );

    // Valores acima de 90 dias
    const acima90 = agingData
      .filter((f) => ["91_180", "181_360", "acima_360"].includes(f.faixa))
      .reduce((acc, f) => acc + f.valor, 0);

    const percentualAcima90 = totalAberto > 0 ? (acima90 / totalAberto) * 100 : 0;

    // Valores acima de 180 dias
    const acima180 = agingData
      .filter((f) => ["181_360", "acima_360"].includes(f.faixa))
      .reduce((acc, f) => acc + f.valor, 0);

    const percentualAcima180 = totalAberto > 0 ? (acima180 / totalAberto) * 100 : 0;

    // Faixa com maior concentração
    const maiorFaixa = [...agingData].sort((a, b) => b.valor - a.valor)[0];

    return {
      totalAberto,
      vencido,
      percentualVencido,
      totalClientesInadimplentes: clientesInadimplentesSet.size,
      acima90,
      percentualAcima90,
      acima180,
      percentualAcima180,
      maiorFaixa,
    };
  }, [agingData, recebiveisEnriched]);

  // Títulos pertencentes à faixa selecionada
  const titulosDaFaixa = useMemo(() => {
    if (!faixaSelecionada) return [];
    return recebiveisEnriched
      .filter((r) => r.statusCalc !== "pago" && r.agingFaixa === faixaSelecionada)
      .sort((a, b) => b.saldo - a.saldo);
  }, [recebiveisEnriched, faixaSelecionada]);

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
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Aging da Carteira
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              Curva de Inadimplência
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Distribuição dos recebíveis em aberto classificados por faixas cronológicas de atraso
          </p>
        </div>

        <Link
          to="/recebiveis"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Receipt className="h-4 w-4" />
          <span>Ver Títulos</span>
        </Link>
      </div>

      {/* Cards de Métricas Consolidadas */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Carteira em Aberto</span>
          <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
            {formatCurrency(metricas.totalAberto)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Saldo global não liquidado</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vencido</span>
          <div className="mt-2 font-heading text-2xl font-bold text-red-600">
            {formatCurrency(metricas.vencido)}
          </div>
          <div className="mt-1 text-xs text-red-600 font-medium">
            {metricas.percentualVencido.toFixed(1)}% da carteira total
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Clientes Inadimplentes</span>
          <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
            {metricas.totalClientesInadimplentes}
          </div>
          <div className="mt-1 text-xs text-slate-500">Com pelo menos 1 título vencido</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Acima de 90 Dias</span>
          <div className="mt-2 font-heading text-2xl font-bold text-rose-600">
            {formatCurrency(metricas.acima90)}
          </div>
          <div className="mt-1 text-xs text-rose-600 font-medium">
            {metricas.percentualAcima90.toFixed(1)}% em risco crítico
          </div>
        </div>
      </div>

      {/* Barra Visual Colorida Multi-Segmento */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-slate-900 mb-2">Composição Visual do Aging</h2>
        <p className="text-xs text-slate-500 mb-4">Passe o cursor sobre os segmentos para visualizar os montantes por período</p>

        <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
          {agingData.map((item) => {
            if (item.valor <= 0) return null;
            return (
              <div
                key={item.faixa}
                className={`${item.barColor} transition-all hover:opacity-85 cursor-pointer`}
                style={{ width: `${item.percentual}%` }}
                title={`${item.label}: ${formatCurrency(item.valor)} (${item.percentual.toFixed(1)}%)`}
                onClick={() => setFaixaSelecionada(faixaSelecionada === item.faixa ? null : item.faixa)}
              />
            );
          })}
        </div>

        {/* Legenda das 7 Faixas */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {agingData.map((item) => (
            <div
              key={item.faixa}
              onClick={() => setFaixaSelecionada(faixaSelecionada === item.faixa ? null : item.faixa)}
              className={`cursor-pointer rounded-xl p-2.5 transition-all border ${
                faixaSelecionada === item.faixa
                  ? "border-blue-500 bg-blue-50/50 shadow-sm"
                  : "border-transparent hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${item.barColor}`} />
                <span className="text-xs font-semibold text-slate-700 truncate">{item.short}</span>
              </div>
              <div className="mt-1 text-xs font-bold text-slate-900">{formatCurrency(item.valor)}</div>
              <div className="text-[10px] text-slate-500">
                {item.percentual.toFixed(1)}% • {item.quantidade} tit.
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista Interativa de Faixas */}
      <div className="mb-8 space-y-3">
        <h2 className="font-heading text-base font-bold text-slate-900">
          Detalhamento por Faixa de Atraso
        </h2>
        <p className="text-xs text-slate-500 mb-4">Clique em uma faixa para expandir a lista de títulos correspondentes</p>

        {agingData.map((item) => {
          const isAtivo = faixaSelecionada === item.faixa;
          const cfg = agingFaixaConfig[item.faixa];

          return (
            <div
              key={item.faixa}
              onClick={() => setFaixaSelecionada(isAtivo ? null : item.faixa)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all shadow-sm ${
                isAtivo
                  ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${item.barColor}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-sm font-bold text-slate-900">{item.label}</span>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${item.badge}`}>
                        {item.percentual.toFixed(1)}% do total
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {item.quantidade} {item.quantidade === 1 ? "título" : "títulos"} • {item.quantidadeClientes}{" "}
                      {item.quantidadeClientes === 1 ? "cliente" : "clientes"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-heading text-base font-bold text-slate-900">
                    {formatCurrency(item.valor)}
                  </span>
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-transform ${
                      isAtivo ? "rotate-90 bg-blue-100 text-blue-700" : ""
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Barra de Progresso interna */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full ${item.barColor}`}
                  style={{ width: `${Math.min(item.percentual, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Card de Análise da Carteira */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span>Diagnóstico e Insights da Carteira</span>
        </div>
        <ul className="mt-3 space-y-2 text-xs text-slate-600">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <span>
              <strong>Maior concentração:</strong>{" "}
              {metricas.maiorFaixa && metricas.maiorFaixa.valor > 0
                ? `${metricas.maiorFaixa.label} com ${formatCurrency(metricas.maiorFaixa.valor)} (${metricas.maiorFaixa.percentual.toFixed(1)}% da carteira).`
                : "Sem pendências registradas."}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
            <span>
              <strong>Inadimplência grave (&gt; 90 dias):</strong> Total de{" "}
              <strong className="text-rose-600">{formatCurrency(metricas.acima90)}</strong> (
              {metricas.percentualAcima90.toFixed(1)}%). Requer ação incisiva ou medidas cartorárias.
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
            <span>
              <strong>Inadimplência crônica (&gt; 180 dias):</strong> Total de{" "}
              <strong className="text-purple-600">{formatCurrency(metricas.acima180)}</strong> (
              {metricas.percentualAcima180.toFixed(1)}%). Alto risco de perda definitiva de crédito.
            </span>
          </li>
        </ul>
      </div>

      {/* Tabela de Títulos da Faixa Selecionada */}
      {faixaSelecionada && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900">
                Títulos em: {agingFaixaConfig[faixaSelecionada]?.label}
              </h3>
              <p className="text-xs text-slate-500">{titulosDaFaixa.length} títulos listados nesta faixa</p>
            </div>
            <button
              onClick={() => setFaixaSelecionada(null)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" />
              <span>Fechar</span>
            </button>
          </div>

          {titulosDaFaixa.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Nenhum título nesta faixa.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 uppercase text-slate-400">
                  <tr>
                    <th className="px-3.5 py-2.5 font-semibold">Cliente</th>
                    <th className="px-3.5 py-2.5 font-semibold">Nota Fiscal</th>
                    <th className="px-3.5 py-2.5 font-semibold text-right">Valor / Saldo</th>
                    <th className="px-3.5 py-2.5 font-semibold">Vencimento</th>
                    <th className="px-3.5 py-2.5 font-semibold text-right">Atraso</th>
                    <th className="px-3.5 py-2.5 font-semibold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {titulosDaFaixa.map((tit) => {
                    const cli = clientesMap[tit.cliente_id];
                    return (
                      <tr key={tit.id} className="hover:bg-slate-50/80">
                        <td className="px-3.5 py-3">
                          <Link
                            to={`/clientes/${tit.cliente_id}`}
                            className="font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                          >
                            {tit.cliente_nome || cli?.nome || "Cliente"}
                          </Link>
                          <div className="text-[11px] text-slate-400">{cli?.cnpj || "Sem CNPJ"}</div>
                        </td>
                        <td className="px-3.5 py-3 text-slate-600">{tit.nota_fiscal || "—"}</td>
                        <td className="px-3.5 py-3 text-right font-bold text-slate-900">
                          {formatCurrency(tit.saldo)}
                        </td>
                        <td className="px-3.5 py-3 text-slate-500">{formatDate(tit.vencimento)}</td>
                        <td className="px-3.5 py-3 text-right font-bold text-red-600">
                          {tit.dias > 0 ? `${tit.dias}d` : "Em dia"}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <Link
                            to={`/cobrancas?cliente=${tit.cliente_id}&recebivel=${tit.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <span>Cobrar</span>
                            <ArrowUpRight className="h-3 w-3" />
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
      )}
    </div>
  );
}
