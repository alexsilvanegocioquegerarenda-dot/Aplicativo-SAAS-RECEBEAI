export const MERCADO_PAGO_PLANS = {
  essencial: {
    id: "essencial",
    alias: "starter",
    nome: "Plano Essencial",
    preco: 149,
    descricao: "Organização de clientes e recebíveis",
    recorrencia: "mensal",
  },
  profissional: {
    id: "profissional",
    alias: "pro",
    nome: "Plano Profissional",
    preco: 349,
    descricao: "Indicadores e organização da carteira",
    recorrencia: "mensal",
  },
  enterprise: {
    id: "enterprise",
    alias: "enterprise",
    nome: "Plano Enterprise",
    preco: null,
    descricao: "Indisponível para contratação automática",
    recorrencia: "mensal",
  },
};

MERCADO_PAGO_PLANS.starter = MERCADO_PAGO_PLANS.essencial;
MERCADO_PAGO_PLANS.pro = MERCADO_PAGO_PLANS.profissional;
