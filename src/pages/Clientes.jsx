import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatCurrency, riscoColors } from "@/lib/format";
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Phone,
  Mail,
  Building2,
  X,
  AlertCircle,
  MessageSquare
} from "lucide-react";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [recebiveis, setRecebiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroRisco, setFiltroRisco] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);

  // Form novo cliente
  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    contato_nome: "",
    risco: "baixo",
    limite_credito: 10000,
  });

  const loadData = async () => {
    try {
      const [c, r] = await Promise.all([
        base44.entities.Cliente.list(),
        base44.entities.Recebivel.list(),
      ]);
      setClientes(c);
      setRecebiveis(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSalvarCliente = async (e) => {
    e.preventDefault();
    if (!novoCliente.nome.trim()) return;

    const criado = await base44.entities.Cliente.create(novoCliente);
    setClientes([...clientes, criado]);
    setModalOpen(false);
    setNovoCliente({
      nome: "",
      cnpj: "",
      email: "",
      telefone: "",
      contato_nome: "",
      risco: "baixo",
      limite_credito: 10000,
    });
  };

  const clientesEnriched = clientes.map((c) => {
    const recs = recebiveis.filter((r) => String(r.cliente_id) === String(c.id));
    const valorAberto = recs
      .filter((r) => r.status !== "pago")
      .reduce((acc, r) => acc + ((Number(r.valor) || 0) - (Number(r.valor_pago) || 0)), 0);
    const titulosVencidos = recs.filter((r) => r.status === "atrasado").length;

    return {
      ...c,
      valorAberto,
      titulosVencidos,
      totalTitulos: recs.length,
    };
  });

  const clientesFiltrados = clientesEnriched.filter((c) => {
    const matchSearch =
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cnpj && c.cnpj.includes(searchTerm)) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchRisco = filtroRisco === "todos" || c.risco === filtroRisco;

    return matchSearch && matchRisco;
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
            Clientes e Devedores
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre, acompanhe o score de crédito e gerencie o histórico de cada cliente.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Novo Cliente</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ/CPF ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Risco:</span>
          <select
            value={filtroRisco}
            onChange={(e) => setFiltroRisco(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            <option value="todos">Todos os Riscos</option>
            <option value="baixo">Baixo Risco</option>
            <option value="medio">Médio Risco</option>
            <option value="alto">Alto Risco</option>
          </select>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {clientesFiltrados.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">Nenhum cliente encontrado</p>
            <p className="text-xs text-slate-400">Tente ajustar seus termos de busca ou cadastrar um novo cliente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Cliente / Razão Social</th>
                  <th className="px-5 py-3.5">Contato</th>
                  <th className="px-5 py-3.5">Classificação de Risco</th>
                  <th className="px-5 py-3.5">Valor em Aberto</th>
                  <th className="px-5 py-3.5">Vencidos</th>
                  <th className="px-5 py-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientesFiltrados.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <Link to={`/clientes/${c.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                        {c.nome}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                        <span>CNPJ: {c.cnpj || "Não informado"}</span>
                        {c.contato_nome && <span>• Contato: {c.contato_nome}</span>}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 text-xs text-slate-600">
                        {c.telefone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{c.telefone}</span>
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span className="truncate max-w-[160px]">{c.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          riscoColors[c.risco] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {c.risco} risco
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900">{formatCurrency(c.valorAberto)}</span>
                      <div className="text-[11px] text-slate-400">{c.totalTitulos} títulos no total</div>
                    </td>

                    <td className="px-5 py-4">
                      {c.titulosVencidos > 0 ? (
                        <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                          {c.titulosVencidos} pendentes
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">Em dia</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/clientes/${c.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          <span>Ficha</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Cadastro de Cliente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-heading text-lg font-bold text-slate-900">Novo Cliente / Devedor</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarCliente} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Razão Social / Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mercado e Panificadora Central Ltda"
                  value={novoCliente.nome}
                  onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CNPJ ou CPF</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={novoCliente.cnpj}
                    onChange={(e) => setNovoCliente({ ...novoCliente, cnpj: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    required
                    placeholder="11999998888"
                    value={novoCliente.telefone}
                    onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Financeiro</label>
                  <input
                    type="email"
                    placeholder="financeiro@empresa.com.br"
                    value={novoCliente.email}
                    onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Contato</label>
                  <input
                    type="text"
                    placeholder="Ex: Juliana Silva"
                    value={novoCliente.contato_nome}
                    onChange={(e) => setNovoCliente({ ...novoCliente, contato_nome: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Classificação de Risco</label>
                  <select
                    value={novoCliente.risco}
                    onChange={(e) => setNovoCliente({ ...novoCliente, risco: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="baixo">Baixo Risco</option>
                    <option value="medio">Médio Risco</option>
                    <option value="alto">Alto Risco</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Limite de Crédito (R$)</label>
                  <input
                    type="number"
                    value={novoCliente.limite_credito}
                    onChange={(e) => setNovoCliente({ ...novoCliente, limite_credito: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
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
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
