const TABLES = [
  "clientes",
  "recebiveis",
  "cobrancas",
  "promessas",
  "prioridades_cobranca",
  "reguas",
  "importacoes",
  "metas_recuperacao",
  "templates_mensagem",
  "conversas_ia",
];

const RELATIONSHIPS = [
  { name: "recebiveis → clientes", child: "recebiveis", childField: "cliente_id", parent: "clientes", constraint: "recebiveis_cliente_id_fkey", optional: false },
  { name: "cobrancas → clientes", child: "cobrancas", childField: "cliente_id", parent: "clientes", constraint: "cobrancas_cliente_id_fkey", optional: false },
  { name: "cobrancas → recebiveis", child: "cobrancas", childField: "recebivel_id", parent: "recebiveis", constraint: "cobrancas_recebivel_id_fkey", optional: true },
  { name: "promessas → clientes", child: "promessas", childField: "cliente_id", parent: "clientes", constraint: "promessas_cliente_id_fkey", optional: false },
  { name: "promessas → recebiveis", child: "promessas", childField: "recebivel_id", parent: "recebiveis", constraint: "promessas_recebivel_id_fkey", optional: true },
  { name: "prioridades_cobranca → clientes", child: "prioridades_cobranca", childField: "cliente_id", parent: "clientes", constraint: "prioridades_cobranca_cliente_id_fkey", optional: false },
];

const READ_ONLY_TABLES = ["empresas", ...TABLES];
const PAGE_SIZE = 500;
const MAX_ROWS_PER_CHECK = 20000;

function result(status, details = {}) {
  return { status, ...details };
}

async function fetchAllRows(supabaseClient, table, select, configure = () => {}) {
  const rows = [];
  for (let offset = 0; offset < MAX_ROWS_PER_CHECK; offset += PAGE_SIZE) {
    let query = supabaseClient.from(table).select(select);
    query = configure(query) || query;
    const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = data || [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return { rows, complete: true };
  }
  return { rows, complete: false };
}

export async function runTenantDiagnostic({ supabaseClient, demoMode = false, otherCompanyId = "" } = {}) {
  const report = {
    session: result("NÃO FOI POSSÍVEL TESTAR"),
    companies: result("NÃO FOI POSSÍVEL TESTAR"),
    counts: [],
    tenantIntegrity: [],
    relationships: [],
    otherCompanyIsolation: result("NÃO FOI POSSÍVEL TESTAR", { reason: "Informe o ID de uma empresa de teste diferente para consultar sua visibilidade nesta sessão." }),
    limitations: [
      "Contagens zero representam zero linhas visíveis à sessão atual, não provam que a tabela esteja vazia globalmente.",
      "Consultas usam exclusivamente a sessão Supabase atual e permanecem sujeitas ao RLS; nenhum privilégio é elevado.",
      "Uma sessão só pode testar se ela própria enxerga outra empresa. Acesso do usuário B aos próprios dados exige uma sessão de teste B separada.",
    ],
  };

  if (demoMode) {
    report.session = result("NÃO FOI POSSÍVEL TESTAR", { reason: "O app está em modo demo; saia da demo e entre com Supabase Auth." });
    return report;
  }
  if (!supabaseClient?.auth?.getUser) {
    report.session = result("FALHOU", { reason: "Cliente Supabase/Auth indisponível." });
    return report;
  }

  let authUser;
  try {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) throw error;
    authUser = data?.user;
  } catch (error) {
    report.session = result("FALHOU", { reason: error.message || "Falha ao validar sessão Supabase." });
    return report;
  }

  if (!authUser?.id) {
    report.session = result("FALHOU", { reason: "Não há usuário autenticado na sessão Supabase atual." });
    return report;
  }
  report.session = result("PASSOU", { authenticated: true, userId: authUser.id });

  let companies;
  try {
    const { data, error } = await supabaseClient
      .from("empresas")
      .select("id,user_id")
      .eq("user_id", authUser.id);
    if (error) throw error;
    companies = data || [];
    report.companies = result(companies.length === 1 ? "PASSOU" : "FALHOU", {
      count: companies.length,
      companies: companies.map(({ id, user_id }) => ({ id, user_id })),
      reason: companies.length === 0
        ? "Nenhuma empresa visível vinculada a este user_id."
        : companies.length > 1
        ? "Mais de uma empresa vinculada; nenhuma foi escolhida automaticamente."
        : undefined,
    });
  } catch (error) {
    report.companies = result("NÃO FOI POSSÍVEL TESTAR", { reason: error.message || "Falha consultando empresas." });
    companies = [];
  }

  for (const table of READ_ONLY_TABLES) {
    try {
      const { count, error } = await supabaseClient.from(table).select("id", { count: "exact", head: true });
      if (error) throw error;
      report.counts.push({ table, status: "PASSOU", visibleCount: count ?? 0, scope: "linhas visíveis pela sessão atual" });
    } catch (error) {
      report.counts.push({ table, status: "NÃO FOI POSSÍVEL TESTAR", reason: error.message || "Consulta de contagem falhou." });
    }
  }

  if (companies.length !== 1) {
    report.tenantIntegrity = TABLES.map((table) => result("NÃO FOI POSSÍVEL TESTAR", {
      table,
      reason: "Tenant ausente ou ambíguo; não foi escolhido empresa_id para este teste.",
    }));
    report.relationships = RELATIONSHIPS.map(({ name }) => result("NÃO FOI POSSÍVEL TESTAR", {
      relationship: name,
      reason: "Tenant ausente ou ambíguo.",
    }));
    return report;
  }

  const empresaId = companies[0].id;
  for (const table of TABLES) {
    try {
      const { rows, complete } = await fetchAllRows(supabaseClient, table, "empresa_id");
      const mismatches = rows.filter((row) => String(row.empresa_id) !== String(empresaId)).length;
      report.tenantIntegrity.push(result(
        !complete ? "NÃO FOI POSSÍVEL TESTAR" : mismatches > 0 ? "FALHOU" : rows.length === 0 ? "NÃO FOI POSSÍVEL TESTAR" : "PASSOU",
        {
          table,
          rowsVisibleAndChecked: rows.length,
          mismatches,
          complete,
          reason: !complete
            ? `Limite de ${MAX_ROWS_PER_CHECK} linhas atingido.`
            : rows.length === 0
            ? "Nenhuma linha visível; zero visível não prova ausência global de dados."
            : mismatches > 0
            ? "Há linhas visíveis cujo empresa_id difere da empresa autenticada."
            : "Todas as linhas retornadas pela consulta submetida ao RLS pertencem à empresa autenticada.",
        }
      ));
    } catch (error) {
      report.tenantIntegrity.push(result("NÃO FOI POSSÍVEL TESTAR", { table, reason: error.message || "Consulta falhou." }));
    }
  }

  for (const relation of RELATIONSHIPS) {
    try {
      const selection = `empresa_id,${relation.childField},related:${relation.parent}!${relation.constraint}(empresa_id)`;
      const { rows, complete } = await fetchAllRows(
        supabaseClient,
        relation.child,
        selection,
        (query) => relation.optional ? query.not(relation.childField, "is", "null") : query
      );
      let mismatches = 0;
      let unresolved = 0;
      for (const row of rows) {
        const parent = Array.isArray(row.related) ? row.related[0] : row.related;
        if (!parent || parent.empresa_id == null) {
          unresolved += 1;
        } else if (String(row.empresa_id) !== String(parent.empresa_id)) {
          mismatches += 1;
        }
      }
      const status = !complete || rows.length === 0 || unresolved > 0
        ? "NÃO FOI POSSÍVEL TESTAR"
        : mismatches > 0
        ? "FALHOU"
        : "PASSOU";
      report.relationships.push(result(status, {
        relationship: relation.name,
        rowsVisibleAndChecked: rows.length,
        crossTenant: mismatches,
        relatedNotVisibleOrUnresolved: unresolved,
        complete,
        reason: rows.length === 0
          ? "Nenhuma relação não nula visível; zero visível não prova ausência global de dados."
          : unresolved > 0
          ? "O relacionamento não ficou visível nesta sessão (pode estar oculto pelo RLS); não foi contornado."
          : !complete
          ? `Limite de ${MAX_ROWS_PER_CHECK} linhas atingido.`
          : undefined,
      }));
    } catch (error) {
      report.relationships.push(result("NÃO FOI POSSÍVEL TESTAR", {
        relationship: relation.name,
        reason: `O Supabase JS/PostgREST não executou o embed ${relation.constraint}; não houve tentativa de contornar RLS. ${error.message || ""}`.trim(),
      }));
    }
  }

  if (!otherCompanyId.trim()) {
    report.otherCompanyIsolation = result("NÃO FOI POSSÍVEL TESTAR", {
      reason: "Nenhum ID de empresa de teste foi informado; não foi tentado login de outro usuário.",
    });
  } else if (String(otherCompanyId).trim() === String(empresaId)) {
    report.otherCompanyIsolation = result("NÃO FOI POSSÍVEL TESTAR", { reason: "O ID informado é a empresa da sessão atual, não outra empresa." });
  } else {
    try {
      const { data, error } = await supabaseClient.from("empresas").select("id").eq("id", otherCompanyId.trim()).maybeSingle();
      if (error) throw error;
      report.otherCompanyIsolation = data
        ? result("FALHOU", { visible: true, reason: "A sessão atual conseguiu consultar a empresa de teste informada." })
        : result("PASSOU", { visible: false, reason: "A empresa de teste não está visível à sessão atual." });
    } catch (error) {
      report.otherCompanyIsolation = result("NÃO FOI POSSÍVEL TESTAR", { reason: error.message || "Consulta da empresa de teste falhou." });
    }
  }

  return report;
}
