import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  X,
  FileText,
  Clock,
  ArrowUpRight,
  Database
} from "lucide-react";

const ORIGEM_CONFIG = {
  csv: { label: "Arquivo CSV", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  manual: { label: "Manual", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  api: { label: "Integração API", badge: "bg-purple-50 text-purple-700 border-purple-200" },
};

export default function Importacoes() {
  const [loading, setLoading] = useState(true);
  const [importacoes, setImportacoes] = useState([]);
  const [loteSelecionado, setLoteSelecionado] = useState(null);
  const [titulosDoLote, setTitulosDoLote] = useState([]);
  const [carregandoTitulos, setCarregandoTitulos] = useState(false);

  const carregarImportacoes = async () => {
    try {
      const lista = await base44.entities.Importacao.list("-created_date", 100);
      setImportacoes(lista);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarImportacoes();
  }, []);

  const handleAbrirDetalhes = async (lote) => {
    setLoteSelecionado(lote);
    setCarregandoTitulos(true);
    try {
      const recs = await base44.entities.Recebivel.filter({ importacao_id: lote.id });
      setTitulosDoLote(recs);
    } finally {
      setCarregandoTitulos(false);
    }
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
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Importações e Lotes
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              Rastreabilidade
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Histórico e auditoria de todos os lotes de recebíveis que entraram na sua carteira
          </p>
        </div>

        <Link
          to="/recebiveis"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Importar Nova Planilha</span>
        </Link>
      </div>

      {/* Lista de Lotes */}
      {importacoes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-900">Nenhum lote importado ainda</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Ao importar planilhas Excel ou arquivos CSV na página de Recebíveis, os lotes aparecerão registrados aqui para rastreabilidade.
          </p>
          <Link
            to="/recebiveis"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Ir para Recebíveis</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {importacoes.map((lote) => {
            const cfgOrigem = ORIGEM_CONFIG[lote.origem] || ORIGEM_CONFIG.csv;
            const isSucesso = lote.status === "concluida";
            const isFalha = lote.status === "falhou";

            return (
              <div
                key={lote.id}
                onClick={() => handleAbrirDetalhes(lote)}
                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-sm font-bold text-slate-900 truncate">
                        {lote.nome_arquivo || "Lote de Recebíveis"}
                      </span>
                      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${cfgOrigem.badge}`}>
                        {cfgOrigem.label}
                      </span>
                      {isSucesso && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Concluído
                        </span>
                      )}
                      {isFalha && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                          <XCircle className="h-3 w-3" /> Falhou
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Importado em {formatDate(lote.created_date || lote.criado_em)}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-700">{lote.quantidade_registros || 0} títulos</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(lote.valor_total)}</span>
                    </div>

                    {lote.detalhes && (
                      <p className="mt-1 text-xs text-red-600 truncate">{lote.detalhes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="hidden sm:inline font-mono text-xs text-slate-400">
                    #{String(lote.id).slice(0, 8)}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes do Lote */}
      {loteSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-900">
                  {loteSelecionado.nome_arquivo || "Detalhes do Lote"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lote #{String(loteSelecionado.id).slice(0, 12)} • Importado em {formatDate(loteSelecionado.created_date || loteSelecionado.criado_em)}
                </p>
              </div>
              <button
                onClick={() => setLoteSelecionado(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Stats Cards */}
            <div className="grid grid-cols-3 gap-4 border-b border-slate-100 bg-slate-50/50 p-6">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <span className="text-xs text-slate-500 block">Quantidade de Títulos</span>
                <span className="mt-1 font-heading text-lg font-bold text-slate-900">
                  {loteSelecionado.quantidade_registros || 0}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <span className="text-xs text-slate-500 block">Volume Financeiro Total</span>
                <span className="mt-1 font-heading text-lg font-bold text-slate-900">
                  {formatCurrency(loteSelecionado.valor_total)}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <span className="text-xs text-slate-500 block">Status do Processamento</span>
                <span className="mt-1 inline-flex items-center gap-1.5 font-heading text-sm font-bold text-emerald-600 capitalize">
                  <CheckCircle2 className="h-4 w-4" />
                  {loteSelecionado.status || "Concluído"}
                </span>
              </div>
            </div>

            {/* Modal Body - Lista de Títulos */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Títulos Vinculados a este Lote
              </h3>

              {carregandoTitulos ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                </div>
              ) : titulosDoLote.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                  Nenhum título detalhado individualmente vinculado a este ID de lote (importação consolidada).
                </div>
              ) : (
                <div className="space-y-2">
                  {titulosDoLote.map((tit) => (
                    <div
                      key={tit.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 block">{tit.cliente_nome || "Cliente"}</span>
                        <span className="text-slate-500">
                          {tit.nota_fiscal ? `NF ${tit.nota_fiscal} • ` : ""}Vencimento: {formatDate(tit.vencimento)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">{formatCurrency(tit.valor)}</span>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 capitalize">
                          {tit.status || "a_vencer"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 p-4 flex justify-end">
              <button
                onClick={() => setLoteSelecionado(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
