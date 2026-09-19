import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate, daysBetween } from "@/lib/format";
import {
  TrendingUp,
  Target,
  Calendar,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Receipt,
  Plus
} from "lucide-react";

export default function Recuperacao() {
  const [loading, setLoading] = useState(true);
  const [recebiveis, setRecebiveis] = useState([]);
  const [metas, setMetas] = useState([]);
  const [salvandoMeta, setSalvandoMeta] = useState(false);
  const [inputMeta, setInputMeta] = useState("");

  // Estado do mês selecionado
  const [mesOffset, setMesOffset] = useState(0);

  const periodo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + mesOffset, 1);
    const ano = d.getFullYear();
    const mes = d.getMonth() + 1;
    const ultimoDia = new Date(ano, mes, 0).getDate();

    const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
    const fim = `${ano}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
    const nomeMes = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    return { inicio, fim, nomeMes, ano, mes };
  }, [mesOffset]);

  const carregarDados = async () => {
    try {
      const [recList, metaList] = await Promise.all([
        base44.entities.Recebivel.list(),
        base44.entities.MetaRecuperacao.list(),
      ]);
      setRecebiveis(recList);
      setMetas(metaList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Meta ativa para o período selecionado
  const metaAtual = useMemo(() => {
    return metas.find((m) => m.periodo_inicio === periodo.inicio) || null;
  }, [metas, periodo]);

  // Cálculos de recuperação no período
  const metricas = useMemo(() => {
    // Títulos vencidos no período
    const carteiraVencida = recebiveis
      .filter((r) => {
        if (r.status === "pago") return false;
        if (!r.vencimento) return false;
        return daysBetween(r.vencimento) > 0;
      })
      .reduce((acc, r) => acc + ((Number(r.valor) || 0) - (Number(r.valor_pago) || 0)), 0);

    // Títulos recuperados (pagos) no período selecionado
    const recuperadosPeriodo = recebiveis.filter((r) => {
      if (r.status !== "pago" || !r.data_pagamento) return false;
      const dataPag = r.data_pagamento.slice(0, 10);
      return dataPag >= periodo.inicio && dataPag <= periodo.fim;
    });

    const totalRecuperado = recuperadosPeriodo.reduce(
      (acc, r) => acc + (Number(r.valor_pago) || Number(r.valor) || 0),
      0
    );

    const valorMeta = Number(metaAtual?.valor_meta) || 0;
    const faltante = Math.max(0, valorMeta - totalRecuperado);
    const taxa = carteiraVencida + totalRecuperado > 0 ? (totalRecuperado / (carteiraVencida + totalRecuperado)) * 100 : 0;
    const progressoMeta = valorMeta > 0 ? Math.min(100, (totalRecuperado / valorMeta) * 100) : 0;

    return {
      carteiraVencida,
      totalRecuperado,
      valorMeta,
      faltante,
      taxa,
      progressoMeta,
      recuperadosPeriodo,
    };
  }, [recebiveis, periodo, metaAtual]);

  const handleSalvarMeta = async (e) => {
    e.preventDefault();
    const valor = parseFloat(inputMeta.replace(/\./g, "").replace(",", "."));
    if (!valor || valor <= 0) return;

    setSalvandoMeta(true);
    try {
      if (metaAtual) {
        const atualizada = await base44.entities.MetaRecuperacao.update(metaAtual.id, {
          valor_meta: valor,
        });
        setMetas((prev) => prev.map((m) => (m.id === metaAtual.id ? atualizada : m)));
      } else {
        const criada = await base44.entities.MetaRecuperacao.create({
          periodo_inicio: periodo.inicio,
          periodo_fim: periodo.fim,
          valor_meta: valor,
          descricao: `Meta de Recuperação ${periodo.nomeMes}`,
        });
        setMetas((prev) => [criada, ...prev]);
      }
      setInputMeta("");
    } finally {
      setSalvandoMeta(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  // Dados do gráfico comparativo
  const maiorValor = Math.max(metricas.totalRecuperado, metricas.valorMeta, metricas.carteiraVencida, 1);
  const dadosGrafico = [
    { label: "Recuperado", valor: metricas.totalRecuperado, color: "bg-emerald-500", text: "text-emerald-700" },
    { label: "Meta do Mês", valor: metricas.valorMeta, color: "bg-indigo-600", text: "text-indigo-700" },
    { label: "Carteira Vencida", valor: metricas.carteiraVencida, color: "bg-red-500", text: "text-red-700" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">
      {/* Header com Navegador de Mês */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Relatório de Recuperação & Metas
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              Desempenho Financeiro
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe o dinheiro resgatado para o caixa em comparação com a meta definida para o mês
          </p>
        </div>

        {/* Botões de Navegação Mes a Mês */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setMesOffset((prev) => prev - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            title="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 text-xs font-bold text-slate-800 capitalize min-w-[130px] text-center">
            {periodo.nomeMes}
          </span>
          <button
            onClick={() => setMesOffset((prev) => prev + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            title="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cards de Métricas do Período */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Carteira Vencida</span>
          <div className="mt-1.5 font-heading text-xl font-bold text-red-600">
            {formatCurrency(metricas.carteiraVencida)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Pendente de cobrança</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Recuperado</span>
          <div className="mt-1.5 font-heading text-xl font-bold text-emerald-600">
            {formatCurrency(metricas.totalRecuperado)}
          </div>
          <div className="mt-0.5 text-[11px] text-emerald-700 font-semibold">
            {metricas.recuperadosPeriodo.length} títulos pagos
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Taxa do Período</span>
          <div className="mt-1.5 font-heading text-xl font-bold text-slate-900">
            {metricas.taxa.toFixed(1)}%
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Eficácia de resgate</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Meta Estabelecida</span>
          <div className="mt-1.5 font-heading text-xl font-bold text-indigo-700">
            {metricas.valorMeta > 0 ? formatCurrency(metricas.valorMeta) : "Não definida"}
          </div>
          <div className="mt-0.5 text-[11px] text-indigo-600 font-semibold">
            {metricas.progressoMeta.toFixed(0)}% atingido
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Faltam p/ a Meta</span>
          <div className="mt-1.5 font-heading text-xl font-bold text-amber-600">
            {formatCurrency(metricas.faltante)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Saldo restante</div>
        </div>
      </div>

      {/* Gráfico Comparativo e Barra de Progresso */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-sm font-bold text-slate-900">
            Comparativo de Desempenho ({periodo.nomeMes})
          </h2>
          <span className="text-xs text-slate-500">
            Progresso da Meta: <strong>{metricas.progressoMeta.toFixed(1)}%</strong>
          </span>
        </div>

        {/* Barra de Progresso Principal */}
        <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            style={{ width: `${metricas.progressoMeta}%` }}
          />
        </div>

        {/* Barras Verticais Comparativas */}
        <div className="grid grid-cols-3 gap-6 pt-2">
          {dadosGrafico.map((d, index) => {
            const alturaPercentual = maiorValor > 0 ? Math.max(12, (d.valor / maiorValor) * 100) : 12;

            return (
              <div key={index} className="flex flex-col items-center">
                <span className="font-heading text-xs font-bold text-slate-900 mb-2">
                  {formatCurrency(d.valor)}
                </span>
                <div className="flex h-36 w-full max-w-[90px] items-end justify-center rounded-xl bg-slate-50 p-2">
                  <div
                    className={`w-full rounded-lg ${d.color} transition-all duration-500 shadow-sm`}
                    style={{ height: `${alturaPercentual}%` }}
                  />
                </div>
                <span className={`mt-2 text-xs font-semibold ${d.text}`}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bloco de Definição da Meta Mensal */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5 text-indigo-600" />
          <h2 className="font-heading text-base font-bold text-slate-900">
            Definir Meta de Recuperação para {periodo.nomeMes}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Defina quanto a equipe financeira pretende resgatar da carteira de inadimplentes neste mês para acompanhar seu atingimento.
        </p>

        <form onSubmit={handleSalvarMeta} className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
            <input
              type="text"
              placeholder={metaAtual ? formatCurrency(metaAtual.valor_meta) : "Ex.: 25.000,00"}
              value={inputMeta}
              onChange={(e) => setInputMeta(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-48 shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={salvandoMeta || !inputMeta}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{salvandoMeta ? "Salvando..." : metaAtual ? "Atualizar Meta" : "Salvar Nova Meta"}</span>
          </button>
        </form>
      </div>

      {/* Lista de Recebíveis Recuperados no Período */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Recebíveis Recuperados no Período
            </h2>
            <p className="text-xs text-slate-500">
              Títulos que foram quitados e geraram entrada de caixa no mês de {periodo.nomeMes}
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
            {metricas.recuperadosPeriodo.length} título(s) liquidado(s)
          </span>
        </div>

        {metricas.recuperadosPeriodo.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-xs text-slate-500">
            Nenhum pagamento registrado com data no período de {periodo.nomeMes}.
          </div>
        ) : (
          <div className="space-y-2.5">
            {metricas.recuperadosPeriodo.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-all"
              >
                <div>
                  <span className="font-bold text-slate-900 block text-sm">
                    {rec.cliente_nome || "Cliente"}
                  </span>
                  <div className="mt-0.5 text-xs text-slate-500">
                    Pago em {formatDate(rec.data_pagamento)} • {rec.nota_fiscal ? `NF ${rec.nota_fiscal}` : "Título avulso"}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-heading text-sm font-bold text-emerald-600 block">
                    + {formatCurrency(rec.valor_pago || rec.valor)}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Liquidado
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
