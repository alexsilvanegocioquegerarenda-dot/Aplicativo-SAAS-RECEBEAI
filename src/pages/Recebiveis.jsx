import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate, daysBetween, statusColors, statusLabels } from "@/lib/format";
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  MessageSquare,
  FileText
} from "lucide-react";

export default function Recebiveis() {
  const [recebiveis, setRecebiveis] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Form novo título
  const [novoTitulo, setNovoTitulo] = useState({
    cliente_id: "",
    nota_fiscal: "",
    descricao: "",
    valor: "",
    vencimento: "",
    forma_pagamento: "pix",
  });

  const loadData = async () => {
    try {
      const [r, c, cfg] = await Promise.all([
        base44.entities.Recebivel.list(),
        base44.entities.Cliente.list(),
        base44.entities.Configuracao.get(),
      ]);
      setRecebiveis(r);
      setClientes(c);
      setConfig(cfg);
      if (c.length > 0) {
        setNovoTitulo((prev) => ({ ...prev, cliente_id: c[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSalvarTitulo = async (e) => {
    e.preventDefault();
    if (!novoTitulo.cliente_id || !novoTitulo.valor || !novoTitulo.vencimento) return;

    const dias = daysBetween(novoTitulo.vencimento);
    let status = "em_dia";
    if (dias > 0) status = "atrasado";
    else if (dias > -7) status = "a_vencer";

    const criado = await base44.entities.Recebivel.create({
      ...novoTitulo,
      valor: Number(novoTitulo.valor),
      valor_pago: 0,
      status,
    });

    setRecebiveis([criado, ...recebiveis]);
    setModalOpen(false);
    setNovoTitulo({
      cliente_id: clientes[0]?.id || "",
      nota_fiscal: "",
      descricao: "",
      valor: "",
      vencimento: "",
      forma_pagamento: "pix",
    });
  };

  const handleDarBaixa = async (r) => {
    const updated = await base44.entities.Recebivel.update(r.id, {
      status: "pago",
      valor_pago: r.valor,
      data_pagamento: new Date().toISOString().split("T")[0],
    });
    setRecebiveis(recebiveis.map((item) => (item.id === r.id ? updated : item)));
  };

  const handleCobrarWhatsApp = (r) => {
    const cli = clientes.find((c) => String(c.id) === String(r.cliente_id));
    if (!cli) return;

    const chavePix = config?.chave_pix || "Chave PIX a combinar";
    const telefone = cli.telefone?.replace(/\D/g, "") || "";
    const texto = `Olá ${cli.nome}, tudo bem? Consta em aberto a sua fatura ${r.nota_fiscal || "NF"} no valor de ${formatCurrency(r.valor)} com vencimento em ${formatDate(r.vencimento)}. Para quitar via PIX utilize a chave: ${chavePix}. Em caso de dúvidas, estamos à disposição!`;

    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  };

  const titulosEnriched = recebiveis.map((r) => {
    const cli = clientes.find((c) => String(c.id) === String(r.cliente_id));
    const dias = daysBetween(r.vencimento);
    const saldo = (Number(r.valor) || 0) - (Number(r.valor_pago) || 0);

    return {
      ...r,
      clienteNome: cli?.nome || "Cliente Desconhecido",
      clienteTelefone: cli?.telefone || "",
      dias,
      saldo: r.status === "pago" ? 0 : saldo,
    };
  });

  const titulosFiltrados = titulosEnriched.filter((r) => {
    const matchSearch =
      r.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.nota_fiscal && r.nota_fiscal.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.descricao && r.descricao.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filtroStatus === "todos") return matchSearch;
    if (filtroStatus === "aberto") return matchSearch && r.status !== "pago";
    if (filtroStatus === "atrasado") return matchSearch && r.status !== "pago" && r.dias > 0;
    if (filtroStatus === "a_vencer") return matchSearch && r.status !== "pago" && r.dias <= 0;
    if (filtroStatus === "pago") return matchSearch && r.status === "pago";

    return matchSearch;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Recebíveis e Títulos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerenciamento de faturas, emissões, acompanhamento de vencimentos e baixa de pagamentos.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Novo Título</span>
        </button>
      </div>

      {/* Tabs & Busca */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            {[
              { id: "todos", label: "Todos" },
              { id: "aberto", label: "Em Aberto" },
              { id: "atrasado", label: "Atrasados" },
              { id: "a_vencer", label: "A Vencer" },
              { id: "pago", label: "Pagos / Liquidados" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFiltroStatus(tab.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  filtroStatus === tab.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar título ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabela de Títulos */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {titulosFiltrados.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">Nenhum título localizado</p>
            <p className="text-xs text-slate-400">Verifique o filtro aplicado ou cadastre um novo título acima.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Título / NF</th>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Vencimento</th>
                  <th className="px-5 py-3.5">Valor</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {titulosFiltrados.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{r.nota_fiscal || "—"}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[200px]">{r.descricao || "Sem descrição"}</div>
                    </td>

                    <td className="px-5 py-4">
                      <Link to={`/clientes/${r.cliente_id}`} className="font-medium text-slate-800 hover:text-blue-600">
                        {r.clienteNome}
                      </Link>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-slate-800 font-medium">{formatDate(r.vencimento)}</div>
                      {r.status !== "pago" && (
                        <div className="text-[11px]">
                          {r.dias > 0 ? (
                            <span className="font-semibold text-red-600">{r.dias} dias atrasado</span>
                          ) : (
                            <span className="text-slate-500">vence em {Math.abs(r.dias)} dias</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{formatCurrency(r.valor)}</div>
                      {r.status === "pago" && (
                        <div className="text-[11px] text-emerald-600">Pago em {formatDate(r.data_pagamento)}</div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          statusColors[r.status] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {statusLabels[r.status] || r.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.status !== "pago" ? (
                          <>
                            <button
                              onClick={() => handleCobrarWhatsApp(r)}
                              title="Cobrar via WhatsApp"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>

                            <button
                              onClick={() => handleDarBaixa(r)}
                              title="Confirmar recebimento do pagamento"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">Dar Baixa</span>
                            </button>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" /> Liquidado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Cadastro de Título */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-heading text-lg font-bold text-slate-900">Novo Título a Receber</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarTitulo} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente / Devedor *</label>
                <select
                  required
                  value={novoTitulo.cliente_id}
                  onChange={(e) => setNovoTitulo({ ...novoTitulo, cliente_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.cnpj ? `(${c.cnpj})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nota Fiscal / Título *</label>
                  <input
                    type="text"
                    required
                    placeholder="NF-2024-001"
                    value={novoTitulo.nota_fiscal}
                    onChange={(e) => setNovoTitulo({ ...novoTitulo, nota_fiscal: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1500.00"
                    value={novoTitulo.valor}
                    onChange={(e) => setNovoTitulo({ ...novoTitulo, valor: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={novoTitulo.vencimento}
                    onChange={(e) => setNovoTitulo({ ...novoTitulo, vencimento: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Forma de Cobrança</label>
                  <select
                    value={novoTitulo.forma_pagamento}
                    onChange={(e) => setNovoTitulo({ ...novoTitulo, forma_pagamento: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto Bancário</option>
                    <option value="cartao">Cartão de Crédito</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição / Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Fornecimento de mercadorias referente ao pedido 452"
                  value={novoTitulo.descricao}
                  onChange={(e) => setNovoTitulo({ ...novoTitulo, descricao: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
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
