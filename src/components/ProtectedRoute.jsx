import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  // 1. Enquanto carrega a sessão do Supabase, exibe o estado de carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  // 2. Se não houver usuário logado, redireciona para a tela de login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Se a rota exigir permissão de Admin/Master e o usuário não for admin, redireciona para o dashboard
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Acesso permitido
  return children;
}
