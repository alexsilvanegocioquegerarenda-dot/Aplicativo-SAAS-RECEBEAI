import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Zap,
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check
} from "lucide-react";

export default function Cadastro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();

  const planoInicial = searchParams.get("plano") || "profissional";

  const [formData, setFormData] = useState({
    razaoSocial: "",
    cnpj: "",
    telefone: "",
    nome: "",
    email: "",
    password: "",
    plano: planoInicial,
  });

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const planosOpcoes = [
    {
      id: "essencial",
      nome: "Essencial",
      preco: "R$ 149/mês",
      desc: "Até 300 clientes e R$ 100k",
      destaque: false,
    },
    {
      id: "profissional",
      nome: "Profissional",
      preco: "R$ 349/mês",
      desc: "Ilimitado com IA e WhatsApp API",
      destaque: true,
      badge: "Mais Escolhido",
    },
    {
      id: "enterprise",
      nome: "Enterprise",
      preco: "R$ 799/mês",
      desc: "Corporativo e multi-usuários",
      destaque: false,
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!formData.razaoSocial.trim()) {
      setErro("Informe a Razão Social ou Nome Fantasia da sua empresa.");
      return;
    }
    if (!formData.nome.trim()) {
      setErro("Informe o seu nome completo.");
      return;
    }
    if (!formData.email.trim()) {
      setErro("Informe um e-mail corporativo válido.");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      const res = await register(formData);
      if (res.success) {
        navigate("/dashboard");
      } else {
        setErro("Não foi possível criar a conta. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      setErro("Ocorreu um erro ao criar a empresa. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Navbar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800/80">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight text-white">
            Recebe<span className="text-emerald-400">Ai</span>
          </span>
        </Link>
        <div className="text-xs text-slate-400">
          Já possui conta?{" "}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold underline ml-1">
            Fazer Login
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto w-full py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            7 Dias de Garantia Incondicional
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Crie sua conta empresarial no RecebeAi
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
            Sua empresa terá um ambiente e banco de dados 100% isolado e seguro para automatizar cobranças e acelerar o fluxo de caixa.
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 backdrop-blur-xl shadow-2xl shadow-black/50">
          {erro && (
            <div className="mb-6 flex items-center gap-2.5 rounded-2xl bg-red-500/10 p-4 border border-red-500/20 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Escolha do Plano */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
                1. Escolha o Plano Inicial da Sua Empresa
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {planosOpcoes.map((p) => {
                  const isSelected = formData.plano === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setFormData({ ...formData, plano: p.id })}
                      className={`relative text-left p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                      }`}
                    >
                      {p.badge && (
                        <span className="absolute -top-2.5 right-3 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {p.badge}
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{p.nome}</span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-emerald-400 mt-1">{p.preco}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dados da Empresa */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
                2. Dados da Empresa (Tenant Multi-empresa)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Razão Social ou Nome Fantasia *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Alfa Logística e Transportes"
                      value={formData.razaoSocial}
                      onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    CNPJ (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Dados do Gestor / Acesso */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
                3. Dados do Gestor Financeiro & Acesso
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Seu Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo Silva"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    WhatsApp Comercial *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="(11) 99999-8888"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    E-mail Corporativo de Login *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="financeiro@empresa.com.br"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Criar Senha de Acesso *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="Mínimo de 6 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Aviso de Isolamento & Segurança */}
            <div className="flex items-start gap-3 rounded-2xl bg-slate-950/60 p-4 border border-slate-800 text-xs text-slate-400">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Garantia de Isolamento Multi-empresa:</strong> Ao criar sua conta, criamos um banco de dados restrito com Row Level Security (RLS). Nenhuma outra empresa terá visibilidade dos seus clientes ou faturas.
              </p>
            </div>

            {/* Botão de Criação */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>{carregando ? "Criando ambiente seguro da empresa..." : "Criar Minha Empresa e Começar Agora"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center pt-6 text-xs text-slate-500 border-t border-slate-800/80">
        © {new Date().getFullYear()} RecebeAi Soluções Tecnológicas. Todos os direitos reservados.
      </div>
    </div>
  );
}
