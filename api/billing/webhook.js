import { createHash } from "node:crypto";
import { BILLING_PLANS, getMercadoPagoNotification, mapMercadoPagoSubscriptionStatus, verifyMercadoPagoSignature } from "../_lib/billing.js";
import { getSupabaseAdmin, sendJson } from "../_lib/supabase.js";

async function getMercadoPagoResource(resource, id, accessToken) {
  const response = await fetch(`https://api.mercadopago.com/${resource}/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!response.ok) {
    console.error(`Falha ao consultar ${resource} no Mercado Pago:`, response.status, data.message || "resposta inválida");
    throw new Error(`Não foi possível confirmar ${resource} no Mercado Pago.`);
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Método não permitido." });
  }

  try {
    const secret = process.env.MP_WEBHOOK_SECRET;
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!secret || !accessToken) {
      throw new Error("Configure MP_WEBHOOK_SECRET e MP_ACCESS_TOKEN nas variáveis de ambiente do servidor.");
    }

    const notification = getMercadoPagoNotification(req);
    if (!verifyMercadoPagoSignature({ ...notification, secret })) {
      return sendJson(res, 401, { error: "Assinatura do webhook inválida." });
    }

    const isPreapprovalEvent = ["subscription_preapproval", "preapproval"].includes(notification.type);
    const isPaymentEvent = notification.type === "subscription_authorized_payment";
    if (!isPreapprovalEvent && !isPaymentEvent) {
      return sendJson(res, 200, { received: true, ignored: true });
    }
    if (!/^\d+$/.test(notification.dataId)) {
      return sendJson(res, 400, { error: "Identificador de assinatura ou pagamento inválido." });
    }

    const providerResource = isPreapprovalEvent
      ? await getMercadoPagoResource("preapproval", notification.dataId, accessToken)
      : await getMercadoPagoResource("authorized_payments", notification.dataId, accessToken);
    const providerSubscriptionId = isPreapprovalEvent
      ? String(providerResource.id)
      : String(providerResource.preapproval_id || "");
    if (!/^\d+$/.test(providerSubscriptionId)) {
      return sendJson(res, 400, { error: "A notificação não está vinculada a uma assinatura válida." });
    }

    const supabase = getSupabaseAdmin();
    const { data: billing, error: billingError } = await supabase
      .from("billing_subscriptions")
      .select("empresa_id, plano, provider_subscription_id, status")
      .eq("provider_subscription_id", providerSubscriptionId)
      .maybeSingle();
    if (billingError) throw billingError;
    if (!billing || !BILLING_PLANS[billing.plano]) {
      console.error("Webhook não corresponde à assinatura registrada:", providerSubscriptionId);
      return sendJson(res, 409, { error: "A assinatura recebida não corresponde ao checkout registrado." });
    }

    const plan = BILLING_PLANS[billing.plano];
    let status;
    let nextPaymentDate;

    if (isPreapprovalEvent) {
      if (providerResource.external_reference !== billing.empresa_id) {
        return sendJson(res, 409, { error: "A referência da assinatura não corresponde à empresa registrada." });
      }
      const subscriptionStatus = mapMercadoPagoSubscriptionStatus(providerResource.status);
      status = subscriptionStatus === "canceled" || subscriptionStatus === "past_due"
        ? subscriptionStatus
        : billing.status === "active" ? "active" : "pending";
      nextPaymentDate = providerResource.next_payment_date || null;
    } else {
      const subscription = await getMercadoPagoResource("preapproval", providerSubscriptionId, accessToken);
      if (subscription.external_reference !== billing.empresa_id) {
        return sendJson(res, 409, { error: "A referência da assinatura não corresponde à empresa registrada." });
      }

      if (subscription.status === "cancelled" || subscription.status === "canceled") {
        status = "canceled";
      } else if (subscription.status === "paused") {
        status = "past_due";
      } else if (["approved", "processed"].includes(providerResource.status)) {
        if (
          Number(providerResource.transaction_amount) !== plan.amount ||
          providerResource.currency_id !== "BRL" ||
          billing.status === "canceled"
        ) {
          return sendJson(res, 409, { error: "A cobrança aprovada não corresponde a uma assinatura válida do RecebeAi." });
        }
        status = "active";
      } else if (providerResource.status === "rejected") {
        status = "past_due";
      } else {
        status = billing.status;
      }
      nextPaymentDate = subscription.next_payment_date || null;
    }

    const billingUpdate = {
      status,
      atualizado_em: new Date().toISOString(),
    };
    if (nextPaymentDate !== undefined) billingUpdate.proxima_cobranca_em = nextPaymentDate;
    const { error: billingUpdateError } = await supabase
      .from("billing_subscriptions")
      .update(billingUpdate)
      .eq("empresa_id", billing.empresa_id)
      .eq("provider_subscription_id", providerSubscriptionId);
    if (billingUpdateError) throw billingUpdateError;

    const companyUpdate = {
      subscription_status: status,
      atualizado_em: new Date().toISOString(),
    };
    if (status === "active") {
      companyUpdate.plano = billing.plano;
      companyUpdate.limite_titulos = plan.titleLimit;
    }
    const { error: companyUpdateError } = await supabase
      .from("empresas")
      .update(companyUpdate)
      .eq("id", billing.empresa_id);
    if (companyUpdateError) throw companyUpdateError;

    const eventKey = createHash("sha256")
      .update(`${notification.type}:${notification.dataId}:${providerResource.status}`)
      .digest("hex");
    const { error: eventError } = await supabase
      .from("billing_webhook_events")
      .upsert({
        event_key: eventKey,
        provider_subscription_id: providerSubscriptionId,
        provider_status: providerResource.status || "unknown",
      }, { onConflict: "event_key", ignoreDuplicates: true });
    if (eventError) throw eventError;

    return sendJson(res, 200, { received: true });
  } catch (error) {
    console.error("Falha ao processar webhook do Mercado Pago:", error.message);
    return sendJson(res, 500, { error: "Não foi possível processar a notificação de assinatura." });
  }
}
