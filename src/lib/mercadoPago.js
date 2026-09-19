/**
 * Serviço de Integração com Mercado Pago para Recebimento de Assinaturas e Planos do RecebeAi
 */

export const MERCADO_PAGO_PLANS = {
  essencial: {
    id: "essencial",
    alias: "starter",
    nome: "Plano Essencial",
    preco: 149.0,
    precoAnual: 119.0,
    descricao: "Ideal para pequenas empresas e autônomos (até 300 clientes e R$ 100k)",
    recorrencia: "mensal",
    envKey: "VITE_MP_LINK_ESSENCIAL",
    configKey: "mp_link_essencial",
    fallbackKey: "mp_link_starter",
    defaultLink: "",
  },
  profissional: {
    id: "profissional",
    alias: "pro",
    nome: "Plano Profissional",
    preco: 349.0,
    precoAnual: 279.0,
    descricao: "Completo com IA e régua automatizada (clientes e faturas ilimitadas)",
    recorrencia: "mensal",
    envKey: "VITE_MP_LINK_PROFISSIONAL",
    configKey: "mp_link_profissional",
    fallbackKey: "mp_link_pro",
    defaultLink: "",
  },
  enterprise: {
    id: "enterprise",
    alias: "enterprise",
    nome: "Plano Enterprise",
    preco: 799.0,
    precoAnual: 639.0,
    descricao: "Grandes volumes, multi-usuários, API aberta e gerente dedicado",
    recorrencia: "mensal",
    envKey: "VITE_MP_LINK_ENTERPRISE",
    configKey: "mp_link_enterprise",
    fallbackKey: "mp_link_enterprise",
    defaultLink: "",
  },
};

// Aliases para compatibilidade retroativa
MERCADO_PAGO_PLANS.starter = MERCADO_PAGO_PLANS.essencial;
MERCADO_PAGO_PLANS.pro = MERCADO_PAGO_PLANS.profissional;

/**
 * Obtém a URL de checkout do Mercado Pago para um plano
 */
export function getMercadoPagoCheckoutUrl(planoId, config = {}) {
  const plan = MERCADO_PAGO_PLANS[planoId];
  if (!plan) return null;

  // 1. Variável de Ambiente (.env / Vercel)
  const envUrl = import.meta.env[plan.envKey];
  if (envUrl && envUrl.trim().startsWith("http")) {
    return envUrl.trim();
  }

  // 2. Link customizado configurado no banco / painel da empresa
  if (config[plan.configKey] && config[plan.configKey].trim().startsWith("http")) {
    return config[plan.configKey].trim();
  }
  if (config[plan.fallbackKey] && config[plan.fallbackKey].trim().startsWith("http")) {
    return config[plan.fallbackKey].trim();
  }

  // 3. Retorna defaultLink se houver
  return plan.defaultLink || null;
}

/**
 * Verifica se o Mercado Pago possui links configurados para receber pagamentos reais
 */
export function isMercadoPagoConectado(config = {}) {
  const essencial = getMercadoPagoCheckoutUrl("essencial", config);
  const profissional = getMercadoPagoCheckoutUrl("profissional", config);
  const enterprise = getMercadoPagoCheckoutUrl("enterprise", config);
  const hasKeys = Boolean(
    (config.mp_public_key && config.mp_public_key.startsWith("APP_USR-")) ||
    import.meta.env.VITE_MP_PUBLIC_KEY
  );

  return {
    conectado: Boolean(essencial || profissional || enterprise || hasKeys),
    links: {
      essencial: Boolean(essencial),
      profissional: Boolean(profissional),
      enterprise: Boolean(enterprise),
    },
    hasKeys,
  };
}

/**
 * Redireciona o usuário para a tela de pagamento do Mercado Pago
 */
export function redirecionarParaMercadoPago(planoId, config = {}, emailCliente = "") {
  const url = getMercadoPagoCheckoutUrl(planoId, config);
  if (!url) {
    return {
      sucesso: false,
      motivo: "sem_link",
      mensagem: `O link do Mercado Pago para o plano ${MERCADO_PAGO_PLANS[planoId]?.nome || planoId} ainda não foi cadastrado nas Configurações.`,
    };
  }

  let finalUrl = url;
  if (emailCliente && (url.includes("mercadopago") || url.includes("mpago.la"))) {
    const separator = url.includes("?") ? "&" : "?";
    finalUrl = `${url}${separator}payer_email=${encodeURIComponent(emailCliente)}`;
  }

  window.open(finalUrl, "_blank", "noopener,noreferrer");
  return { sucesso: true, url: finalUrl };
}
