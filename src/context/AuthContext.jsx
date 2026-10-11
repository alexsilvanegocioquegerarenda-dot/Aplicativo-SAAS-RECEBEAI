import React from "react";
import { supabase, isSupabaseConfigured } from "@/api/supabaseClient";
import { base44, clearDemoData, disableDemoMode } from "@/api/base44Client";
import {
  MASTER_ADMIN_EMAIL,
  resolveAuthenticatedProfile,
  signInWithSupabase,
  registerWithSupabase,
  signOutFromSupabase,
  loadCurrentSupabaseUser
} from "@/lib/authFlows";

export { MASTER_ADMIN_EMAIL, resolveAuthenticatedProfile };

export const AuthContext = React.createContext(null);

const AUTH_STORAGE_KEY = "recebeai_auth_user";

function clearDemoUserStorage() {
  try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch (e) {}
}

function failure(error, fallbackMessage) {
  return {
    success: false,
    error,
    message: error?.message || fallbackMessage,
  };
}

export const DEFAULT_USERS = {
  admin: {
    id: "user-admin-master",
    nome: "Alexandre Silva",
    email: "financeiro.saasrecebeai@gmail.com",
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
    role: "cliente",
    cargo: "Gestora Financeira",
    empresa_id: "emp-demo-techsolutions",
    empresa_nome: "TechSolutions Informática Ltda",
    cnpj: "34.123.456/0001-89",
    plano: "profissional",
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  });
  const [loadingAuth, setLoadingAuth] = React.useState(() => {
    try {
      return !localStorage.getItem(AUTH_STORAGE_KEY);
    } catch (e) {
      return true;
    }
  });
  const [authError, setAuthError] = React.useState("");
  const [demoSession, setDemoSession] = React.useState(false);
  const authModeRef = React.useRef("initializing");
  const authRequestRef = React.useRef(0);

  const resolveProfile = (authUser) => resolveAuthenticatedProfile(supabase, authUser);

  React.useEffect(() => {
    let active = true;

    const clearAuthenticatedUser = () => {
      authRequestRef.current += 1;
      clearDemoUserStorage();
      setUser(null);
      setDemoSession(false);
      setLoadingAuth(false);
    };

    const syncCurrentSession = async () => {
      const requestId = ++authRequestRef.current;
      try {
        const result = await loadCurrentSupabaseUser(supabase.auth, resolveProfile);
        if (!active || requestId !== authRequestRef.current || authModeRef.current === "demo" || authModeRef.current === "logged_out") return;

        if (result.success && result.user) {
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user));
          } catch (e) {}
          setUser(result.user);
          setDemoSession(false);
          authModeRef.current = "supabase";
          setAuthError("");
        } else {
          // Se for o master logado, limpa erro
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user?.email?.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
            const profile = await resolveProfile(userData.user);
            try {
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
            } catch (e) {}
            setUser(profile);
            setDemoSession(false);
            setAuthError("");
          } else {
            clearDemoUserStorage();
            setUser(null);
            authModeRef.current = "anonymous";
            setAuthError(result.message || "");
          }
        }
      } catch (err) {
        if (active && requestId === authRequestRef.current) {
          clearDemoUserStorage();
          setUser(null);
          setAuthError(err?.message || "Erro ao carregar perfil.");
        }
      } finally {
        if (active && requestId === authRequestRef.current) {
          setLoadingAuth(false);
        }
      }
    };

    if (!isSupabaseConfigured) {
      authModeRef.current = "anonymous";
      clearDemoUserStorage();
      setUser(null);
      setLoadingAuth(false);
      setAuthError("Supabase não está configurado.");
    } else {
      disableDemoMode();
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

  const login = async (email, password) => {
    disableDemoMode();
    clearDemoUserStorage();
    setUser(null);
    setDemoSession(false);
    authRequestRef.current += 1;
    setAuthError("");
    setLoadingAuth(true);
    authModeRef.current = "authenticating";

    try { clearDemoData(); } catch {}

    if (!isSupabaseConfigured) {
      const result = { success: false, message: "Supabase não está configurado." };
      setAuthError(result.message);
      setLoadingAuth(false);
      return result;
    }

    const result = await signInWithSupabase(supabase.auth, email, password, resolveProfile);
    if (!result.success) {
      try { await supabase.auth.signOut({ scope: "local" }); } catch {}
      authRequestRef.current += 1;
      setUser(null);
      setAuthError(result.message);
      setLoadingAuth(false);
      authModeRef.current = "anonymous";
      return result;
    }

    authRequestRef.current += 1;
    authModeRef.current = "supabase";
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user));
    } catch (e) {}
    setUser(result.user);
    setDemoSession(false);
    setAuthError("");
    setLoadingAuth(false);
    return result;
  };

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

    try { clearDemoData(); } catch {}

    if (!isSupabaseConfigured) {
      const result = { success: false, message: "Supabase não está configurado." };
      setAuthError(result.message);
      setLoadingAuth(false);
      return result;
    }

    const result = await registerWithSupabase(supabase, {
      nome,
      email,
      password,
      razaoSocial,
      cnpj,
      telefone,
      plano,
    });

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
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user));
    } catch (e) {}
    setUser(result.user);
    setDemoSession(false);
    setAuthError("");
    setLoadingAuth(false);
    return result;
  };

  const logout = async () => {
    authModeRef.current = "logged_out";
    authRequestRef.current += 1;
    setUser(null);
    setDemoSession(false);
    setLoadingAuth(false);
    clearDemoUserStorage();
    return signOutFromSupabase(supabase.auth, () => {
      setUser(null);
      setDemoSession(false);
      clearDemoUserStorage();
    });
  };

  const alternarPerfilDemonstracao = async (tipo) => {
    authModeRef.current = "demo";
    authRequestRef.current += 1;
    try { await supabase.auth.signOut({ scope: "local" }); } catch {}
    const demoUser = tipo === "admin" ? DEFAULT_USERS.admin : DEFAULT_USERS.cliente;
    try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser)); } catch {}
    base44.resetDemoData();
    setUser(demoUser);
    setDemoSession(true);
    setAuthError("");
    setLoadingAuth(false);
    return { success: true, user: demoUser };
  };

  const refreshUserProfile = async () => {
    if (!isSupabaseConfigured) return null;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return null;
    const updatedProfile = await resolveProfile(userData.user);
    setUser(updatedProfile);
    return updatedProfile;
  };

  const isAdmin = demoSession
    ? user?.id === DEFAULT_USERS.admin.id
    : user?.role === "admin" || user?.email?.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

  const currentEmpresaId = user?.empresa_id || null;

  // Se o usuário for admin, força authError vazio para sumir com o badge em qualquer componente
  const effectiveAuthError = isAdmin ? "" : authError;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        demoSession,
        currentEmpresaId,
        loading: loadingAuth,
        loadingAuth,
        authError: effectiveAuthError,
        clearAuthError: () => setAuthError(""),
        login,
        register,
        logout,
        refreshUserProfile,
        alternarPerfilDemonstracao,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
