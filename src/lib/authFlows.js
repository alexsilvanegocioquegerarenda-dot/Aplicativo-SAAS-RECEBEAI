function failure(error, fallbackMessage) {
  return {
    success: false,
    error,
    message: error?.message || fallbackMessage,
  };
}

export function getInitialAuthState() {
  return { user: null, loadingAuth: true };
}

export function getProtectedRouteDecision({
  loadingAuth,
  user,
  requireAdmin = false,
  isAdmin = false,
  subscriptionStatus = "active",
  pathname = "",
}) {
  if (loadingAuth) return "loading";
  if (!user) return "login";
  if (requireAdmin && !isAdmin) return "forbidden";
  if (
    subscriptionStatus !== "active" &&
    pathname !== "/planos" &&
    pathname !== "/configuracoes" &&
    pathname !== "/admin/pagamentos"
  ) return "billing";
  return "allow";
}

export async function loadCurrentSupabaseUser(auth, resolveProfile) {
  try {
    const { data: sessionData, error: sessionError } = await auth.getSession();
    if (sessionError) return failure(sessionError, "Não foi possível validar a sessão.");
    if (!sessionData?.session) return { success: true, user: null };

    const { data: userData, error: userError } = await auth.getUser();
    if (userError || !userData?.user) {
      return failure(userError || new Error("A sessão Supabase não possui um usuário válido."), "Sessão inválida.");
    }

    const user = await resolveProfile(userData.user);
    if (!user) return failure(new Error("Conta sem empresa vinculada no Supabase."), "Conta sem empresa vinculada.");
    return { success: true, user };
  } catch (error) {
    return failure(error, "Não foi possível validar a sessão.");
  }
}

export async function signInWithSupabase(auth, email, password, resolveProfile) {
  try {
    const { data, error } = await auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return failure(error, "Não foi possível autenticar no Supabase.");
    if (!data?.session) {
      return failure(new Error("O Supabase não criou uma sessão autenticada."), "Sessão Supabase ausente.");
    }

    const { data: verifiedData, error: verifiedError } = await auth.getUser();
    if (verifiedError || !verifiedData?.user) {
      return failure(verifiedError || new Error("O Supabase não confirmou o usuário."), "Não foi possível validar o usuário.");
    }

    const user = await resolveProfile(verifiedData.user);
    if (!user) return failure(new Error("Conta sem empresa vinculada no Supabase."), "Conta sem empresa vinculada.");
    return { success: true, user };
  } catch (error) {
    return failure(error, "Não foi possível autenticar no Supabase.");
  }
}

export async function registerWithSupabase(supabase, formData) {
  const email = formData.email.trim().toLowerCase();
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: formData.password,
      options: { data: { nome: formData.nome, empresa: formData.razaoSocial, plano: formData.plano } },
    });

    if (authError) return failure(authError, "Não foi possível criar a conta no Supabase Auth.");
    if (!authData?.user) {
      return failure(new Error("O Supabase não retornou o usuário criado."), "Cadastro não confirmado pelo Supabase.");
    }
    if (!authData.session) {
      return {
        success: false,
        pendingConfirmation: true,
        message: "Confirme seu e-mail para concluir o cadastro. Nenhuma sessão ou empresa foi criada localmente.",
      };
    }

    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .insert({
        user_id: authData.user.id,
        razao_social: formData.razaoSocial,
        cnpj: formData.cnpj || "",
        telefone: formData.telefone || "",
        email,
        plano: formData.plano,
        limite_titulos: formData.plano === "enterprise" ? 999999 : formData.plano === "profissional" ? 2000 : 300,
      })
      .select("id, razao_social, cnpj, telefone, plano, subscription_status")
      .single();

    if (empresaError || !empresa?.id) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (e) {}
      return failure(empresaError || new Error("O Supabase não confirmou a empresa criada."), "Não foi possível criar a empresa.");
    }

    const { data: verifiedData, error: verifiedError } = await supabase.auth.getUser();
    if (verifiedError || !verifiedData?.user) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (e) {}
      return failure(verifiedError || new Error("A sessão após cadastro não foi validada."), "Não foi possível validar a sessão criada.");
    }

    return {
      success: true,
      user: {
        id: verifiedData.user.id,
        email: verifiedData.user.email,
        nome: formData.nome,
        role: "cliente",
        cargo: "Diretor(a) / Gestor(a)",
        empresa_id: empresa.id,
        empresa_nome: empresa.razao_social,
        cnpj: empresa.cnpj || "",
        telefone: empresa.telefone || "",
        plano: empresa.plano || formData.plano,
        subscription_status: empresa.subscription_status || "pending",
      },
    };
  } catch (error) {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (e) {}
    return failure(error, "Não foi possível concluir o cadastro no Supabase.");
  }
}

export async function signOutFromSupabase(auth, clearLocalState) {
  let error = null;
  try {
    const result = await auth.signOut();
    if (result?.error) error = result.error;
  } catch (signOutError) {
    error = signOutError;
  } finally {
    clearLocalState();
  }
  return error ? failure(error, "Não foi possível encerrar a sessão Supabase.") : { success: true };
}

export async function resolveAuthenticatedProfile(supabase, authUser) {
  if (!authUser?.id) throw new Error("Usuário Supabase inválido.");

  const { data: empresa, error } = await supabase
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