import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate, statusColors, statusLabels } from "@/lib/format";
import {
  HeartHandshake,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  X,
  AlertTriangle
} from "lucide-react";

export default function Promessas() {
  const [promessas, setPromessas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [recebiveis, setRecebiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form nova promessa
  const [novaPromessa, setNovaPromessa] = useState({
    cliente_id: "",
    recebivel_id: "",
    valor_acordado: "",
    data_promessa: "",
    observacao: "",
  });

  const loadData = async () => {
    try {
      const [p, c, r] = await Promise.all([
        base44.entities.Promessa.list(),
        base44.entities.Cliente.list(),
        base44.entities.Recebivel.list(),
      ]);
      setPromessas(p);
      setClientes(c);
      setRecebiveis(r);

      if (c.length > 0) {
        setNovaPromessa((prev) => ({ ...prev, cliente_id: c[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSalvarPromessa = async (e) => {
    e.preventDefault();
    if (!novaPromessa.cliente_id || !novaPromessa.valor_acordado || !novaPromessa.data_promessa) return;

    const criada = await base44.entities.Promessa.create({
      ...novaPromessa,
      valor_acordado: Number(novaPromessa.valor_acordado),
      status: "pendente",
    });

    setPromessas([criada, ...promessas]);
    setModalOpen(false);
    setNovaPromessa({
      cliente_id: clientes[0]?.id || "",
      recebivel_id: "",
      valor_acordado: "",
      data_promessa: "",
      observacao: "",
    });
  };

  const handleAtualizarStatus = async (promessaId, novoStatus) => {
    const updated = await base44.entities.Promessa.update(promessaId, { status: novoStatus });
    setPromessas(promessas.map((p) => (p.id === promessaId ? updated : p)));
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  const pendentes = promessas.filter((p) => p.status === "pendente");
  const cumpridas = promessas.filter((p) => p.status === "cumprida");
  const quebradas = promessas.filter((p) => p.status === "quebrada");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Promessas de Pagamento & Acordos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe datas prometidas pelos clientes, negociações em andamento e histórico de cumprimento.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Nova Promessa</span>
        </button>
      </div>

      {/* Cards Indicadores */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-800">Pendentes</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-900">{pendentes.length}</div>
          <p className="mt-1 text-xs text-amber-700">Aguardando confirmação de recebimento</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-800">Cumpridas</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-900">{cumpridas.length}</div>
          <p className="mt-1 text-xs text-emerald-700">Pagamentos honrados no prazo acordado</p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-red-800">Quebradas</span>
            <XCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-red-900">{quebradas.length}</div>
          <p className="mt-1 text-xs text-red-700">Necessitam de cobrança imediata e renegociação</p>
        </div>
      </div>

      {/* Lista de Promessas */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {promessas.length === 0 ? (
          <div className="py-12 text-center">
            <HeartHandshake className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">Nenhuma promessa de pagamento registrada</p>
            <p className="text-xs text-slate-400">Registre acordos ao negociar com devedores pelo telefone ou WhatsApp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Data Acordada</th>
                  <th className="px-5 py-3.5">Valor Acordado</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Observações</th>
                  <th className="px-5 py-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promessas.map((p) => {
                  const cli = clientes.find((c) => String(c.id) === String(p.cliente_id));
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <Link to={`/clientes/${p.cliente_id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                          {cli?.nome || "Cliente"}
                        </Link>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(p.data_promessa)}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {formatCurrency(p.valor_acordado)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            statusColors[p.status] || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {statusLabels[p.status] || p.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {p.observacao || "Sem observações"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {p.status === "pendente" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAtualizarStatus(p.id, "cumprida")}
                              title="Marcar como cumprida (pagou)"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Cumprida</span>
                            </button>

                            <button
                              onClick={() => handleAtualizarStatus(p.id, "quebrada")}
                              title="Marcar como quebrada (não pagou)"
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Quebrada</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Cadastro de Promessa */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-heading text-lg font-bold text-slate-900">Registrar Promessa de Pagamento</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarPromessa} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente / Devedor *</label>
                <select
                  required
                  value={novaPromessa.cliente_id}
                  onChange={(e) => setNovaPromessa({ ...novaPromessa, cliente_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Acordado (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="2500.00"
                    value={novaPromessa.valor_acordado}
                    onChange={(e) => setNovaPromessa({ ...novaPromessa, valor_acordado: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data da Promessa *</label>
                  <input
                    type="date"
                    required
                    value={novaPromessa.data_promessa}
                    onChange={(e) => setNovaPromessa({ ...novaPromessa, data_promessa: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações do Acordo</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Cliente informou que fará transferência no período da tarde após faturamento de cliente..."
                  value={novaPromessa.observacao}
                  onChange={(e) => setNovaPromessa({ ...novaPromessa, observacao: e.target.value })}
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
                  Salvar Promessa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
