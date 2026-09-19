import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Kanban,
  FileSpreadsheet,
  Clock,
  Activity,
  MessageSquareText,
  Sliders,
  FileText,
  HeartHandshake,
  Sparkles,
  TrendingUp,
  Settings,
  CreditCard,
  Menu,
  X,
  ShieldCheck,
  Zap,
  ExternalLink,
  ChevronRight,
  Database,
  Crown,
  LogOut,
  User
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/context/AuthContext";

export default function Layout({ children }) {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [planoAtual, setPlanoAtual] = useState("pro");
  const [limiteTitulos, setLimiteTitulos] = useState(300);

  useEffect(() => {
    async function carregarPlano() {
      const cfg = await base44.entities.Configuracao.get();
      if (cfg) {
        if (cfg.plano_atual) setPlanoAtual(cfg.plano_atual);
        if (cfg.limite_titulos) setLimiteTitulos(cfg.limite_titulos);
      }
    }
    carregarPlano();
  }, [location.pathname]);

  // Checklist de 15 páginas do SaaS RecebeAi
  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Clientes", path: "/clientes", icon: Users },
    { label: "Recebíveis", path: "/recebiveis", icon: Receipt },
    { label: "Kanban", path: "/kanban", icon: Kanban },
    { label: "Importações", path: "/importacoes", icon: FileSpreadsheet },
    { label: "Aging", path: "/aging", icon: Clock },
    { label: "DSO", path: "/dso", icon: Activity },
    { label: "Cobranças", path: "/cobrancas", icon: MessageSquareText },
    { label: "Régua", path: "/regua", icon: Sliders },
    { label: "Templates", path: "/templates", icon: FileText },
    { label: "Promessas", path: "/promessas", icon: HeartHandshake },
    { label: "IA Financeira", path: "/ia", icon: Sparkles, badge: "IA" },
    { label: "Recuperação", path: "/recuperacao", icon: TrendingUp },
    { label: "Configurações", path: "/configuracoes", icon: Settings },
    { label: "Planos", path: "/planos", icon: CreditCard },
  ];

  const isActive = (path) => {
    if (path === "/dashboard" && (location.pathname === "/" || location.pathname === "/dashboard")) {
      return true;
    }
    if (path === "/recuperacao" && (location.pathname === "/recuperacao" || location.pathname === "/relatorios")) {
      return true;
    }
    return location.pathname.startsWith(path) && path !== "/";
  };

  const nomesPlanos = {
    starter: "Plano Starter",
    pro: "Plano Profissional",
    enterprise: "Plano Enterprise",
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        {/* Logo & Brand */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-heading text-lg font-bold tracking-tight text-slate-900">Recebe<span className="text-blue-600">Ai</span></span>
              <span className="ml-1.5 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">SaaS</span>
            </div>
          </Link>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Item Exclusivo para Administrador Master */}
          {isAdmin && (
            <div className="mb-5">
              <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5" />
                <span>Área Master</span>
              </div>
              <Link
                to="/admin"
                className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all border ${
                  location.pathname === "/admin"
                    ? "bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/30"
                    : "bg-amber-50/80 text-amber-900 border-amber-200/80 hover:bg-amber-100"
                }`}
              >
                <Crown className={`h-4 w-4 ${location.pathname === "/admin" ? "text-white" : "text-amber-600"}`} />
                <span className="flex-1">Painel Admin Master</span>
                <span className="rounded-full bg-white/30 px-1.5 py-0.2 text-[9px] uppercase">Total</span>
              </Link>
            </div>
          )}

          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu do Sistema
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 transition-colors ${active ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      active ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                </Link>
              );
            })}
          </nav>

          {/* Banner de status do plano comercial */}
          <div className="mt-8 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/70 to-indigo-50/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>{nomesPlanos[planoAtual] || "Plano Ativo"}</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Automação de WhatsApp e réguas ativadas.
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1 font-medium">
                <span>Capacidade</span>
                <span>8 de {limiteTitulos > 1000 ? "Ilimitados" : `${limiteTitulos} títulos`}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-blue-200/60 overflow-hidden">
                <div className="h-full w-[8%] rounded-full bg-blue-600"></div>
              </div>
            </div>
            <Link
              to="/configuracoes"
              className="mt-3.5 block text-center rounded-lg bg-white border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-sm"
            >
              Gerenciar Assinatura
            </Link>
          </div>
        </div>

        {/* Footer Sidebar com Usuário e Logout */}
        <div className="border-t border-slate-100 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isAdmin
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}>
                {isAdmin ? <Crown className="h-4 w-4 text-amber-600" /> : <User className="h-4 w-4 text-blue-600" />}
              </div>
              <div className="truncate">
                <div className="truncate text-xs font-bold text-slate-900">{user?.nome || "Usuário"}</div>
                <div className="truncate text-[11px] text-slate-400">
                  {isAdmin ? "Super Administrador" : (user?.email || "Cliente")}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sair da conta"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex w-72 flex-col bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="font-heading text-lg font-bold text-slate-900">RecebeAi</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-4 space-y-1">
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-amber-500 text-white px-3.5 py-2.5 text-sm font-bold mb-3 shadow-sm"
                >
                  <Crown className="h-4 w-4" />
                  <span>Painel Admin Master</span>
                </Link>
              )}

              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        active ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-600 truncate">{user?.nome || "Usuário"}</div>
              <button onClick={logout} className="text-xs font-semibold text-red-600 hover:underline">
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 md:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Módulo Financeiro</span>
              {isAdmin && (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  Modo Super Administrador
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {base44.isSupabaseConnected ? (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                <Database className="h-3 w-3" />
                <span>Supabase Conectado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200" title="Utilizando banco de dados local. Conecte ao Supabase em Configurações.">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Modo Local / Demonstração</span>
              </div>
            )}

            <Link
              to="/recebiveis"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-colors"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Novo Título</span>
            </Link>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
