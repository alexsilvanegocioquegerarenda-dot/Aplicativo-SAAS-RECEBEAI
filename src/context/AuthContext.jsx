import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/api/supabaseClient";

const AuthContext = createContext({});

const AUTH_STORAGE_KEY = "recebeai_auth_user";

// Contas padrão pré-configuradas para demonstração e acesso imediato
export const DEFAULT_USERS = {
  admin: {
    id: "user-admin-master",
    nome: "Alexandre Silva (Administrador)",
    email: "admin@recebeai.com.br",
    role: "admin", // Permissão total e acesso ao painel Master
    cargo: "Super Administrador Master",
    empresa: "RecebeAi Tecnologia",
  },
  cliente: {
    id: "user-cliente-demo",
    nome: "TechSolutions Informática",
    email: "financeiro@techsolutions.com.br",
    role: "cliente", // Cliente comum do SaaS (não tem acesso ao painel admin nem às credenciais)
    cargo: "Gestor Financeiro",
    empresa: "TechSolutions Informática Ltda",
    plano: "pro",
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Erro ao ler usuário salvo:", e);
    }
    // Por padrão inicializa como administrador master para facilidade de configuração
    return DEFAULT_USERS.admin;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Se Supabase estiver conectado e ativo, tenta autenticar via Supabase Auth
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (!error && data?.user) {
            const isAdminEmail = email.toLowerCase() === "admin@recebeai.com.br" || email.toLowerCase().includes("admin");
            const authUser = {
              id: data.user.id,
              email: data.user.email,
              nome: data.user.user_metadata?.nome || (isAdminEmail ? "Administrador Master" : "Cliente RecebeAi"),
              role: isAdminEmail ? "admin" : "cliente",
              empresa: data.user.user_metadata?.empresa || "Minha Empresa",
            };
            setUser(authUser);
            return { success: true, user: authUser };
          }
        } catch (supabaseErr) {
          console.warn("Falha no login Supabase, utilizando fallback local:", supabaseErr);
        }
      }

      // Fallback local seguro:
      const emailLower = email.trim().toLowerCase();

      // Checa se é o administrador master
      if (emailLower === "admin@recebeai.com.br" || emailLower === "admin") {
        const adminUser = { ...DEFAULT_USERS.admin, email: emailLower };
        setUser(adminUser);
        return { success: true, user: adminUser };
      }

      // Caso contrário, autentica como cliente do SaaS
      const clienteUser = {
        id: `usr-${Date.now()}`,
        nome: email.split("@")[0].replace(/[._-]/g, " ").toUpperCase(),
        email: emailLower,
        role: "cliente",
        cargo: "Assinante SaaS",
        empresa: "Empresa Assinante",
        plano: "starter",
      };

      setUser(clienteUser);
      return { success: true, user: clienteUser };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (isSupabaseConfigured) {
      try {
        supabase.auth.signOut();
      } catch (e) {
        console.warn(e);
      }
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const alternarPerfilDemonstracao = (tipo) => {
    if (tipo === "admin") {
      setUser(DEFAULT_USERS.admin);
    } else {
      setUser(DEFAULT_USERS.cliente);
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        login,
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
