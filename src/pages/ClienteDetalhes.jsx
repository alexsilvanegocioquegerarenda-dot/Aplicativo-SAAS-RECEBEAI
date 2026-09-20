import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate, daysBetween, statusColors, statusLabels, riscoColors } from "@/lib/format";
import AgingTabela from "@/components/AgingTabela";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Plus,
  DollarSign,
  ShieldAlert,
  Wallet,
  Calendar,
  X
} from "lucide-react";

export default function ClienteDetalhes() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [recebiveis, setRecebiveis] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal Novo Título para este cliente
  const [modalTituloOpen, setModalTituloOpen] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState({
    nota_fiscal: "",
    descricao: "",
    valor: "",
    vencimento: "",
    forma_pagamento: "pix",
  });

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [todosClientes, todosRecebiveis, cfg] = await Promise.all([
        base44.entities.Cliente.list(),
        base44.entities.Recebivel.list(),
        base44.entities.Configuracao.get(),
      ]);

      const cli = todosClientes.find((c) => String(c.id) === String(id));
      setCliente(cli || null);

      const recs = todosRecebiveis.filter((r) => String(r.cliente_id) === String(id));
      setRecebiveis(recs);
      setConfig(cfg);
    } catch (err) {
      console.error("Erro ao carregar dados do cliente:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      carregarDados();
    }
  }, [id]);

  // Enriquecimento dos títulos para a tabela e o Aging
  const recebiveisEnriched = useMemo(() => {
    return recebiveis.map((r) => {
      const dias = daysBetween(r.vencimento);
      const saldo = r.status === "pago" ? 0 : Math.max(0, (Number(r.valor) || 0) - (Number(r.valor_pago) || 0));
      return {
        ...r,
        dias,
        saldo,
      };
    });
  }, [recebiveis]);

  // Indicadores consolidados do cliente
  const stats = useMemo(() => {
    const totalAberto = recebiveisEnriched
      .filter((r) => r.status !== "pago")
      .reduce((acc, r) => acc + r.saldo, 0);

    const totalVencido = recebiveisEnriched
      .filter((r) => r.status !== "pago" && r.dias > 0)
      .reduce((acc, r) => acc + r.saldo, 0);

    const totalPago = recebiveisEnriched
      .filter((r) => r.status === "pago")
      .reduce((acc, r) => acc + (Number(r.valor_pago) || Number(r.valor) || 0), 0);

    const qtdVencidos = recebiveisEnriched.filter((r) => r.status !== "pago" && r.dias > 0).length;

    return { totalAberto, totalVencido, totalPago, qtdVencidos };
  }, [recebiveisEnriched]);

  // Dar baixa de pagamento em um título
  const handleDarBaixa = async (r) => {
    const updated = await base44.entities.Recebivel.update(r.id, {
      status: "pago",
      valor_pago: r.valor,
      data_pagamento: new Date().toISOString().split("T")[0],
    });
    setRecebiveis((prev) => prev.map((item) => (item.id === r.id ? updated : item)));
  };

  // Disparo de cobrança via WhatsApp
  const handleCobrarWhatsApp = (r = null) => {
    if (!cliente) return;
    const telefone = cliente.telefone?.replace(/\D/g, "") || "";
    const chavePix = config?.chave_pix || "Chave PIX da empresa";
    const valorCobrar = r ? formatCurrency(r.valor) : formatCurrency(stats.totalVencido || stats.totalAberto);
    const doc = r ? `fatura ${r.nota_fiscal}` : "faturas em aberto";
    const diasTxt = r && r.dias > 0 ? ` vencida há ${r.dias} dias` : "";

    const texto = `Olá, ${cliente.nome}! Constatamos em nosso sistema a pendência referente à ${doc}${diasTxt} no valor de ${valorCobrar}.\n\nPara facilitar sua quitação imediata, segue nossa chave PIX:\n👉 *${chavePix}*\n\nCaso já tenha realizado o pagamento, favor desconsiderar. Obrigado!`;

    const url = `https://api.whatsapp.com/send?phone=55${telefone}&text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  };

  // Salvar novo título vinculado
  const handleSalvarNovoTitulo = async (e) => {
    e.preventDefault();
    if (!novoTitulo.valor || !novoTitulo.vencimento) return;

    const dias = daysBetween(novoTitulo.vencimento);
    let status = "em_dia";
    if (dias > 0) status = "atrasado";
    else if (dias > -7) status = "a_vencer";

    const criado = await base44.entities.Recebivel.create({
      cliente_id: id,
      nota_fiscal: novoTitulo.nota_fiscal || `NF-${Math.floor(1000 + Math.random() * 9000)}`,
      descricao: novoTitulo.descricao || "Prestação de Serviços / Venda a Prazo",
      valor: Number(novoTitulo.valor),
      valor_pago: 0,
      vencimento: novoTitulo.vencimento,
      status,
      forma_pagamento: novoTitulo.forma_pagamento,
    });

    setRecebiveis((prev) => [criado, ...prev]);
    setModalTituloOpen(false);
    setNovoTitulo({
      nota_fiscal: "",
      descricao: "",
      valor: "",
      vencimento: "",
      forma_pagamento: "pix",
    });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Cliente não encontrado</h2>
        <p className="mt-1 text-sm text-slate-500">
          O cliente solicitado não foi localizado no banco de dados da sua empresa.
        </p>
        <Link
          to="/clientes"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para Lista de Clientes</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 space-y-8">
      {/* Top Bar com Navegação e Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/clientes"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                {cliente.nome}
              </h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${riscoColors[cliente.risco] || "bg-slate-100 text-slate-700"}`}>
                Risco {cliente.risco || "Médio"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              CNPJ: {cliente.cnpj || "Não cadastrado"} • Contato: {cliente.contato_nome || cliente.nome}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleCobrarWhatsApp()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Cobrar no WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTituloOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Lançar Título</span>
          </button>
        </div>
      </div>

      {/* Grid de Métricas do Cliente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total a Receber</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(stats.totalAberto)}</div>
          <div className="mt-1 text-xs text-slate-500">
            {recebiveisEnriched.filter((r) => r.status !== "pago").length} títulos em aberto
          </div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-600">Total Vencido</span>
          <div className="mt-2 text-2xl font-bold text-red-700">{formatCurrency(stats.totalVencido)}</div>
          <div className="mt-1 text-xs text-red-600 font-medium">
            {stats.qtdVencidos} títulos com atraso
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Total Liquidado</span>
          <div className="mt-2 text-2xl font-bold text-emerald-800">{formatCurrency(stats.totalPago)}</div>
          <div className="mt-1 text-xs text-emerald-700">
            {recebiveisEnriched.filter((r) => r.status === "pago").length} títulos pagos
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Limite de Crédito</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(cliente.limite_credito || 10000)}</div>
          <div className="mt-1 text-xs text-slate-500">
            Disponível: {formatCurrency(Math.max(0, (cliente.limite_credito || 10000) - stats.totalAberto))}
          </div>
        </div>
      </div>

      {/* Bloco 2 Colunas: Informações Cadastrais e Aging do Cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cartão de Cadastro */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h2 className="font-heading text-base font-bold text-slate-900">
              Dados Cadastrais
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Razão Social / Nome</span>
              <span className="font-bold text-slate-800 text-sm">{cliente.nome}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">CNPJ / CPF</span>
              <span className="font-mono font-semibold text-slate-700">{cliente.cnpj || "Não cadastrado"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">E-mail de Cobrança</span>
                <a href={`mailto:${cliente.email}`} className="text-blue-600 hover:underline font-medium">
                  {cliente.email || "Sem e-mail cadastrado"}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Telefone / WhatsApp</span>
                <span className="font-semibold text-slate-800">{cliente.telefone || "Sem telefone"}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 block text-[10px]">Pessoa de Contato</span>
              <span className="font-semibold text-slate-700">{cliente.contato_nome || "Responsável Financeiro"}</span>
            </div>
          </div>
        </div>

        {/* Tabela de Aging Temporal do Cliente */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900">
                Aging Temporal dos Recebíveis
              </h2>
              <p className="text-xs text-slate-500">
                Distribuição das pendências deste cliente por faixas de vencimento
              </p>
            </div>
            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {recebiveisEnriched.length} títulos
            </span>
          </div>

          <AgingTabela recebiveisEnriched={recebiveisEnriched} clienteId={id} />
        </div>
      </div>

      {/* Tabela Completa de Títulos do Cliente */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-bold text-slate-900">
              Títulos e Faturas Registradas
            </h2>
            <p className="text-xs text-slate-500">
              Histórico detalhado de recebíveis, vencimentos e liquidações
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Nota Fiscal / Doc</th>
                <th className="pb-3">Descrição</th>
                <th className="pb-3">Vencimento</th>
                <th className="pb-3">Atraso</th>
                <th className="pb-3">Valor</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recebiveisEnriched.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-slate-400">
                    Nenhum título cadastrado para este cliente até o momento.
                  </td>
                </tr>
              ) : (
                recebiveisEnriched.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 font-bold font-mono text-slate-900">
                      {r.nota_fiscal || "S/N"}
                    </td>
                    <td className="py-3.5 text-xs text-slate-600 max-w-xs truncate">
                      {r.descricao || "Prestação de Serviços"}
                    </td>
                    <td className="py-3.5 text-xs text-slate-700">
                      {formatDate(r.vencimento)}
                    </td>
                    <td className="py-3.5 text-xs">
                      {r.status === "pago" ? (
                        <span className="text-emerald-700 font-medium">Pago</span>
                      ) : r.dias > 0 ? (
                        <span className="font-bold text-red-600">+{r.dias} dias</span>
                      ) : (
                        <span className="text-slate-500">{Math.abs(r.dias)} dias</span>
                      )}
                    </td>
                    <td className="py-3.5 font-bold text-slate-900">
                      {formatCurrency(r.valor)}
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusColors[r.status] || "bg-slate-100 text-slate-700"}`}>
                        {statusLabels[r.status] || r.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.status !== "pago" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCobrarWhatsApp(r)}
                              title="Cobrar este título no WhatsApp"
                              className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDarBaixa(r)}
                              title="Dar baixa / Marcar como Pago"
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Baixar</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançar Novo Título para o Cliente */}
      {modalTituloOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModalTituloOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-slate-900">Novo Título de Cobrança</h3>
                  <p className="text-xs text-slate-500">Vinculado a {cliente.nome}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalTituloOpen(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovoTitulo} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nota Fiscal ou Número do Título</label>
                <input
                  type="text"
                  placeholder="Ex: NF-2024-501"
                  value={novoTitulo.nota_fiscal}
                  onChange={(e) => setNovoTitulo({ ...novoTitulo, nota_fiscal: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição do Serviço / Produto</label>
                <input
                  type="text"
                  placeholder="Ex: Mensalidade de Licença ou Venda a Prazo"
                  value={novoTitulo.descricao}
                  onChange={(e) => setNovoTitulo({ ...novoTitulo, descricao: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor (R$)*</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={novoTitulo.valor}
                    onChange={(e) => setNovoTitulo({ ...novoTitulo, valor: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vencimento*</label>
                  <input
                    type="date"
                    required
                    value={novoTitulo.vencimento}
                    onChange={(e) => setNovoTitulo({ ...novoTitulo, vencimento: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Forma de Liquidação Prevista</label>
                <select
                  value={novoTitulo.forma_pagamento}
                  onChange={(e) => setNovoTitulo({ ...novoTitulo, forma_pagamento: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="pix">PIX Instantâneo</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="cartao">Cartão de Crédito</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalTituloOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20"
                >
                  Salvar Título
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
