/**
 * Serviço de Integração com Mercado Pago para Recebimento de Assinaturas e Títulos
 */

export const MERCADO_PAGO_PLANS = {
  starter: {
    id: "starter",
    nome: "Plano Starter",
    preco: 119.0,
    descricao: "Ideal para microempresas e autônomos (até 50 títulos)",
    recorrencia: "mensal",
    defaultLink: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=recebeai-starter-119",
  },
  pro: {
    id: "pro",
    nome: "Plano Profissional",
    preco: 299.0,
    descricao: "Para pequenas e médias empresas (até 300 títulos e régua automática)",
    recorrencia: "mensal",
    defaultLink: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=recebeai-pro-299",
  },
  enterprise: {
    id: "enterprise",
    nome: "Plano Enterprise",
    preco: 699.0,
    descricao: "Para grandes volumes (títulos ilimitados, múltiplos operadores e API)",
    recorrencia: "mensal",
    defaultLink: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=recebeai-enterprise-699",
  },
};

/**
 * Obtém a URL de checkout do Mercado Pago para um plano
 */
export function getMercadoPagoCheckoutUrl(planoId, config = {}) {
  const plan = MERCADO_PAGO_PLANS[planoId];
  if (!plan) return null;

  // Se houver um link customizado configurado no painel da empresa
  const customLinkKey = `mp_link_${planoId}`;
  if (config[customLinkKey] && config[customLinkKey].trim().startsWith("http")) {
    return config[customLinkKey].trim();
  }

  // Se houver link padrão configurado
  return plan.defaultLink;
}

/**
 * Redireciona o usuário para a tela de pagamento do Mercado Pago
 */
export function redirecionarParaMercadoPago(planoId, config = {}, emailCliente = "") {
  const url = getMercadoPagoCheckoutUrl(planoId, config);
  if (!url) {
    throw new Error("Plano inválido para checkout");
  }

  // Se tiver e-mail do cliente, anexa como parâmetro se aplicável
  let finalUrl = url;
  if (emailCliente && url.includes("mercadopago")) {
    const separator = url.includes("?") ? "&" : "?";
    finalUrl = `${url}${separator}payer_email=${encodeURIComponent(emailCliente)}`;
  }

  // Abre em nova aba ou redireciona
  window.open(finalUrl, "_blank", "noopener,noreferrer");
  return finalUrl;
}
