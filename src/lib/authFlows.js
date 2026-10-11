export async function resolveAuthenticatedProfile(supabase, authUser) {
  if (!authUser?.id) throw new Error("Usuário Supabase inválido.");

  const emailUser = authUser.email?.trim().toLowerCase();
  const userRole = authUser.app_metadata?.role || authUser.user_metadata?.role;

  // 1. SE FOR MASTER / ADMIN: Retorna imediatamente sem consultar a tabela "empresas"
  if (
    emailUser === MASTER_ADMIN_EMAIL ||
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

  // 2. APENAS PARA CLIENTES: Executa a busca na tabela "empresas"
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
