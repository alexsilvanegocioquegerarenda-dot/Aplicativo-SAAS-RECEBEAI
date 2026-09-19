import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/api/supabaseClient";

const AuthContext = createContext({});

const AUTH_STORAGE_KEY = "recebeai_auth_user";
const TENANTS_STORAGE_KEY = "recebeai_tenants_registry";

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

// Helper para obter lista de empresas cadastradas localmente (modo offline / fallback)
function getLocalTenants() {
  try {
    const raw = localStorage.getItem(TENANTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalTenant(tenant) {
  try {
    const tenants = getLocalTenants();
    const filtered = tenants.filter((t) => t.email !== tenant.email);
    filtered.push(tenant);
    localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn("Erro ao salvar tenant:", e);
  }
}

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
    // Inicializa como null para novos visitantes na Landing Page
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  // Login de Cliente ou Administrador
  const login = async (email, password) => {
    setLoading(true);
    try {
      const emailClean = email.trim().toLowerCase();

      // 1. Se Supabase estiver conectado, tenta autenticar via Supabase Auth
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: emailClean,
            password,
          });

          if (!error && data?.user) {
            const isAdminEmail =
              emailClean === "admin@recebeai.com.br" ||
              emailClean.startsWith("admin@");

            // Busca os dados da empresa vinculada ao user_id
            let empresaData = null;
            try {
              const { data: emp } = await supabase
                .from("empresas")
                .select("*")
                .eq("user_id", data.user.id)
                .maybeSingle();
              empresaData = emp;
            } catch (err) {
              console.warn("Aviso ao buscar empresa no Supabase:", err);
            }

            const authUser = {
              id: data.user.id,
              email: data.user.email,
              nome:
                data.user.user_metadata?.nome ||
                (isAdminEmail ? "Administrador Master" : "Cliente RecebeAi"),
              role: isAdminEmail ? "admin" : "cliente",
              empresa_id: empresaData?.id || `emp-${data.user.id.slice(0, 8)}`,
              empresa_nome:
                empresaData?.razao_social ||
                data.user.user_metadata?.empresa ||
                "Minha Empresa",
              cnpj: empresaData?.cnpj || "",
              telefone: empresaData?.telefone || "",
              plano: empresaData?.plano || "profissional",
            };

            setUser(authUser);
            return { success: true, user: authUser };
          }
        } catch (supabaseErr) {
          console.warn("Falha no login Supabase, utilizando fallback multi-empresa:", supabaseErr);
        }
      }

      // 2. Fallback: Checa se é o Administrador Master pré-configurado
      if (emailClean === "admin@recebeai.com.br" || emailClean === "admin") {
        const adminUser = { ...DEFAULT_USERS.admin, email: emailClean };
        setUser(adminUser);
        return { success: true, user: adminUser };
      }

      // 3. Fallback: Checa se é a empresa cliente demo (TechSolutions)
      if (
        emailClean === "financeiro@techsolutions.com.br" ||
        emailClean === "cliente@recebeai.com.br" ||
        emailClean === "cliente"
      ) {
        setUser(DEFAULT_USERS.cliente);
        return { success: true, user: DEFAULT_USERS.cliente };
      }

      // 4. Fallback: Busca entre as empresas cadastradas localmente
      const localTenants = getLocalTenants();
      const existingTenant = localTenants.find((t) => t.email === emailClean);

      if (existingTenant) {
        setUser(existingTenant);
        return { success: true, user: existingTenant };
      }

      // 5. Se digitou qualquer outro e-mail válido, cria dinamicamente uma sessão de empresa isolada
      const novaEmpresaId = `emp-${Date.now().toString(36)}`;
      const nomeFormatado = emailClean.split("@")[0].replace(/[._-]/g, " ").toUpperCase();
      const novoClienteUser = {
        id: `usr-${Date.now().toString(36)}`,
        nome: nomeFormatado,
        email: emailClean,
        role: "cliente",
        cargo: "Gestor(a) Financeiro",
        empresa_id: novaEmpresaId,
        empresa_nome: `Empresa ${nomeFormatado}`,
        cnpj: "",
        telefone: "",
        plano: "essencial",
      };

      saveLocalTenant(novoClienteUser);
      setUser(novoClienteUser);
      return { success: true, user: novoClienteUser };
    } finally {
      setLoading(false);
    }
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
    setLoading(true);
    try {
      const emailClean = email.trim().toLowerCase();

      // 1. Se Supabase estiver conectado, cria no Auth e na tabela public.empresas
      if (isSupabaseConfigured) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: emailClean,
            password,
            options: {
              data: {
                nome,
                empresa: razaoSocial,
                plano,
              },
            },
          });

          if (authError) {
            console.warn("Erro no signUp do Supabase:", authError);
          } else if (authData?.user) {
            // Cria a empresa vinculada ao user_id no Supabase
            let createdEmpresaId = null;
            try {
              const { data: empRow, error: empErr } = await supabase
                .from("empresas")
                .insert({
                  user_id: authData.user.id,
                  razao_social: razaoSocial,
                  cnpj,
                  telefone,
                  email: emailClean,
                  plano,
                  limite_titulos: plano === "enterprise" ? 999999 : plano === "profissional" ? 2000 : 300,
                })
                .select("id")
                .single();

              if (!empErr && empRow) {
                createdEmpresaId = empRow.id;
              }
            } catch (errEmp) {
              console.warn("Aviso ao inserir em public.empresas:", errEmp);
            }

            const novoUser = {
              id: authData.user.id,
              email: emailClean,
              nome,
              role: "cliente",
              cargo: "Diretor(a) / Gestor(a)",
              empresa_id: createdEmpresaId || `emp-${authData.user.id.slice(0, 8)}`,
              empresa_nome: razaoSocial,
              cnpj,
              telefone,
              plano,
            };

            setUser(novoUser);
            saveLocalTenant(novoUser);
            return { success: true, user: novoUser };
          }
        } catch (supabaseErr) {
          console.warn("Fallback de registro local após erro no Supabase:", supabaseErr);
        }
      }

      // 2. Fallback de isolamento local garantido
      const novoTenantId = `emp-${Date.now().toString(36)}`;
      const novoUser = {
        id: `usr-${Date.now().toString(36)}`,
        nome,
        email: emailClean,
        role: "cliente",
        cargo: "Diretor(a) / Gestor(a)",
        empresa_id: novoTenantId,
        empresa_nome: razaoSocial,
        cnpj,
        telefone,
        plano,
      };

      saveLocalTenant(novoUser);
      setUser(novoUser);
      return { success: true, user: novoUser };
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
  const currentEmpresaId = user?.empresa_id || "emp-demo-techsolutions";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        currentEmpresaId,
        loading,
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
