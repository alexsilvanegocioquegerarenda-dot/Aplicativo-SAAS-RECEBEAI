import { createClient } from "@supabase/supabase-js";

const MASTER_ADMIN_EMAIL = "financeiro.saasrecebeai@gmail.com";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findMasterUser() {
  const matches = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(`Não foi possível pesquisar usuários: ${error.message}`);

    matches.push(
      ...data.users.filter(
        (user) => user.email?.trim().toLowerCase() === MASTER_ADMIN_EMAIL
      )
    );

    if (data.users.length < 1000) break;
  }

  if (matches.length !== 1) {
    throw new Error(
      matches.length === 0
        ? `Não foi encontrado usuário para ${MASTER_ADMIN_EMAIL}. Nenhuma alteração foi feita.`
        : `Foram encontradas ${matches.length} contas para ${MASTER_ADMIN_EMAIL}. Nenhuma alteração foi feita.`
    );
  }

  return matches[0];
}

const user = await findMasterUser();
if (!user.email_confirmed_at) {
  throw new Error(
    `A conta ${MASTER_ADMIN_EMAIL} ainda não está confirmada. Confirme o e-mail e execute novamente.`
  );
}

if (user.app_metadata?.role !== "admin") {
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      role: "admin",
    },
  });
  if (error) throw new Error(`Não foi possível atribuir o papel Master: ${error.message}`);
}

const { data: verified, error: verifyError } =
  await supabase.auth.admin.getUserById(user.id);
if (verifyError) {
  throw new Error(`O papel foi atualizado, mas não foi possível verificá-lo: ${verifyError.message}`);
}
if (
  verified.user.email?.trim().toLowerCase() !== MASTER_ADMIN_EMAIL ||
  verified.user.app_metadata?.role !== "admin"
) {
  throw new Error("A verificação final do usuário Master não passou.");
}

console.log(`Usuário Master confirmado: ${verified.user.email}`);
