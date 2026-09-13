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

function getLocalData(entityName) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + entityName);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Erro ao ler localStorage:", e);
  }
  const defaultData = INITIAL_DATA[entityName] || [];
  setLocalData(entityName, defaultData);
  return defaultData;
}

function setLocalData(entityName, data) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + entityName, JSON.stringify(data));
  } catch (e) {
    console.warn("Erro ao salvar localStorage:", e);
  }
}

// Cria a API compatível com base44.entities.[EntityName]
function createEntityClient(entityName) {
  return {
    async list() {
      // Se houver Supabase configurado, podemos sincronizar
      return getLocalData(entityName);
    },

    async filter(criteria = {}) {
      const items = getLocalData(entityName);
      return items.filter(item => {
        return Object.entries(criteria).every(([key, value]) => {
          return String(item[key]) === String(value);
        });
      });
    },

    async get(id) {
      const items = getLocalData(entityName);
      return items.find(x => x.id === id) || null;
    },

    async create(data) {
      const items = getLocalData(entityName);
      const newItem = {
        id: `${entityName.toLowerCase()}-${Date.now()}`,
        criado_em: new Date().toISOString(),
        ...data,
      };
      items.push(newItem);
      setLocalData(entityName, items);
      return newItem;
    },

    async update(id, updates) {
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
      const items = getLocalData(entityName);
      const filtered = items.filter(x => x.id !== id);
      setLocalData(entityName, filtered);
      return { success: true };
    },
  };
}

export const base44 = {
  entities: {
    Cliente: createEntityClient("Cliente"),
    Recebivel: createEntityClient("Recebivel"),
    Cobranca: createEntityClient("Cobranca"),
    Promessa: createEntityClient("Promessa"),
    PrioridadeCobranca: createEntityClient("PrioridadeCobranca"),
    Regua: createEntityClient("Regua"),
    Configuracao: {
      async get() {
        return getLocalData("Configuracao");
      },
      async update(updates) {
        const current = getLocalData("Configuracao");
        const updated = { ...current, ...updates };
        setLocalData("Configuracao", updated);
        return updated;
      },
    },
  },

  resetDemoData() {
    Object.keys(INITIAL_DATA).forEach(k => {
      setLocalData(k, INITIAL_DATA[k]);
    });
  },

  isSupabaseConnected: isSupabaseConfigured,
};
