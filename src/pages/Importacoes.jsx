import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate, daysBetween } from "@/lib/format";
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
  Database,
  Download,
  Check,
  AlertTriangle,
  RotateCw
} from "lucide-react";

const ORIGEM_CONFIG = {
  csv: { label: "Arquivo CSV", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  manual: { label: "Manual", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  api: { label: "Integração API", badge: "bg-purple-50 text-purple-700 border-purple-200" },
};

export default function Importacoes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [importacoes, setImportacoes] = useState([]);
  const [loteSelecionado, setLoteSelecionado] = useState(null);
  const [titulosDoLote, setTitulosDoLote] = useState([]);
  const [carregandoTitulos, setCarregandoTitulos] = useState(false);

  // Estados do Modal de Importação CSV
  const [modalUploadOpen, setModalUploadOpen] = useState(false);
  const [arquivoCSV, setArquivoCSV] = useState(null);
  const [linhasPrevia, setLinhasPrevia] = useState([]);
  const [totalValido, setTotalValido] = useState(0);
  const [valorTotalPrevisto, setValorTotalPrevisto] = useState(0);
  const [errosLeitura, setErrosLeitura] = useState([]);
  const [processandoImportacao, setProcessandoImportacao] = useState(false);
  const [sucessoImportacao, setSucessoImportacao] = useState(false);
  const fileInputRef = useRef(null);

  const carregarImportacoes = async () => {
    try {
      const lista = await base44.entities.Importacao.list("-created_date", 100);
      setImportacoes(lista || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarImportacoes();
    if (searchParams.get("abrir") === "1") {
      setModalUploadOpen(true);
    }
  }, [searchParams]);

  const handleAbrirDetalhes = async (lote) => {
    setLoteSelecionado(lote);
    setCarregandoTitulos(true);
    try {
      const todosRecs = await base44.entities.Recebivel.list();
      const recs = todosRecs.filter((r) => String(r.importacao_id) === String(lote.id));
      setTitulosDoLote(recs);
    } finally {
      setCarregandoTitulos(false);
    }
  };

  // Gerar e baixar arquivo CSV modelo
  const handleBaixarModelo = () => {
    const csvContent =
      "nome_cliente;cnpj;telefone;email;nota_fiscal;descricao;valor;vencimento\n" +
      "Empresa Exemplo Alpha Ltda;12.345.678/0001-90;(11) 98765-4321;financeiro@alpha.com.br;NF-1001;Serviço de Consultoria;4500.00;2026-10-15\n" +
      "Comércio Beta Varejo S.A.;98.765.432/0001-10;(21) 99123-4567;contas@betavarejo.com;NF-1002;Fornecimento de Insumos;8900.50;2026-09-30\n" +
      "Indústria Delta Brasil;45.678.901/0001-22;(31) 97777-8888;cobranca@deltabrasil.ind.br;NF-1003;Licença de Software Mensal;1200.00;2026-09-10\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modelo_importacao_recebeai.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Processamento e Parser do arquivo CSV
  const handleArquivoSelecionado = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArquivoCSV(file);
    setErrosLeitura([]);
    setSucessoImportacao(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

        if (lines.length < 2) {
          setErrosLeitura(["O arquivo precisa conter uma linha de cabeçalho e pelo menos um título."]);
          return;
        }

        // Detecta separador (, ou ;)
        const headerLine = lines[0];
        const separator = headerLine.includes(";") ? ";" : ",";
        const headers = headerLine.split(separator).map((h) => h.trim().toLowerCase().replace(/["']/g, ""));

        // Mapeamento de índices de colunas
        const findIndex = (aliases) => headers.findIndex((h) => aliases.some((a) => h.includes(a)));

        const idxNome = findIndex(["cliente", "nome", "razao"]);
        const idxCnpj = findIndex(["cnpj", "cpf", "documento"]);
        const idxTel = findIndex(["telefone", "whatsapp", "celular", "fone"]);
        const idxEmail = findIndex(["email", "e-mail"]);
        const idxNf = findIndex(["nota", "nf", "titulo", "numero", "doc"]);
        const idxDesc = findIndex(["descricao", "desc", "servico", "historico"]);
        const idxValor = findIndex(["valor", "total", "saldo"]);
        const idxVenc = findIndex(["vencimento", "venc", "data"]);

        if (idxNome === -1 || idxValor === -1 || idxVenc === -1) {
          setErrosLeitura([
            "Colunas essenciais ausentes no cabeçalho. Certifique-se de ter pelo menos 'nome_cliente', 'valor' e 'vencimento'. Utilize nosso modelo padrão se tiver dúvidas.",
          ]);
          return;
        }

        const parsedRows = [];
        let somaValores = 0;
        let erros = [];

        for (let i = 1; i < lines.length; i++) {
          const rawCols = lines[i].split(separator).map((c) => c.trim().replace(/^["']|["']$/g, ""));
          if (rawCols.length < 2) continue;

          const nomeCliente = rawCols[idxNome] || "";
          const cnpj = idxCnpj !== -1 ? rawCols[idxCnpj] || "" : "";
          const telefone = idxTel !== -1 ? rawCols[idxTel] || "" : "";
          const email = idxEmail !== -1 ? rawCols[idxEmail] || "" : "";
          const nf = idxNf !== -1 ? rawCols[idxNf] || `NF-${Math.floor(1000 + Math.random() * 9000)}` : `NF-${i}`;
          const desc = idxDesc !== -1 ? rawCols[idxDesc] || "Fatura Importada via CSV" : "Fatura Importada via CSV";

          let rawValor = rawCols[idxValor] || "0";
          rawValor = rawValor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
          const valor = parseFloat(rawValor);

          const vencimento = rawCols[idxVenc] || "";

          if (!nomeCliente) {
            erros.push(`Linha ${i + 1}: Nome do cliente vazio.`);
            continue;
          }
          if (isNaN(valor) || valor <= 0) {
            erros.push(`Linha ${i + 1}: Valor inválido para ${nomeCliente}.`);
            continue;
          }

          somaValores += valor;
          parsedRows.push({
            nomeCliente,
            cnpj,
            telefone,
            email,
            nota_fiscal: nf,
            descricao: desc,
            valor,
            vencimento: vencimento.slice(0, 10),
          });
        }

        setLinhasPrevia(parsedRows);
        setTotalValido(parsedRows.length);
        setValorTotalPrevisto(somaValores);
        setErrosLeitura(erros);
      } catch (err) {
        console.error("Erro no parse CSV:", err);
        setErrosLeitura(["Erro ao processar o formato do arquivo CSV. Verifique a codificação UTF-8."]);
      }
    };

    reader.readAsText(file, "UTF-8");
  };

  // Gravar Lote e Títulos na Carteira
  const handleConfirmarImportacao = async () => {
    if (linhasPrevia.length === 0) return;
    setProcessandoImportacao(true);

    try {
      const loteId = `imp-${Date.now().toString(36)}`;
      const nomeArq = arquivoCSV?.name || "importacao_planilha.csv";

      // 1. Cria o Lote na entidade Importacao
      const novoLote = await base44.entities.Importacao.create({
        id: loteId,
        nome_arquivo: nomeArq,
        origem: "csv",
        quantidade_registros: linhasPrevia.length,
        valor_total: valorTotalPrevisto,
        status: "concluida",
        detalhes: `${linhasPrevia.length} títulos importados com sucesso via CSV`,
      });

      // 2. Busca clientes existentes para reaproveitamento por nome ou CNPJ
      const clientesAtuais = await base44.entities.Cliente.list();
      const clientesMap = new Map();
      clientesAtuais.forEach((c) => {
        if (c.cnpj) clientesMap.set(c.cnpj.replace(/\D/g, ""), c.id);
        clientesMap.set(c.nome.toLowerCase().trim(), c.id);
      });

      // 3. Itera linhas criando/reaproveitando clientes e criando os recebíveis
      for (const row of linhasPrevia) {
        const cnpjClean = row.cnpj.replace(/\D/g, "");
        const nomeClean = row.nomeCliente.toLowerCase().trim();

        let clienteId = clientesMap.get(cnpjClean) || clientesMap.get(nomeClean);

        if (!clienteId) {
          const novoCli = await base44.entities.Cliente.create({
            nome: row.nomeCliente,
            cnpj: row.cnpj,
            telefone: row.telefone,
            email: row.email,
            status: "em_dia",
            risco: "baixo",
            limite_credito: 25000,
          });
          clienteId = novoCli.id;
          if (cnpjClean) clientesMap.set(cnpjClean, clienteId);
          clientesMap.set(nomeClean, clienteId);
        }

        const dias = daysBetween(row.vencimento);
        let status = "em_dia";
        if (dias > 0) status = "atrasado";
        else if (dias > -7) status = "a_vencer";

        await base44.entities.Recebivel.create({
          cliente_id: clienteId,
          cliente_nome: row.nomeCliente,
          importacao_id: loteId,
          nota_fiscal: row.nota_fiscal,
          descricao: row.descricao,
          valor: row.valor,
          valor_pago: 0,
          vencimento: row.vencimento,
          status,
          forma_pagamento: "pix",
        });
      }

      setSucessoImportacao(true);
      await carregarImportacoes();

      setTimeout(() => {
        setModalUploadOpen(false);
        setArquivoCSV(null);
        setLinhasPrevia([]);
        setSucessoImportacao(false);
      }, 1500);
    } catch (err) {
      console.error("Erro na importação:", err);
      setErrosLeitura(["Erro ao gravar dados no sistema: " + err.message]);
    } finally {
      setProcessandoImportacao(false);
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
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
              Rastreabilidade
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Histórico e auditoria de todos os lotes de recebíveis que entraram na sua carteira
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleBaixarModelo}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Baixar Modelo CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setModalUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Importar Planilha CSV</span>
          </button>
        </div>
      </div>

      {/* Lista de Lotes */}
      {importacoes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-900">Nenhum lote importado ainda</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Importe planilhas CSV do seu ERP ou sistema de vendas para popular sua carteira em segundos.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={handleBaixarModelo}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              <span>Baixar Modelo de Exemplo</span>
            </button>
            <button
              onClick={() => setModalUploadOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
              <span>Importar Arquivo CSV</span>
            </button>
          </div>
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
                      <p className="mt-1 text-xs text-slate-600 truncate">{lote.detalhes}</p>
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

      {/* Modal Interativo de Upload de Planilha CSV */}
      {modalUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-slate-900">
                    Importar Planilha de Títulos (CSV)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Traga centenas de faturas com clientes, valores e vencimentos de uma só vez
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalUploadOpen(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Área de Seleção de Arquivo */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/70"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleArquivoSelecionado}
                  className="hidden"
                />
                <FileSpreadsheet className="mx-auto h-12 w-12 text-blue-500 mb-2" />
                <p className="text-sm font-bold text-slate-800">
                  {arquivoCSV ? arquivoCSV.name : "Clique para selecionar seu arquivo CSV"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Suporta arquivos .CSV separados por vírgula (,) ou ponto-e-vírgula (;)
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBaixarModelo();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Baixar planilha modelo de exemplo</span>
                  </button>
                </div>
              </div>

              {/* Erros de Validação se houver */}
              {errosLeitura.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Atenção na leitura do arquivo:</span>
                  </div>
                  <ul className="text-xs text-red-700 list-disc list-inside space-y-0.5">
                    {errosLeitura.slice(0, 4).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pré-visualização dos Dados */}
              {linhasPrevia.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Pré-visualização ({totalValido} títulos válidos)
                    </span>
                    <span className="font-bold text-emerald-600">
                      Total: {formatCurrency(valorTotalPrevisto)}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-3">Cliente</th>
                          <th className="p-3">NF</th>
                          <th className="p-3">Vencimento</th>
                          <th className="p-3 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {linhasPrevia.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-medium text-slate-800">{row.nomeCliente}</td>
                            <td className="p-3 font-mono text-slate-600">{row.nota_fiscal}</td>
                            <td className="p-3 text-slate-600">{formatDate(row.vencimento)}</td>
                            <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(row.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {linhasPrevia.length > 5 && (
                    <p className="text-[11px] text-center text-slate-400">
                      + {linhasPrevia.length - 5} títulos adicionais no arquivo
                    </p>
                  )}
                </div>
              )}

              {sucessoImportacao && (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Lote importado com sucesso! Seus clientes e títulos já estão na carteira.</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4 flex items-center justify-between bg-slate-50/50">
              <button
                type="button"
                onClick={() => setModalUploadOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={linhasPrevia.length === 0 || processandoImportacao || sucessoImportacao}
                onClick={handleConfirmarImportacao}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
              >
                <Upload className={`h-4 w-4 ${processandoImportacao ? "animate-bounce" : ""}`} />
                <span>
                  {processandoImportacao
                    ? "Importando títulos..."
                    : `Confirmar e Importar (${totalValido} faturas)`}
                </span>
              </button>
            </div>
          </div>
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
                  Nenhum título detalhado individualmente vinculado a este ID de lote.
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
