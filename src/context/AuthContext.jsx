import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/api/supabaseClient";
import { base44, disableDemoMode } from "@/api/base44Client";
import { getInitialAuthState, loadCurrentSupabaseUser, registerWithSupabase, resolveAuthenticatedProfile, signInWithSupabase, signOutFromSupabase } from "@/lib/authFlows";

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = "recebeai_auth_user";
const INITIAL_AUTH_STATE = getInitialAuthState();

function clearDemoUserStorage() {
  try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch (e) {}
}

// Contas padrão pré-configuradas para demonstração e acesso imediato
export const DEFAULT_USERS = {
  admin: {
    id: "user-admin-master",
    nome: "Alexandre Silva",
    email: "admin@recebeai.com.br",
    role: "admin", // Permissão total e acesso ao painel Master
    cargo: "Super Administrador Master",
    empresa_id: "emp-master-recebeai",
    empresa_nome: "RecebeAi Tecnologia",
    plano: "enterprise",
  },
  cliente: {
    id: "user-cliente-demo",
    nome: "Mariana Souza",
    email: "financeiro@techsolutions.com.br",
    role: "cliente", // Cliente empresa isolado
    cargo: "Gestora Financeira",
    empresa_id: "emp-demo-techsolutions",
    empresa_nome: "TechSolutions Informática Ltda",
    cnpj: "34.123.456/0001-89",
    plano: "profissional",
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(INITIAL_AUTH_STATE.user);
  const [loadingAuth, setLoadingAuth] = useState(INITIAL_AUTH_STATE.loadingAuth);
  const [authError, setAuthError] = useState("");
  const [demoSession, setDemoSession] = useState(false);
  const authModeRef = useRef("initializing");
  const authRequestRef = useRef(0);

  const resolveProfile = (authUser) => resolveAuthenticatedProfile(supabase, authUser);

  useEffect(() => {
    let active = true;

    const clearAuthenticatedUser = () => {
      authRequestRef.current += 1;
      setUser(null);
      setDemoSession(false);
      setLoadingAuth(false);
    };

    const syncCurrentSession = async () => {
      const requestId = ++authRequestRef.current;
      const result = await loadCurrentSupabaseUser(supabase.auth, resolveProfile);
      if (!active || requestId !== authRequestRef.current || authModeRef.current === "demo" || authModeRef.current === "logged_out") return;

      if (result.success) {
        setUser(result.user);
        setDemoSession(false);
        authModeRef.current = result.user ? "supabase" : "anonymous";
        setAuthError("");
      } else {
        setUser(null);
        authModeRef.current = "anonymous";
        setAuthError(result.message);
      }
      setLoadingAuth(false);
    };

    clearDemoUserStorage();
    if (!isSupabaseConfigured) {
      authModeRef.current = "anonymous";
      setUser(null);
      setLoadingAuth(false);
      setAuthError("Supabase não está configurado. O login real está indisponível.");
    } else {
      void syncCurrentSession();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || authModeRef.current === "demo" || authModeRef.current === "logged_out") return;
      if (event === "SIGNED_OUT" || !session) {
        authModeRef.current = "anonymous";
        clearAuthenticatedUser();
        return;
      }
      setTimeout(() => {
        if (active && authModeRef.current !== "demo" && authModeRef.current !== "logged_out") {
          void syncCurrentSession();
        }
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Login de Cliente ou Administrador
  const login = async (email, password) => {
    disableDemoMode();
    clearDemoUserStorage();
    setUser(null);
    setDemoSession(false);
    authRequestRef.current += 1;
    setAuthError("");
    setLoadingAuth(true);
    authModeRef.current = "authenticating";
    if (!isSupabaseConfigured) {
      const result = { success: false, message: "Supabase não está configurado. O login real está indisponível." };
      setUser(null);
      setAuthError(result.message);
      setLoadingAuth(false);
      authModeRef.current = "anonymous";
      return result;
    }

    const result = await signInWithSupabase(supabase.auth, email, password, resolveProfile);
    if (!result.success) {
      try { await supabase.auth.signOut({ scope: "local" }); } catch (e) {}
      authRequestRef.current += 1;
      setUser(null);
      setAuthError(result.message);
      setLoadingAuth(false);
      authModeRef.current = "anonymous";
      return result;
    }

  authRequestRef.current += 1;
    authModeRef.current = "supabase";
    clearDemoUserStorage();
    setUser(result.user);
    setDemoSession(false);
    setAuthError("");
    setLoadingAuth(false);
    return result;
  };

  // Cadastro de Nova Empresa Multi-tenant
  const register = async ({
    nome,
    email,
    password,
    razaoSocial,
    cnpj = "",
    telefone = "",
    plano = "profissional",
  }) => {
    disableDemoMode();
    clearDemoUserStorage();
    setUser(null);
    setDemoSession(false);
    authRequestRef.current += 1;
    setAuthError("");
    setLoadingAuth(true);
    authModeRef.current = "authenticating";
    if (!isSupabaseConfigured) {
      const result = { success: false, message: "Supabase não está configurado. O cadastro real está indisponível." };
      setAuthError(result.message);
      setLoadingAuth(false);
      authModeRef.current = "anonymous";
      return result;
    }

    const result = await registerWithSupabase(supabase, { nome, email, password, razaoSocial, cnpj, telefone, plano });
    if (!result.success) {
      authRequestRef.current += 1;
      setUser(null);
      setAuthError(result.message);
      setLoadingAuth(false);
      authModeRef.current = "anonymous";
      return result;
    }

  authRequestRef.current += 1;
    authModeRef.current = "supabase";
    clearDemoUserStorage();
    setUser(result.user);
    setDemoSession(false);
    setAuthError("");
    setLoadingAuth(false);
    return result;
  };

  const logout = () => {
    authModeRef.current = "logged_out";
    authRequestRef.current += 1;
    setUser(null);
    setDemoSession(false);
    setLoadingAuth(false);
    clearDemoUserStorage();
    return signOutFromSupabase(supabase.auth, () => {
      setUser(null);
      setDemoSession(false);
    }).then((result) => {
      setAuthError(result.success ? "" : `Sessão local encerrada, mas não foi possível confirmar a saída do Supabase: ${result.message}`);
      return result;
    });
  };

  const alternarPerfilDemonstracao = async (tipo) => {
    authModeRef.current = "demo";
    authRequestRef.current += 1;
    try { await supabase.auth.signOut({ scope: "local" }); } catch (e) {}
    const demoUser = tipo === "admin" ? DEFAULT_USERS.admin : DEFAULT_USERS.cliente;
    try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser)); } catch (e) {}
    base44.resetDemoData();
    setUser(demoUser);
    setDemoSession(true);
    setAuthError("");
    setLoadingAuth(false);
    return { success: true, user: demoUser };
  };

  const isAdmin = demoSession && user?.role === "admin";
  const currentEmpresaId = user?.empresa_id || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        currentEmpresaId,
        loading: loadingAuth,
        loadingAuth,
        authError,
        clearAuthError: () => setAuthError(""),
        login,
        register,
        logout,
        alternarPerfilDemonstracao,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
