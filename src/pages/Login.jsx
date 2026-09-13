import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, DEFAULT_USERS } from "@/context/AuthContext";
import {
  Zap,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Crown,
  Users
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, alternarPerfilDemonstracao } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErro("Por favor, preencha o e-mail e a senha.");
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate(from);
        }
      } else {
        setErro("Credenciais inválidas. Verifique seu e-mail e senha.");
      }
    } catch (err) {
      setErro("Erro ao realizar login. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const handleEntrarComo = async (tipo) => {
    alternarPerfilDemonstracao(tipo);
    if (tipo === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30 mb-3">
            <Zap className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white md:text-3xl">
            Recebe<span className="text-blue-400">Ai</span>
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Acesso à plataforma SaaS de Gestão e Automação de Cobranças
          </p>
        </div>

        {/* Card de Login */}
        <div className="rounded-3xl border border-slate-700/60 bg-slate-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 p-3.5 border border-red-500/20 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{erro}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail de Acesso
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="seu-email@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all"
            >
              <span>{carregando ? "Acessando..." : "Entrar na Plataforma"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/60" />
            </div>
            <span className="relative bg-slate-800/80 px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Acesso Rápido de Demonstração
            </span>
          </div>

          {/* Botões de Acesso Rápido com Níveis de Permissão */}
          <div className="space-y-2.5">
            {/* Opção 1: Administrador Master */}
            <button
              type="button"
              onClick={() => handleEntrarComo("admin")}
              className="flex w-full items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-left hover:bg-amber-500/20 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                  <Crown className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300">Entrar como Administrador Master</div>
                  <div className="text-[10px] text-slate-400">admin@recebeai.com.br (Visão total)</div>
                </div>
              </div>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                Master
              </span>
            </button>

            {/* Opção 2: Cliente Assinante Comum */}
            <button
              type="button"
              onClick={() => handleEntrarComo("cliente")}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/60 p-3 text-left hover:bg-slate-700/40 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Entrar como Cliente Empresa</div>
                  <div className="text-[10px] text-slate-400">Sem acesso ao painel admin nem senhas</div>
                </div>
              </div>
              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                Cliente
              </span>
            </button>
          </div>

          {/* Aviso de Segurança e Isolamento */}
          <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-slate-900/50 p-3 text-[11px] text-slate-400 border border-slate-700/40">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Isolamento de Segurança:</strong> Os clientes cadastrados só têm acesso aos seus próprios títulos e não conseguem ver o menu de Administrador nem dados de outras empresas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
