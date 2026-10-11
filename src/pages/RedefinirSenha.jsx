import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import {
  Zap,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound
} from "lucide-react";

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [temSessao, setTemSessao] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initRecovery() {
      try {
        // 1. Verificar se há código PKCE na URL (?code=...)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session && mounted) {
            setTemSessao(true);
            setVerificando(false);
            return;
          }
        }

        // 2. Verificar se há tokens ou erros no hash (#access_token=...&refresh_token=...)
        const hash = window.location.hash.substring(1);
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const errorDesc = hashParams.get("error_description");
          if (errorDesc && mounted) {
            setErro(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
          }
          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!error && data?.session && mounted) {
              setTemSessao(true);
              setVerificando(false);
              return;
            }
          }
        }

        // 3. Verificar sessão ativa já existente
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          setTemSessao(true);
          setVerificando(false);
          return;
        }

        // 4. Aguardar caso o SDK do Supabase esteja processando o evento em segundo plano
        setTimeout(async () => {
          if (!mounted) return;
          const { data: delayedSession } = await supabase.auth.getSession();
          if (delayedSession?.session) {
            setTemSessao(true);
          }
          setVerificando(false);
        }, 1200);
      } catch (err) {
        console.error("Erro na validação do link de recuperação:", err);
        if (mounted) setVerificando(false);
      }
    }

    initRecovery();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        if (mounted) {
          setTemSessao(true);
          setVerificando(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!password || password.length < 6) {
      setErro("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErro("As senhas não coincidem. Digite a mesma senha em ambos os campos.");
      return;
    }

    setCarregando(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErro(error.message || "Não foi possível atualizar a senha. O link pode ter expirado.");
        return;
      }

      setSucesso(true);
      setTimeout(() => {
        const userEmail = data.user?.email?.toLowerCase();
        if (userEmail === "financeiro.saasrecebeai@gmail.com") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }, 2500);
    } catch (err) {
      setErro(err.message || "Ocorreu um erro ao redefinir a senha.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 sm:p-6 text-slate-100">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-4">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o Login</span>
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto my-auto py-4">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 text-white shadow-lg shadow-emerald-500/20 mb-3">
            <Zap className="h-6 w-6" />
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white md:text-3xl">
            Redefinir <span className="text-emerald-400">Senha</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Crie uma nova senha segura para acessar sua conta RecebeAi
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
          {sucesso ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Senha alterada com sucesso!</h2>
              <p className="text-xs text-slate-300">
                Sua senha foi redefinida com segurança. Redirecionando para o sistema...
              </p>
            </div>
          ) : verificando ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Validando link de recuperação...
            </div>
          ) : !temSessao ? (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20 text-xs text-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong className="block text-white mb-1">Link expirado ou não identificado</strong>
                  <span>Para redefinir sua senha, solicite um novo link de recuperação informando seu e-mail na tela de login.</span>
                </div>
              </div>
              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-bold text-white transition-all shadow-md shadow-emerald-600/30"
              >
                <span>Ir para a Tela de Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 p-3.5 border border-red-500/20 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{erro}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Mínimo de 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition-all"
              >
                <span>{carregando ? "Salvando..." : "Salvar Nova Senha e Acessar"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-slate-950/60 p-3 text-[11px] text-slate-400 border border-slate-800/60">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Sua nova senha será criptografada e armazenada de forma segura com hash SHA-256 no Supabase Auth.
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
