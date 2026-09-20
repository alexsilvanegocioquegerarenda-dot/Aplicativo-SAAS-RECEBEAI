import React, { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  Receipt,
  Crown,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Sparkles,
  ArrowUpRight,
  Zap
} from "lucide-react";

// Empresas assinantes cadastradas na plataforma SaaS (visão exclusiva do administrador)
const EMPRESAS_SAAS_INICIAIS = [
  {
    id: "tenant-1",
    razao_social: "TechSolutions Informática Ltda",
    cnpj: "34.123.456/0001-89",
    responsavel: "Mariana Souza",
    email: "financeiro@techsolutions.com.br",
    telefone: "(11) 98765-4321",
    plano: "profissional", // R$ 349
    valor_mensalidade: 349.0,
    status: "ativo",
    titulos_ativos: 48,
    data_adesao: "2024-01-10",
  },
  {
    id: "tenant-2",
    razao_social: "Distribuidora Alvorada Alimentos",
    cnpj: "05.456.789/0001-12",
    responsavel: "Patrícia Lima",
    email: "contas@alvoradaalimentos.com.br",
    telefone: "(19) 99123-4567",
    plano: "enterprise", // R$ 799
    valor_mensalidade: 799.0,
    status: "ativo",
    titulos_ativos: 215,
    data_adesao: "2024-02-01",
  },
  {
    id: "tenant-3",
    razao_social: "Auto Peças e Mecânica São José",
    cnpj: "18.987.654/0001-23",
    responsavel: "Carlos Eduardo",
    email: "cobranca@autopecassaojose.com.br",
    telefone: "(11) 97654-3210",
    plano: "essencial", // R$ 149
    valor_mensalidade: 149.0,
    status: "ativo",
    titulos_ativos: 28,
    data_adesao: "2024-01-15",
  },
  {
    id: "tenant-4",
    razao_social: "Restaurante & Buffet Sabor Real",
    cnpj: "22.333.444/0001-55",
    responsavel: "Rodrigo Mendes",
    email: "adm@saborrealbuffet.com.br",
    telefone: "(21) 98888-7777",
    plano: "essencial", // R$ 149
    valor_mensalidade: 149.0,
    status: "ativo",
    titulos_ativos: 14,
    data_adesao: "2024-02-12",
  },
  {
    id: "tenant-5",
    razao_social: "Consultoria Delta Estratégia",
    cnpj: "45.678.901/0001-77",
    responsavel: "Beatriz Nogueira",
    email: "financeiro@deltaestrategia.com.br",
    telefone: "(31) 97777-6666",
    plano: "profissional", // R$ 349
    valor_mensalidade: 349.0,
    status: "ativo",
    titulos_ativos: 85,
    data_adesao: "2024-02-20",
  },
  {
    id: "tenant-6",
    razao_social: "Logística e Transportes Rodonave S.A.",
    cnpj: "12.888.999/0001-44",
    responsavel: "Fernando Guimarães",
    email: "diretoria@rodonavelog.com.br",
    telefone: "(11) 99888-1122",
    plano: "enterprise", // R$ 799
    valor_mensalidade: 799.0,
    status: "ativo",
    titulos_ativos: 340,
    data_adesao: "2024-03-01",
  },
  {
    id: "tenant-7",
    razao_social: "Indústria Metalúrgica Progresso",
    cnpj: "77.111.222/0001-33",
    responsavel: "Marcos Vinicius",
    email: "contato@metalurgicaprogresso.com.br",
    telefone: "(47) 98765-1122",
    plano: "profissional", // R$ 349
    valor_mensalidade: 349.0,
    status: "pendente", // Pendência de pagamento no Mercado Pago
    titulos_ativos: 32,
    data_adesao: "2024-03-05",
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState(() => {
    try {
      const stored = localStorage.getItem("recebeai_admin_empresas");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return EMPRESAS_SAAS_INICIAIS;
  });

  const [busca, setBusca] = useState("");
  const [filtroPlano, setFiltroPlano] = useState("todos");
  const [modalEditarPlano, setModalEditarPlano] = useState(null);

  useEffect(() => {
    localStorage.setItem("recebeai_admin_empresas", JSON.stringify(empresas));
  }, [empresas]);

  // Indicadores consolidados do SaaS
  const totalAssinantes = empresas.length;
  const assinantesAtivos = empresas.filter((e) => e.status === "ativo").length;

  // Faturamento Mensal Recorrente (MRR)
  const mrr = empresas
    .filter((e) => e.status === "ativo")
    .reduce((acc, e) => acc + (Number(e.valor_mensalidade) || 0), 0);

  const totalTitulosGerenciados = empresas.reduce((acc, e) => acc + (e.titulos_ativos || 0), 0);

  // Alteração manual de plano pelo administrador
  const handleMudarPlano = (empresaId, novoPlano) => {
    const precos = {
      essencial: 149.0,
      profissional: 349.0,
      enterprise: 799.0,
      starter: 149.0,
      pro: 349.0,
    };
    setEmpresas(
      empresas.map((e) =>
        e.id === empresaId
          ? {
              ...e,
              plano: novoPlano,
              valor_mensalidade: precos[novoPlano] || 149.0,
            }
          : e
      )
    );
    setModalEditarPlano(null);
  };

  const handleToggleStatus = (empresaId) => {
    setEmpresas(
      empresas.map((e) =>
        e.id === empresaId
          ? { ...e, status: e.status === "ativo" ? "suspenso" : "ativo" }
          : e
      )
    );
  };

  const empresasFiltradas = empresas.filter((e) => {
    const matchBusca =
      e.razao_social.toLowerCase().includes(busca.toLowerCase()) ||
      e.email.toLowerCase().includes(busca.toLowerCase()) ||
      e.responsavel.toLowerCase().includes(busca.toLowerCase()) ||
      (e.cnpj && e.cnpj.includes(busca));

    const matchPlano = filtroPlano === "todos" || e.plano === filtroPlano;
    return matchBusca && matchPlano;
  });

  const badgePlano = {
    essencial: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold",
    starter: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold",
    profissional: "bg-blue-50 text-blue-800 border-blue-200 font-bold",
    pro: "bg-blue-50 text-blue-800 border-blue-200 font-bold",
    enterprise: "bg-purple-50 text-purple-800 border-purple-200 font-bold",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      {/* Banner de Segurança do Administrador Master */}
      <div className="mb-8 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-orange-50/40 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-xl font-bold text-slate-900 md:text-2xl">
                  Painel do Administrador Master
                </h1>
                <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                  Visão Total dos Usuários
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-2xl">
                Você está logado como <strong>{user?.email || "admin@recebeai.com.br"}</strong>. Esta visão é estritamente confidencial: os clientes assinantes do SaaS não possuem acesso a esta tela nem às suas credenciais.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-amber-200/80 shadow-sm self-start sm:self-center">
            <Lock className="h-3.5 w-3.5 text-amber-600" />
            <span>Isolamento Total Ativo</span>
          </div>
        </div>
      </div>

      {/* Grid de Métricas Globais do SaaS */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Faturamento Mensal Recorrente (MRR) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">MRR (Faturamento SaaS)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-600">{formatCurrency(mrr)}</div>
            <div className="mt-1 text-xs text-slate-500">
              Receita mensal de assinaturas ativas
            </div>
          </div>
        </div>

        {/* Empresas Assinantes Cadastradas */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Empresas Assinantes</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">{totalAssinantes} clientes</div>
            <div className="mt-1 text-xs text-emerald-600 font-medium">
              {assinantesAtivos} assinaturas ativas
            </div>
          </div>
        </div>

        {/* Títulos em Gestão na Plataforma */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Volume de Títulos</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">{totalTitulosGerenciados}</div>
            <div className="mt-1 text-xs text-slate-500">
              Faturas gerenciadas pelas empresas
            </div>
          </div>
        </div>

        {/* Ticket Médio por Assinante */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Ticket Médio</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(assinantesAtivos > 0 ? mrr / assinantesAtivos : 0)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Média por empresa cliente/mês
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Empresas Clientes do SaaS */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100">
          <div>
            <h2 className="font-heading text-base font-bold text-slate-900">
              Todas as Empresas e Usuários Cadastrados
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie os planos contratados, situação cadastral e acesso de cada cliente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar empresa, e-mail ou CNPJ..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none min-w-[220px]"
              />
            </div>

            <select
              value={filtroPlano}
              onChange={(e) => setFiltroPlano(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="todos">Todos os Planos</option>
              <option value="starter">Starter (R$ 119)</option>
              <option value="pro">Profissional (R$ 299)</option>
              <option value="enterprise">Enterprise (R$ 699)</option>
            </select>
          </div>
        </div>

        {/* Listagem */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Empresa / Razão Social</th>
                <th className="px-5 py-3.5">Responsável / E-mail</th>
                <th className="px-5 py-3.5">Plano Contratado</th>
                <th className="px-5 py-3.5">Mensalidade</th>
                <th className="px-5 py-3.5">Títulos Ativos</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ações do Administrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {empresasFiltradas.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900">{emp.razao_social}</div>
                    <div className="text-xs text-slate-400">CNPJ: {emp.cnpj}</div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="text-slate-800 font-medium">{emp.responsavel}</div>
                    <div className="text-xs text-slate-400">{emp.email}</div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs uppercase tracking-wide ${
                        badgePlano[emp.plano] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {emp.plano}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-bold text-slate-900">
                    {formatCurrency(emp.valor_mensalidade)}
                    <span className="text-[10px] font-normal text-slate-400">/mês</span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    <span className="font-medium text-slate-900">{emp.titulos_ativos}</span> títulos
                  </td>

                  <td className="px-5 py-4">
                    {emp.status === "ativo" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Ativo
                      </span>
                    ) : emp.status === "pendente" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        <AlertTriangle className="h-3 w-3" /> Pendente MP
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                        <UserX className="h-3 w-3" /> Suspenso
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setModalEditarPlano(emp)}
                        title="Alterar plano da empresa"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Mudar Plano</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(emp.id)}
                        title={emp.status === "ativo" ? "Suspender acesso" : "Reativar acesso"}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                          emp.status === "ativo"
                            ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {emp.status === "ativo" ? (
                          <>
                            <UserX className="h-3 w-3" />
                            <span>Suspender</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3 w-3" />
                            <span>Ativar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Administrador Alterar Plano de um Usuário */}
      {modalEditarPlano && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModalEditarPlano(null)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="font-heading text-lg font-bold text-slate-900">
              Alterar Plano do Cliente
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Empresa: <strong>{modalEditarPlano.razao_social}</strong>
            </p>

            <div className="mt-5 space-y-3">
              {[
                { id: "essencial", nome: "Plano Essencial", preco: "R$ 149/mês", desc: "Até 300 clientes e R$ 100k" },
                { id: "profissional", nome: "Plano Profissional", preco: "R$ 349/mês", desc: "Ilimitado com IA e WhatsApp API" },
                { id: "enterprise", nome: "Plano Enterprise", preco: "R$ 799/mês", desc: "Corporativo, multi-usuários e API" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleMudarPlano(modalEditarPlano.id, p.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all flex items-center justify-between ${
                    modalEditarPlano.plano === p.id
                      ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{p.nome}</div>
                    <div className="text-[11px] text-slate-500">{p.desc}</div>
                  </div>
                  <div className="text-xs font-bold text-blue-700">{p.preco}</div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalEditarPlano(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
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
