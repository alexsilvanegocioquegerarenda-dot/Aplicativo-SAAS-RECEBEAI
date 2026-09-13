import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para a tela de login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se a rota for restrita ao Administrador e o usuário for um cliente comum
  if (requireAdmin && !isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="font-heading text-xl font-bold text-slate-900">Acesso Restrito ao Administrador</h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Esta área é de uso exclusivo do administrador master do RecebeAi. Seus clientes e usuários comuns não possuem acesso a esta tela nem às credenciais do sistema.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Meu Painel</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
