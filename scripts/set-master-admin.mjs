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

  if (matches.length === 0) {
    const initialPassword = process.env.MASTER_PASSWORD || process.argv[2];
    if (initialPassword) {
      console.log(`Criando usuário Master ${MASTER_ADMIN_EMAIL}...`);
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: MASTER_ADMIN_EMAIL,
        password: initialPassword,
        email_confirm: true,
        app_metadata: { role: "admin" },
        user_metadata: { nome: "Administrador Master" },
      });
      if (createError) throw new Error(`Não foi possível criar a conta Master: ${createError.message}`);
      return created.user;
    }
    throw new Error(
      `Não foi encontrado usuário para ${MASTER_ADMIN_EMAIL}. Nenhuma alteração foi feita. Para criar a conta automaticamente, passe a senha desejada como argumento: node scripts/set-master-admin.mjs [senha]`
    );
  }

  if (matches.length > 1) {
    throw new Error(`Foram encontradas ${matches.length} contas para ${MASTER_ADMIN_EMAIL}. Nenhuma alteração foi feita.`);
  }

  return matches[0];
}

const user = await findMasterUser();

const updates = {
  app_metadata: {
    ...user.app_metadata,
    role: "admin",
  },
};

if (!user.email_confirmed_at) {
  console.log(`Confirmando e-mail da conta ${MASTER_ADMIN_EMAIL}...`);
  updates.email_confirm = true;
}

const optionalPassword = process.env.MASTER_PASSWORD || process.argv[2];
if (optionalPassword) {
  updates.password = optionalPassword;
}

const { error } = await supabase.auth.admin.updateUserById(user.id, updates);
if (error) throw new Error(`Não foi possível atualizar o usuário Master: ${error.message}`);

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
