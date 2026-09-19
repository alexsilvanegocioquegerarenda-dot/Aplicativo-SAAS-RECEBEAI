import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth, DEFAULT_USERS } from "@/context/AuthContext";
import {
  Zap,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Crown,
  Users,
  ArrowLeft
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, alternarPerfilDemonstracao } = useAuth();

  const [tipoLogin, setTipoLogin] = useState("empresa"); // 'empresa' | 'admin'
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
          navigate(from === "/login" || from === "/" ? "/dashboard" : from);
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

  const handleEntrarComoDemo = (tipo) => {
    alternarPerfilDemonstracao(tipo);
    if (tipo === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 sm:p-6 text-slate-100">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-4">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Página Inicial</span>
        </Link>
        <Link to="/cadastro" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
          Criar Nova Empresa &rarr;
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto my-auto py-4">
        {/* Logo e Título */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 text-white shadow-lg shadow-emerald-500/20 mb-3">
            <Zap className="h-6 w-6" />
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white md:text-3xl">
            Recebe<span className="text-emerald-400">Ai</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Painel de Acesso Seguro Multi-empresa
          </p>
        </div>

        {/* Card de Login */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
          {/* Seletor de Tipo de Acesso */}
          <div className="flex rounded-xl bg-slate-950/70 p-1 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setTipoLogin("empresa");
                setEmail("");
                setPassword("");
                setErro("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tipoLogin === "empresa"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Minha Empresa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTipoLogin("admin");
                setEmail("admin@recebeai.com.br");
                setPassword("admin123");
                setErro("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tipoLogin === "admin"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Master Admin</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 p-3.5 border border-red-500/20 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{erro}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {tipoLogin === "empresa" ? "E-mail da Empresa / Usuário" : "E-mail do Administrador Master"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder={
                    tipoLogin === "empresa"
                      ? "financeiro@suaempresa.com.br"
                      : "admin@recebeai.com.br"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Senha
                </label>
                <span className="text-[11px] text-slate-400 hover:text-emerald-400 cursor-pointer">
                  Esqueceu a senha?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white shadow-md transition-all ${
                tipoLogin === "empresa"
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                  : "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
              }`}
            >
              <span>{carregando ? "Autenticando..." : "Entrar no Painel da Empresa"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Não tem conta? Cadastrar */}
          <div className="mt-5 text-center pt-4 border-t border-slate-800">
            <span className="text-xs text-slate-400">Sua empresa ainda não tem cadastro? </span>
            <Link
              to="/cadastro"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline inline-flex items-center gap-1"
            >
              Cadastrar Empresa Agora
            </Link>
          </div>

          {/* Divisor Demo */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative bg-slate-900 px-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Acesso Rápido de Teste
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleEntrarComoDemo("cliente")}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-medium transition-all"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Demo Empresa</span>
            </button>
            <button
              type="button"
              onClick={() => handleEntrarComoDemo("admin")}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-medium transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Master</span>
            </button>
          </div>

          {/* Aviso de Isolamento */}
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-slate-950/60 p-3 text-[11px] text-slate-400 border border-slate-800/60">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Isolamento Multi-empresa:</strong> Os dados, clientes e títulos da sua empresa são confidenciais e protegidos por Row Level Security (RLS).
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-500 py-3">
        © {new Date().getFullYear()} RecebeAi. Todos os direitos reservados.
      </div>
    </div>
  );
}
