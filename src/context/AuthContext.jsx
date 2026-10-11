import React from "react";
import { supabase, isSupabaseConfigured } from "@/api/supabaseClient";
import { base44, clearDemoData, disableDemoMode } from "@/api/base44Client";

// Email do Administrador Master
export const MASTER_ADMIN_EMAIL = "financeiro.saasrecebeai@gmail.com";

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

// Resolução de perfil isolada sem dependência de tabelas inexistentes para o Master
export async function resolveAuthenticatedProfile(supabaseClient, authUser) {
  if (!authUser?.id) throw new Error("Usuário Supabase inválido.");

  const emailUser = authUser.email?.trim().toLowerCase();
  const userRole = authUser.app_metadata?.role || authUser.user_metadata?.role;

  // Libera o perfil Master/Admin imediatamente
  if (
    emailUser === MASTER_ADMIN_EMAIL.toLowerCase() ||
    userRole === "admin" ||
    userRole === "master"
  ) {
    return {
      id: authUser.id,
      email: authUser.email,
      nome: authUser.user_metadata?.nome || "Administrador Master",
      role: "admin",
      cargo: "Super Administrador Master",
      empresa_id: "emp-master-recebeai",
      empresa_nome: "RecebeAi Tecnologia",
      plano: "enterprise",
      subscription_status: "active",
    };
  }

  // Fluxo normal de empresas para clientes comuns
  const { data: empresa, error } = await supabaseClient
    .from("empresas")
    .select("id, razao_social, cnpj, telefone, plano, subscription_status")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (error) throw error;
  if (!empresa?.id) throw new Error("Esta conta não possui uma empresa vinculada no Supabase.");

  return {
    id: authUser.id,
    email: authUser.email,
    nome: authUser.user_metadata?.nome || empresa.razao_social,
    role: "cliente",
    cargo: "Gestor(a) Financeiro",
    empresa_id: empresa.id,
    empresa_nome: empresa.razao_social,
    cnpj: empresa.cnpj || "",
    telefone: empresa.telefone || "",
    plano: empresa.plano || "profissional",
    subscription_status: empresa.subscription_status || "active",
  };
}

// Contas padrão de demonstração
export const DEFAULT_USERS = {
  admin: {
    id: "user-admin-master",
    nome: "Alexandre Silva",
    email: "admin@recebeai.com.br",
    role: "admin",
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
  const [user, setUser] = React.useState(null);
  const [loadingAuth, setLoadingAuth] = React.useState(true);
  const [authError, setAuthError] = React.useState("");
  const [demoSession, setDemoSession] = React.useState(false);
  const authModeRef = React.useRef("initializing");
  const authRequestRef = React.useRef(0);

  const resolveProfile = (authUser) => resolveAuthenticatedProfile(supabase, authUser);

  React.useEffect(() => {
    let active = true;

    const clearAuthenticatedUser = () => {
      authRequestRef.current += 1;
      setUser(null);
      setDemoSession(false);
      setLoadingAuth(false);
    };

    const syncCurrentSession = async () => {
      const requestId = ++authRequestRef.current;
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session) {
          if (active && requestId === authRequestRef.current) {
            setUser(null);
            setLoadingAuth(false);
          }
          return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          if (active && requestId === authRequestRef.current) {
            setUser(null);
            setLoadingAuth(false);
          }
          return;
        }

        const profile = await resolveProfile(userData.user);
        if (!active || requestId !== authRequestRef.current) return;

        setUser(profile);
        setDemoSession(false);
        authModeRef.current = "supabase";
        setAuthError("");
      } catch (err) {
        if (active && requestId === authRequestRef.current) {
          setUser(null);
          setAuthError(err?.message || "Erro ao carregar perfil.");
        }
      } finally {
        if (active && requestId === authRequestRef.current) {
          setLoadingAuth(false);
        }
      }
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
      const result = { success: false, message: "Supabase não está configurado. O login real está indisponível." };
      setAuthError(result.message);
      setLoadingAuth(false);
      return result;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data?.session) {
        throw error || new Error("Não foi possível autenticar no Supabase.");
      }

      const { data: verifiedData, error: verifiedError } = await supabase.auth.getUser();
      if (verifiedError || !verifiedData?.user) {
        throw verifiedError || new Error("Não foi possível validar o usuário.");
      }

      const authenticatedProfile = await resolveProfile(verifiedData.user);

      authRequestRef.current += 1;
      authModeRef.current = "supabase";
      clearDemoUserStorage();
      setUser(authenticatedProfile);
      setDemoSession(false);
      setAuthError("");
      setLoadingAuth(false);
      return { success: true, user: authenticatedProfile };
    } catch (err) {
      try { await supabase.auth.signOut({ scope: "local" }); } catch {}
      authRequestRef.current += 1;
      setUser(null);
      const msg = err?.message || "Erro de autenticação.";
      setAuthError(msg);
      setLoadingAuth(false);
      authModeRef.current = "anonymous";
      return failure(err, msg);
    }
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

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { nome, empresa: razaoSocial, plano } },
      });

      if (authError || !authData?.user) throw authError || new Error("Erro no cadastro Auth.");

      if (!authData.session) {
        setLoadingAuth(false);
        return {
          success: false,
          pendingConfirmation: true,
          message: "Confirme seu e-mail para concluir o cadastro.",
        };
      }

      const { data: empresa, error: empresaError } = await supabase
        .from("empresas")
        .insert({
          user_id: authData.user.id,
          razao_social: razaoSocial,
          cnpj,
          telefone,
          email: cleanEmail,
          plano,
          limite_titulos: plano === "enterprise" ? 99999 : plano === "profissional" ? 2000 : 300,
        })
        .select("id, razao_social, cnpj, telefone, plano, subscription_status")
        .single();

      if (empresaError || !empresa?.id) throw empresaError || new Error("Erro ao criar empresa.");

      const newUser = {
        id: authData.user.id,
        email: cleanEmail,
        nome,
        role: "cliente",
        cargo: "Diretor(a) / Gestor(a)",
        empresa_id: empresa.id,
        empresa_nome: empresa.razao_social,
        cnpj: empresa.cnpj || "",
        telefone: empresa.telefone || "",
        plano: empresa.plano || plano,
        subscription_status: empresa.subscription_status || "pending",
      };

      authRequestRef.current += 1;
      authModeRef.current = "supabase";
      clearDemoUserStorage();
      setUser(newUser);
      setDemoSession(false);
      setAuthError("");
      setLoadingAuth(false);
      return { success: true, user: newUser };
    } catch (err) {
      try { await supabase.auth.signOut({ scope: "local" }); } catch {}
      authRequestRef.current += 1;
      setUser(null);
      const msg = err?.message || "Erro no cadastro.";
      setAuthError(msg);
      setLoadingAuth(false);
      authModeRef.current = "anonymous";
      return failure(err, msg);
    }
  };

  const logout = async () => {
    authModeRef.current = "logged_out";
    authRequestRef.current += 1;
    setUser(null);
    setDemoSession(false);
    setLoadingAuth(false);
    clearDemoUserStorage();
    try {
      await supabase.auth.signOut();
      return { success: true };
    } catch (err) {
      return failure(err, "Erro ao encerrar sessão.");
    }
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        demoSession,
        currentEmpresaId,
        loading: loadingAuth,
        loadingAuth,
        authError,
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
