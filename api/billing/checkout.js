import { randomUUID } from "node:crypto";
import { BILLING_PLANS } from "../_lib/billing.js";
import { getAuthenticatedUser, getSupabaseAdmin, sendJson } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Método não permitido." });
  }

  try {
    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    const appBaseUrl = process.env.APP_BASE_URL;
    if (!mpAccessToken || !appBaseUrl) {
      throw new Error("Configure MP_ACCESS_TOKEN e APP_BASE_URL nas variáveis de ambiente do servidor.");
    }
    const parsedAppUrl = new URL(appBaseUrl);
    if (parsedAppUrl.protocol !== "https:" && parsedAppUrl.hostname !== "localhost") {
      throw new Error("APP_BASE_URL deve usar HTTPS.");
    }
    if (parsedAppUrl.username || parsedAppUrl.password || parsedAppUrl.pathname !== "/" || parsedAppUrl.search || parsedAppUrl.hash) {
      throw new Error("APP_BASE_URL deve conter somente a origem pública da aplicação.");
    }

    const supabase = getSupabaseAdmin();
    const user = await getAuthenticatedUser(req, supabase);
    if (!user) return sendJson(res, 401, { error: "Faça login novamente para iniciar o checkout." });

    const planId = req.body?.plan;
    const plan = BILLING_PLANS[planId];
    if (!plan) return sendJson(res, 400, { error: "Selecione um plano disponível para contratação." });

    const { data: company, error: companyError } = await supabase
      .from("empresas")
      .select("id, subscription_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (companyError) throw companyError;
    if (!company) return sendJson(res, 404, { error: "Não foi encontrada uma empresa vinculada à sua conta." });

    const { data: existing, error: existingError } = await supabase
      .from("billing_subscriptions")
      .select("plano, status, checkout_url")
      .eq("empresa_id", company.id)
      .maybeSingle();
    if (existingError) throw existingError;

    if (["active", "past_due"].includes(existing?.status)) {
      return sendJson(res, 409, { error: "Esta empresa já possui uma assinatura ativa ou com cobrança pendente. Não inicie outra assinatura para evitar cobranças duplicadas; consulte o gerenciamento da assinatura." });
    }
    if (existing?.status === "starting") {
      return sendJson(res, 409, { error: "Já existe um checkout sendo preparado. Aguarde alguns instantes e tente novamente." });
    }
    if (existing?.status === "pending" && existing.checkout_url) {
      if (existing.plano !== planId) {
        return sendJson(res, 409, { error: "Finalize ou cancele o checkout pendente antes de selecionar outro plano." });
      }
      return sendJson(res, 200, { checkoutUrl: existing.checkout_url });
    }

    const { error: startError } = await supabase
      .from("billing_subscriptions")
      .upsert({
        empresa_id: company.id,
        plano: planId,
        status: "starting",
        provider: "mercado_pago",
        checkout_url: null,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: "empresa_id" });
    if (startError) throw startError;

    let response;
    let subscription;
    try {
      response = await fetch("https://api.mercadopago.com/preapproval", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": randomUUID(),
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          reason: plan.name,
          external_reference: company.id,
          payer_email: user.email,
          notification_url: `${parsedAppUrl.origin}/api/billing/webhook`,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: plan.amount,
            currency_id: "BRL",
          },
          back_url: `${parsedAppUrl.origin}/planos?status=success`,
          status: "pending",
        }),
      });
      subscription = await response.json();
    } catch (error) {
      const { error: resetError } = await supabase
        .from("billing_subscriptions")
        .update({ status: "error", atualizado_em: new Date().toISOString() })
        .eq("empresa_id", company.id);
      if (resetError) console.error("Não foi possível liberar nova tentativa de checkout:", resetError.message);
      throw new Error("Não foi possível conectar ao Mercado Pago para iniciar o checkout.");
    }
    if (!response.ok || !subscription?.id || !subscription?.init_point) {
      const { error: resetError } = await supabase
        .from("billing_subscriptions")
        .update({ status: "error", atualizado_em: new Date().toISOString() })
        .eq("empresa_id", company.id);
      if (resetError) console.error("Não foi possível liberar nova tentativa de checkout:", resetError.message);
      console.error("Mercado Pago não criou a assinatura:", response.status, subscription?.message || subscription?.error || "resposta inválida");
      return sendJson(res, 502, { error: "O Mercado Pago não conseguiu iniciar a assinatura. Tente novamente mais tarde." });
    }

    const { error: saveError } = await supabase
      .from("billing_subscriptions")
      .update({
        provider_subscription_id: String(subscription.id),
        checkout_url: subscription.init_point,
        status: "pending",
        atualizado_em: new Date().toISOString(),
      })
      .eq("empresa_id", company.id);
    if (saveError) {
      console.error("Não foi possível salvar a assinatura iniciada no Mercado Pago:", saveError.message);
      try {
        const cancelResponse = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(subscription.id)}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${mpAccessToken}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({ status: "cancelled" }),
        });
        if (!cancelResponse.ok) {
          console.error("Não foi possível cancelar a assinatura sem registro após falha no banco:", cancelResponse.status);
        }
      } catch (cancelError) {
        console.error("Falha ao tentar cancelar assinatura sem registro:", cancelError.message);
      }
      return sendJson(res, 500, { error: "O checkout foi criado, mas não foi possível registrar a assinatura. Entre em contato com o suporte antes de tentar novamente." });
    }

    return sendJson(res, 200, { checkoutUrl: subscription.init_point });
  } catch (error) {
    console.error("Falha ao iniciar checkout:", error.message);
    return sendJson(res, 500, { error: error.message || "Não foi possível iniciar o checkout." });
  }
}
