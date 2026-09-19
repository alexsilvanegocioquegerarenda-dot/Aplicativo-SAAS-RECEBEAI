import { supabase, isSupabaseConfigured } from "./supabaseClient";

const STORAGE_KEY_PREFIX = "recebeai_data_";

// Seed de dados iniciais realistas para demonstração e uso imediato
const INITIAL_DATA = {
  Cliente: [
    {
      id: "cli-1",
      nome: "TechSolutions Informática Ltda",
      cnpj: "34.123.456/0001-89",
      email: "financeiro@techsolutions.com.br",
      telefone: "11987654321",
      contato_nome: "Mariana Souza",
      status: "atrasado",
      risco: "medio",
      limite_credito: 25000,
      criado_em: "2024-01-10",
    },
    {
      id: "cli-2",
      nome: "Auto Peças e Mecânica São José",
      cnpj: "18.987.654/0001-23",
      email: "cobranca@autopecassaojose.com.br",
      telefone: "11976543210",
      contato_nome: "Carlos Eduardo",
      status: "atrasado",
      risco: "alto",
      limite_credito: 15000,
      criado_em: "2024-01-15",
    },
    {
      id: "cli-3",
      nome: "Distribuidora de Alimentos Alvorada",
      cnpj: "05.456.789/0001-12",
      email: "contas@alvoradaalimentos.com.br",
      telefone: "19991234567",
      contato_nome: "Patrícia Lima",
      status: "em_dia",
      risco: "baixo",
      limite_credito: 60000,
      criado_em: "2024-02-01",
    },
    {
      id: "cli-4",
      nome: "Restaurante & Buffet Sabor Real",
      cnpj: "22.333.444/0001-55",
      email: "adm@saborrealbuffet.com.br",
      telefone: "21988887777",
      contato_nome: "Rodrigo Mendes",
      status: "a_vencer",
      risco: "medio",
      limite_credito: 12000,
      criado_em: "2024-02-12",
    },
    {
      id: "cli-5",
      nome: "Consultoria Delta Estratégia",
      cnpj: "45.678.901/0001-77",
      email: "financeiro@deltaestrategia.com.br",
      telefone: "31977776666",
      contato_nome: "Beatriz Nogueira",
      status: "em_dia",
      risco: "baixo",
      limite_credito: 40000,
      criado_em: "2024-02-20",
    },
  ],

  Recebivel: [
    {
      id: "rec-1",
      cliente_id: "cli-1",
      nota_fiscal: "NF-2024-101",
      descricao: "Serviços de Manutenção Mensal e Licenças",
      valor: 4500.0,
      valor_pago: 0,
      vencimento: new Date(Date.now() - 15 * 86400000).toISOString().split("T")[0], // 15 dias de atraso
      status: "atrasado",
      forma_pagamento: "boleto",
      chave_pix: "pix@recebeai.com.br",
    },
    {
      id: "rec-2",
      cliente_id: "cli-1",
      nota_fiscal: "NF-2024-102",
      descricao: "Consultoria em Nuvem - Etapa 2",
      valor: 3200.0,
      valor_pago: 0,
      vencimento: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0], // A vencer em 5 dias
      status: "a_vencer",
      forma_pagamento: "pix",
    },
    {
      id: "rec-3",
      cliente_id: "cli-2",
      nota_fiscal: "NF-2024-089",
      descricao: "Lote de Peças e Filtros Industriais",
      valor: 8900.0,
      valor_pago: 0,
      vencimento: new Date(Date.now() - 42 * 86400000).toISOString().split("T")[0], // 42 dias atraso
      status: "atrasado",
      forma_pagamento: "boleto",
    },
    {
      id: "rec-4",
      cliente_id: "cli-2",
      nota_fiscal: "NF-2024-094",
      descricao: "Frete Especial e Acessórios",
      valor: 1650.0,
      valor_pago: 0,
      vencimento: new Date(Date.now() - 65 * 86400000).toISOString().split("T")[0], // 65 dias atraso
      status: "atrasado",
      forma_pagamento: "boleto",
    },
    {
      id: "rec-5",
      cliente_id: "cli-3",
      nota_fiscal: "NF-2024-110",
      descricao: "Fornecimento de Insumos - Parcela 1/2",
      valor: 12500.0,
      valor_pago: 12500.0,
      vencimento: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
      status: "pago",
      data_pagamento: new Date(Date.now() - 11 * 86400000).toISOString().split("T")[0],
      forma_pagamento: "pix",
    },
    {
      id: "rec-6",
      cliente_id: "cli-3",
      nota_fiscal: "NF-2024-111",
      descricao: "Fornecimento de Insumos - Parcela 2/2",
      valor: 12500.0,
      valor_pago: 0,
      vencimento: new Date(Date.now() + 18 * 86400000).toISOString().split("T")[0],
      status: "em_dia",
      forma_pagamento: "pix",
    },
    {
      id: "rec-7",
      cliente_id: "cli-4",
      nota_fiscal: "NF-2024-115",
      descricao: "Serviço de Coquetel e Equipamentos",
      valor: 2800.0,
      valor_pago: 0,
      vencimento: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0], // A vencer em 2 dias
      status: "a_vencer",
      forma_pagamento: "pix",
    },
    {
      id: "rec-8",
      cliente_id: "cli-5",
      nota_fiscal: "NF-2024-120",
      descricao: "Honorários Mensais de Assessoria",
      valor: 5000.0,
      valor_pago: 0,
      vencimento: new Date(Date.now() + 25 * 86400000).toISOString().split("T")[0],
      status: "em_dia",
      forma_pagamento: "boleto",
    },
  ],

  Cobranca: [
    {
      id: "cob-1",
      cliente_id: "cli-1",
      recebivel_id: "rec-1",
      tipo: "whatsapp",
      origem: "regua",
      regua_step: 2,
      status: "entregue",
      data_envio: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
      mensagem: "Olá Mariana, identificamos a pendência da NF-2024-101 no valor de R$ 4.500,00 vencida há 12 dias. Acesse o link ou use a chave PIX para quitar.",
    },
    {
      id: "cob-2",
      cliente_id: "cli-2",
      recebivel_id: "rec-3",
      tipo: "whatsapp",
      origem: "manual",
      regua_step: null,
      status: "visualizada",
      data_envio: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0],
      mensagem: "Prezado Carlos, precisamos alinhar o pagamento referente ao título NF-2024-089 no valor de R$ 8.900,00. Estamos abertos a negociar um parcelamento.",
    },
  ],

  Promessa: [
    {
      id: "prom-1",
      cliente_id: "cli-1",
      recebivel_id: "rec-1",
      valor_acordado: 4500.0,
      data_promessa: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0],
      status: "pendente",
      observacao: "Cliente afirmou que receberá repasse de cliente na quinta-feira e fará o PIX.",
      criado_em: new Date().toISOString().split("T")[0],
    },
  ],

  PrioridadeCobranca: [
    {
      id: "prio-1",
      cliente_id: "cli-2",
      score: 88,
      nivel: "alta",
      motivo: "Atraso superior a 40 dias com valor expressivo (> R$ 10.000 acumulado) e risco cadastral alto.",
      recomendacao: "Entrar em contato via telefone ou WhatsApp propondo acordo com entrada de 30% via PIX.",
    },
    {
      id: "prio-2",
      cliente_id: "cli-1",
      score: 65,
      nivel: "media",
      motivo: "Primeiro atraso relevante (15 dias). Cliente costuma pagar em dia.",
      recomendacao: "Cobrança amigável via WhatsApp confirmando a promessa de pagamento registrada.",
    },
  ],

  Regua: [
    {
      id: "reg-1",
      nome: "Lembrete Preventivo (D-3)",
      dias_gatilho: -3,
      canal: "whatsapp",
      ativo: true,
      mensagem: "Olá {{cliente}}, tudo bem? Lembramos que sua fatura {{nota_fiscal}} no valor de {{valor}} vence em {{vencimento}}. Pague via PIX: {{chave_pix}}",
    },
    {
      id: "reg-2",
      nome: "Aviso no Vencimento (D0)",
      dias_gatilho: 0,
      canal: "whatsapp",
      ativo: true,
      mensagem: "Olá {{cliente}}! Sua fatura {{nota_fiscal}} de {{valor}} vence hoje. Evite juros e encargos pagando agora: {{link_pagamento}}",
    },
    {
      id: "reg-3",
      nome: "Cobrança Amigável (D+3)",
      dias_gatilho: 3,
      canal: "whatsapp",
      ativo: true,
      mensagem: "Olá {{cliente}}, não identificamos a compensação da sua fatura {{nota_fiscal}} ({{valor}}), vencida em {{vencimento}}. Caso já tenha pago, por favor desconsidere!",
    },
    {
      id: "reg-4",
      nome: "Cobrança Incisiva (D+10)",
      dias_gatilho: 10,
      canal: "whatsapp",
      ativo: true,
      mensagem: "Aviso importante: Sua fatura {{nota_fiscal}} encontra-se com 10 dias de atraso. Regularize sua situação para evitar bloqueios. Chave PIX: {{chave_pix}}",
    },
  ],

  Importacao: [
    {
      id: "imp-1",
      origem: "csv",
      nome_arquivo: "faturas_janeiro_2024.csv",
      quantidade_registros: 45,
      valor_total: 184500.0,
      status: "concluida",
      created_date: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: "imp-2",
      origem: "csv",
      nome_arquivo: "remessa_bancaria_fev.csv",
      quantidade_registros: 28,
      valor_total: 92300.0,
      status: "concluida",
      created_date: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ],

  MetaRecuperacao: [
    {
      id: "meta-1",
      periodo_inicio: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`,
      periodo_fim: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}`,
      valor_meta: 35000.0,
      descricao: `Meta de Recuperação ${new Date().toLocaleDateString("pt-BR", { month: "long" })}`,
      created_date: new Date().toISOString(),
    },
  ],

  TemplateMensagem: [
    {
      id: "tpl-1",
      nome: "Lembrete Amigável - Baixa Prioridade",
      nivel: "baixa",
      tom: "Amigável e preventivo",
      conteudo: "Olá, {cliente}! Notamos que a fatura {nota_fiscal} no valor de {valor} venceu recentemente há {dias} dias. Segue nossa chave PIX para quitação facilitada: {pix}. Caso já tenha efetuado o pagamento, por favor desconsidere este aviso.",
      ativo: true,
    },
    {
      id: "tpl-2",
      nome: "Cobrança Regular - Média Prioridade",
      nivel: "media",
      tom: "Educado, formal e persistente",
      conteudo: "Prezado(a) {cliente}, constatamos uma pendência financeira referente à fatura {nota_fiscal}, vencida há {dias} dias no total de {valor}. Solicitamos a gentileza de regularizar a situação hoje mesmo para manter sua conta e limite ativos. Chave PIX: {pix}",
      ativo: true,
    },
    {
      id: "tpl-3",
      nome: "Aviso Urgente - Alta Prioridade",
      nivel: "alta",
      tom: "Firme, assertivo com impacto",
      conteudo: "URGENTE: {cliente}, o título {nota_fiscal} ({valor}) encontra-se em atraso grave de {dias} dias. Para evitar protesto em cartório e bloqueio comercial imediato, entre em contato imediatamente ou realize a liquidação via PIX: {pix}.",
      ativo: true,
    },
  ],

  ConversaIA: [
    {
      id: "conv-1",
      pergunta: "Quem devo cobrar hoje?",
      resposta: "Analisando sua carteira, recomendo focar hoje nos clientes com maior saldo vencido: Auto Peças e Mecânica São José (R$ 8.900,00 atrasado há mais de 40 dias) e TechSolutions Informática (R$ 4.500,00 atrasado há 15 dias). Ambos têm histórico crítico e necessitam de ação via WhatsApp hoje mesmo.",
      created_date: new Date(Date.now() - 3600000).toISOString(),
    },
  ],

  Configuracao: {
    razao_social: "RecebeAi Cobranças & Tecnologia S.A.",
    cnpj: "42.000.111/0001-99",
    telefone_empresa: "11988889999",
    email_cobranca: "financeiro@recebeai.com.br",
    chave_pix: "pix@recebeai.com.br",
    tipo_chave_pix: "email",
    multa_percentual: 2.0,
    juros_mes_percentual: 1.0,
    plano_atual: "pro", // 'starter' | 'pro' | 'enterprise'
    limite_titulos: 300,
    mp_public_key: "",
    mp_access_token: "",
    mp_link_starter: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=recebeai-starter-119",
    mp_link_pro: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=recebeai-pro-299",
    mp_link_enterprise: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=recebeai-enterprise-699",
  },
};

function getActiveTenantId() {
  try {
    const raw = localStorage.getItem("recebeai_auth_user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.empresa_id) return u.empresa_id;
    }
  } catch (e) {}
  return "emp-demo-techsolutions";
}

function getLocalData(entityName) {
  const tenantId = getActiveTenantId();
  const storageKey = `${STORAGE_KEY_PREFIX}${tenantId}_${entityName}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Erro ao ler localStorage multi-tenant:", e);
  }

  // Apenas as contas de demonstração iniciam com dados pré-populados
  const isDemoTenant =
    tenantId === "emp-demo-techsolutions" ||
    tenantId === "emp-master-recebeai";

  const defaultData = isDemoTenant ? INITIAL_DATA[entityName] || [] : [];
  setLocalData(entityName, defaultData);
  return defaultData;
}

function setLocalData(entityName, data) {
  const tenantId = getActiveTenantId();
  const storageKey = `${STORAGE_KEY_PREFIX}${tenantId}_${entityName}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (e) {
    console.warn("Erro ao salvar localStorage multi-tenant:", e);
  }
}

// Mapeamento de entidades para tabelas do Supabase (PostgreSQL)
const TABLE_MAP = {
  Cliente: "clientes",
  Recebivel: "recebiveis",
  Cobranca: "cobrancas",
  Promessa: "promessas",
  PrioridadeCobranca: "prioridades_cobranca",
  Regua: "reguas",
  Importacao: "importacoes",
  MetaRecuperacao: "metas_recuperacao",
  TemplateMensagem: "templates_mensagem",
  ConversaIA: "conversas_ia",
};

// Cria a API compatível com base44.entities.[EntityName]
function createEntityClient(entityName) {
  const tableName = TABLE_MAP[entityName];

  return {
    async list(sortField, limit) {
      if (isSupabaseConfigured && tableName) {
        try {
          let query = supabase.from(tableName).select("*");
          if (sortField) {
            const isDesc = sortField.startsWith("-");
            const col = isDesc ? sortField.slice(1) : sortField;
            query = query.order(col, { ascending: !isDesc });
          }
          if (typeof limit === "number") {
            query = query.limit(limit);
          }
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            return data;
          }
        } catch (e) {
          console.warn(`[Supabase] Erro ao listar ${entityName}:`, e);
        }
      }

      let items = [...getLocalData(entityName)];
      if (sortField) {
        const isDesc = sortField.startsWith("-");
        const col = isDesc ? sortField.slice(1) : sortField;
        items.sort((a, b) => {
          const valA = a[col] ?? a.created_date ?? a.criado_em ?? "";
          const valB = b[col] ?? b.created_date ?? b.criado_em ?? "";
          if (valA < valB) return isDesc ? 1 : -1;
          if (valA > valB) return isDesc ? -1 : 1;
          return 0;
        });
      }
      if (typeof limit === "number") {
        items = items.slice(0, limit);
      }
      return items;
    },

    async filter(criteria = {}) {
      if (isSupabaseConfigured && tableName) {
        try {
          let query = supabase.from(tableName).select("*");
          Object.entries(criteria).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
          const { data, error } = await query;
          if (!error && data) {
            return data;
          }
        } catch (e) {
          console.warn(`[Supabase] Erro ao filtrar ${entityName}:`, e);
        }
      }

      const items = getLocalData(entityName);
      return items.filter(item => {
        return Object.entries(criteria).every(([key, value]) => {
          return String(item[key]) === String(value);
        });
      });
    },

    async get(id) {
      if (isSupabaseConfigured && tableName) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .eq("id", id)
            .maybeSingle();
          if (!error && data) {
            return data;
          }
        } catch (e) {
          console.warn(`[Supabase] Erro ao buscar ${entityName}:`, e);
        }
      }

      const items = getLocalData(entityName);
      return items.find(x => x.id === id) || null;
    },

    async create(data) {
      if (isSupabaseConfigured && tableName) {
        try {
          const payload = { ...data };
          // Deixa o PostgreSQL gerar o UUID primário se não for um UUID válido
          if (payload.id && (payload.id.startsWith("cli-") || payload.id.startsWith("rec-") || payload.id.startsWith("reg-"))) {
            delete payload.id;
          }
          const { data: inserted, error } = await supabase
            .from(tableName)
            .insert([payload])
            .select()
            .single();

          if (!error && inserted) {
            const items = getLocalData(entityName);
            items.push(inserted);
            setLocalData(entityName, items);
            return inserted;
          }
        } catch (e) {
          console.warn(`[Supabase] Erro ao criar ${entityName}:`, e);
        }
      }

      const items = getLocalData(entityName);
      const newItem = {
        id: `${entityName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        criado_em: new Date().toISOString(),
        created_date: new Date().toISOString(),
        ...data,
      };
      items.push(newItem);
      setLocalData(entityName, items);
      return newItem;
    },

    async bulkCreate(itemsToCreate = []) {
      const createdItems = [];
      for (const item of itemsToCreate) {
        const created = await this.create(item);
        createdItems.push(created);
      }
      return createdItems;
    },

    async update(id, updates) {
      if (isSupabaseConfigured && tableName) {
        try {
          const { data: updated, error } = await supabase
            .from(tableName)
            .update({ ...updates, atualizado_em: new Date().toISOString() })
            .eq("id", id)
            .select()
            .maybeSingle();

          if (!error && updated) {
            const items = getLocalData(entityName);
            const index = items.findIndex(x => x.id === id);
            if (index !== -1) {
              items[index] = updated;
              setLocalData(entityName, items);
            }
            return updated;
          }
        } catch (e) {
          console.warn(`[Supabase] Erro ao atualizar ${entityName}:`, e);
        }
      }

      const items = getLocalData(entityName);
      const index = items.findIndex(x => x.id === id);
      if (index === -1) {
        throw new Error(`Item ${id} não encontrado em ${entityName}`);
      }
      items[index] = { ...items[index], ...updates, atualizado_em: new Date().toISOString() };
      setLocalData(entityName, items);
      return items[index];
    },

    async delete(id) {
      if (isSupabaseConfigured && tableName) {
        try {
          await supabase.from(tableName).delete().eq("id", id);
        } catch (e) {
          console.warn(`[Supabase] Erro ao deletar ${entityName}:`, e);
        }
      }

      const items = getLocalData(entityName);
      const filtered = items.filter(x => x.id !== id);
      setLocalData(entityName, filtered);
      return { success: true };
    },
  };
}

// Degraus oficiais da Régua de Cobrança
const DEGRAUS_REGUA = [
  { id: 1, dias_min: 1, dias_max: 7, tom: "amigável", titulo: "Lembrete amigável", descricao: "Tom gentil, lembrete de vencimento" },
  { id: 2, dias_min: 8, dias_max: 15, tom: "educado e firme", titulo: "Cobrança regular", descricao: "Tom educado, cobra regularização" },
  { id: 3, dias_min: 16, dias_max: 30, tom: "firme", titulo: "Cobrança firme", descricao: "Tom firme, alerta de impacto comercial" },
  { id: 4, dias_min: 31, dias_max: 60, tom: "urgente", titulo: "Cobrança urgente", descricao: "Tom urgente, aviso de consequências" },
  { id: 5, dias_min: 61, dias_max: 99999, tom: "enérgico", titulo: "Aviso final", descricao: "Tom enérgico, risco de protesto em cartório" },
];

export const base44 = {
  entities: {
    Cliente: createEntityClient("Cliente"),
    Recebivel: createEntityClient("Recebivel"),
    Cobranca: createEntityClient("Cobranca"),
    Promessa: createEntityClient("Promessa"),
    PrioridadeCobranca: createEntityClient("PrioridadeCobranca"),
    Regua: createEntityClient("Regua"),
    Importacao: createEntityClient("Importacao"),
    MetaRecuperacao: createEntityClient("MetaRecuperacao"),
    TemplateMensagem: createEntityClient("TemplateMensagem"),
    ConversaIA: createEntityClient("ConversaIA"),
    Configuracao: {
      async get() {
        if (isSupabaseConfigured) {
          try {
            const { data, error } = await supabase
              .from("empresas")
              .select("*")
              .limit(1)
              .maybeSingle();
            if (!error && data) {
              return { ...getLocalData("Configuracao"), ...data };
            }
          } catch (e) {
            console.warn("[Supabase] Erro ao carregar configurações da empresa:", e);
          }
        }
        return getLocalData("Configuracao");
      },
      async update(updates) {
        if (isSupabaseConfigured) {
          try {
            await supabase.from("empresas").upsert(updates);
          } catch (e) {
            console.warn("[Supabase] Erro ao salvar configurações no Supabase:", e);
          }
        }
        const current = getLocalData("Configuracao");
        const updated = { ...current, ...updates };
        setLocalData("Configuracao", updated);
        return updated;
      },
    },
  },

  functions: {
    async invoke(functionName, args = {}) {
      if (functionName === "gerarCobranca") {
        const { cliente_id, recebivel_id } = args;
        const clientes = await base44.entities.Cliente.list();
        const recebiveis = await base44.entities.Recebivel.list();
        const cfg = await base44.entities.Configuracao.get();

        const cliente = clientes.find((c) => c.id === cliente_id);
        const rec = recebiveis.find((r) => r.id === recebivel_id);

        const nome = cliente?.nome || "Cliente";
        const valorFormatado = (rec?.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        const nf = rec?.nota_fiscal || "NF-Pendente";
        const chavePix = cfg?.chave_pix || "financeiro@recebeai.com.br";

        let dias = 0;
        if (rec?.vencimento) {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const v = new Date(rec.vencimento);
          v.setHours(0, 0, 0, 0);
          dias = Math.max(0, Math.floor((hoje - v) / 86400000));
        }

        let mensagem = "";
        if (dias > 30) {
          mensagem = `Olá, ${nome}. Notamos uma pendência importante em aberto referente ao título ${nf} no valor de ${valorFormatado}, vencido há ${dias} dias. Para evitarmos o encaminhamento a protesto e cancelamento de limite, solicitamos a quitação imediata via PIX: ${chavePix}. Em caso de dúvidas, responda esta mensagem.`;
        } else if (dias > 7) {
          mensagem = `Prezado(a) ${nome}, constam títulos em aberto em nosso sistema no valor de ${valorFormatado} (${nf}), com vencimento em atraso há ${dias} dias. Para facilitar sua regularização hoje, disponibilizamos a chave PIX: ${chavePix}. Conte conosco para manter sua conta em dia!`;
        } else {
          mensagem = `Olá, ${nome}! Passando para lembrar da fatura ${nf} no valor de ${valorFormatado}. Caso precise da chave PIX para pagamento: ${chavePix}. Se o pagamento já foi realizado, por favor desconsidere este lembrete amigável!`;
        }

        return { data: { mensagem } };
      }

      if (functionName === "processarRegua") {
        const recebiveis = await base44.entities.Recebivel.list();
        const clientes = await base44.entities.Cliente.list();
        const cobrancasExistentes = await base44.entities.Cobranca.list();
        const cfg = await base44.entities.Configuracao.get();

        const mapaClientes = {};
        clientes.forEach((c) => (mapaClientes[c.id] = c));

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        let gerados = 0;
        let analisados = 0;

        for (const rec of recebiveis) {
          if (rec.status === "pago") continue;
          if (!rec.vencimento) continue;

          const venc = new Date(rec.vencimento);
          venc.setHours(0, 0, 0, 0);
          const diasAtraso = Math.floor((hoje - venc) / 86400000);

          if (diasAtraso <= 0) continue;
          analisados++;

          const degrau = DEGRAUS_REGUA.find((d) => diasAtraso >= d.dias_min && diasAtraso <= d.dias_max) || DEGRAUS_REGUA[DEGRAUS_REGUA.length - 1];

          // Verifica se já existe cobrança recente para o mesmo degrau e recebível
          const jaExiste = cobrancasExistentes.some(
            (c) => c.recebivel_id === rec.id && c.regua_step === degrau.id && c.origem === "regua"
          );

          if (!jaExiste) {
            const cliente = mapaClientes[rec.cliente_id];
            const saldo = (Number(rec.valor) || 0) - (Number(rec.valor_pago) || 0);
            const valorFormatado = saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            const pix = cfg?.chave_pix || "pix@recebeai.com.br";

            let msg = `Olá ${cliente?.nome || "Cliente"}, informamos sobre a fatura ${rec.nota_fiscal || "NF"} no valor de ${valorFormatado}, em atraso há ${diasAtraso} dias. Chave PIX: ${pix}`;
            if (degrau.id === 1) {
              msg = `Olá ${cliente?.nome || "Cliente"}! Lembrete amigável: sua fatura ${rec.nota_fiscal || "NF"} de ${valorFormatado} venceu há ${diasAtraso} dias. Pague com facilidade via PIX: ${pix}.`;
            } else if (degrau.id >= 4) {
              msg = `Aviso urgente: ${cliente?.nome || "Cliente"}, o título ${rec.nota_fiscal || "NF"} (${valorFormatado}) está com ${diasAtraso} dias de atraso. Regularize com urgência via PIX (${pix}) para evitar protesto.`;
            }

            await base44.entities.Cobranca.create({
              cliente_id: rec.cliente_id,
              cliente_nome: cliente?.nome || rec.cliente_nome || "Cliente",
              recebivel_id: rec.id,
              canal: "whatsapp",
              status: "rascunho",
              origem: "regua",
              regua_step: degrau.id,
              regua_tom: degrau.tom,
              mensagem: msg,
              data_envio: new Date().toISOString().split("T")[0],
            });

            gerados++;
          }
        }

        return {
          data: {
            gerados,
            analisados,
            limite: 100,
          },
        };
      }

      if (functionName === "calcularPrioridades") {
        const clientes = await base44.entities.Cliente.list();
        const recebiveis = await base44.entities.Recebivel.list();
        const promessas = await base44.entities.Promessa.list();

        let altas = 0;
        let medias = 0;
        let baixas = 0;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        for (const cliente of clientes) {
          const recsCliente = recebiveis.filter(
            (r) => String(r.cliente_id) === String(cliente.id) && r.status !== "pago"
          );
          const totalAberto = recsCliente.reduce(
            (acc, r) => acc + ((Number(r.valor) || 0) - (Number(r.valor_pago) || 0)),
            0
          );

          let maiorAtraso = 0;
          recsCliente.forEach((r) => {
            if (r.vencimento) {
              const v = new Date(r.vencimento);
              v.setHours(0, 0, 0, 0);
              const d = Math.floor((hoje - v) / 86400000);
              if (d > maiorAtraso) maiorAtraso = d;
            }
          });

          const promessasQuebradas = promessas.filter(
            (p) => String(p.cliente_id) === String(cliente.id) && ["vencida", "quebrada"].includes(p.status)
          ).length;

          const score = Math.round(
            (totalAberto / 1000) * 2 + maiorAtraso * 0.8 + promessasQuebradas * 15 + (cliente.risco === "alto" ? 25 : 10)
          );

          let nivel = "baixa";
          if (score > 60 || maiorAtraso > 30 || promessasQuebradas > 0) {
            nivel = "alta";
            altas++;
          } else if (score > 25 || maiorAtraso > 10) {
            nivel = "media";
            medias++;
          } else {
            baixas++;
          }

          const existing = await base44.entities.PrioridadeCobranca.filter({ cliente_id: cliente.id });
          const payload = {
            cliente_id: cliente.id,
            cliente_nome: cliente.nome,
            score,
            nivel,
            motivo: `Saldo de R$ ${totalAberto.toFixed(2)} em aberto há ${maiorAtraso} dias (${promessasQuebradas} quebra(s) de promessa).`,
            recomendacao: nivel === "alta" ? "Contato telefônico ou notificação formal imediata" : "Envio de régua de cobrança automática via WhatsApp",
            valor_em_aberto: totalAberto,
            dias_em_atraso: maiorAtraso,
          };

          if (existing.length > 0) {
            await base44.entities.PrioridadeCobranca.update(existing[0].id, payload);
          } else {
            await base44.entities.PrioridadeCobranca.create(payload);
          }
        }

        return {
          data: {
            total: clientes.length,
            altas,
            medias,
            baixas,
          },
        };
      }

      if (functionName === "iaFinanceira") {
        const { pergunta = "" } = args;
        const recebiveis = await base44.entities.Recebivel.list();
        const clientes = await base44.entities.Cliente.list();
        const promessas = await base44.entities.Promessa.list();

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const mapaClientes = {};
        clientes.forEach((c) => (mapaClientes[c.id] = c));

        const vencidos = recebiveis
          .filter((r) => {
            if (r.status === "pago") return false;
            const v = new Date(r.vencimento);
            v.setHours(0, 0, 0, 0);
            return Math.floor((hoje - v) / 86400000) > 0;
          })
          .map((r) => {
            const v = new Date(r.vencimento);
            v.setHours(0, 0, 0, 0);
            const dias = Math.floor((hoje - v) / 86400000);
            const saldo = (Number(r.valor) || 0) - (Number(r.valor_pago) || 0);
            return { ...r, dias, saldo, cliente: mapaClientes[r.cliente_id] };
          })
          .sort((a, b) => b.saldo - a.saldo);

        const totalVencido = vencidos.reduce((acc, r) => acc + r.saldo, 0);
        const pLower = pergunta.toLowerCase();

        let resposta = "";

        if (pLower.includes("80") || pLower.includes("pareto") || pLower.includes("concentra")) {
          let acumulado = 0;
          const topDebtors = [];
          for (const item of vencidos) {
            acumulado += item.saldo;
            topDebtors.push(`${item.cliente?.nome || "Cliente"} (R$ ${item.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`);
            if (totalVencido > 0 && acumulado / totalVencido >= 0.8) break;
          }
          resposta = `Identifiquei que aproximadamente 80% da sua inadimplência (total de R$ ${totalVencido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}) está concentrada em poucos títulos:\n\n• ${topDebtors.join("\n• ")}\n\nFocar seus esforços nestes clientes recuperará a maior parte do caixa da empresa com o menor número de contatos!`;
        } else if (pLower.includes("hoje") || pLower.includes("quem cobrar") || pLower.includes("começar")) {
          const prioritarios = vencidos.slice(0, 3);
          if (prioritarios.length === 0) {
            resposta = "Parabéns! No momento não constam clientes com títulos vencidos na sua carteira.";
          } else {
            resposta = `Hoje você deve priorizar os 3 principais casos de maior impacto financeiro:\n\n` +
              prioritarios
                .map(
                  (p, idx) =>
                    `${idx + 1}. **${p.cliente?.nome || "Cliente"}**: R$ ${p.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${p.dias} dias de atraso). Ação: Enviar mensagem com chave PIX e negociar entrada.`
                )
                .join("\n\n");
          }
        } else if (pLower.includes("promessa") || pLower.includes("quebr")) {
          const quebradas = promessas.filter((p) => ["vencida", "quebrada"].includes(p.status));
          resposta = `Você possui ${quebradas.length} promessa(s) não cumprida(s). Clientes que descumprem promessas devem ser transferidos para o Degrau 4 (Cobrança Urgente) da régua, pois o risco de inadimplência definitiva sobe significativamente após o primeiro acordo rompido.`;
        } else if (pLower.includes("30 dias") || pLower.includes("receber")) {
          const aReceber = recebiveis
            .filter((r) => {
              if (r.status === "pago") return false;
              const v = new Date(r.vencimento);
              v.setHours(0, 0, 0, 0);
              const dif = Math.floor((v - hoje) / 86400000);
              return dif >= 0 && dif <= 30;
            })
            .reduce((acc, r) => acc + ((Number(r.valor) || 0) - (Number(r.valor_pago) || 0)), 0);

          resposta = `Você tem **R$ ${aReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}** com previsão de recebimento nos próximos 30 dias. Recomendo ativar os lembretes preventivos da Régua para garantir que as empresas programem os pagamentos nas datas acordadas.`;
        } else {
          resposta = `Visão Geral da Carteira:\n\n• Saldo Total Vencido: R$ ${totalVencido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n• Títulos em Atraso: ${vencidos.length}\n• Clientes com Pendências: ${new Set(vencidos.map((v) => v.cliente_id)).size}\n\nRecomendação: Execute o processamento da Régua de Cobrança e priorize os clientes com mais de 30 dias de atraso para estancar o aumento do seu DSO.`;
        }

        await base44.entities.ConversaIA.create({
          pergunta,
          resposta,
          created_date: new Date().toISOString(),
        });

        return { data: { resposta } };
      }

      if (functionName === "criarCheckoutStripe") {
        const plano = args.plano || "pro";
        return {
          data: {
            url: `/planos?status=success&plano=${plano}`,
          },
        };
      }

      return { data: { success: true } };
    },
  },

  resetDemoData() {
    Object.keys(INITIAL_DATA).forEach((k) => {
      setLocalData(k, INITIAL_DATA[k]);
    });
  },

  isSupabaseConnected: isSupabaseConfigured,
};

export const ge = base44;

