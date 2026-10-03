import { getAuthenticatedUser, getSupabaseAdmin, sendJson } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Método não permitido." });
  }

  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) throw new Error("Configure MP_ACCESS_TOKEN nas variáveis de ambiente do servidor.");

    const supabase = getSupabaseAdmin();
    const user = await getAuthenticatedUser(req, supabase);
    if (!user) return sendJson(res, 401, { error: "Faça login novamente para cancelar a assinatura." });

    const { data: company, error: companyError } = await supabase
      .from("empresas")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (companyError) throw companyError;
    if (!company) return sendJson(res, 404, { error: "Não foi encontrada uma empresa vinculada à sua conta." });

    const { data: billing, error: billingError } = await supabase
      .from("billing_subscriptions")
      .select("provider_subscription_id, status")
      .eq("empresa_id", company.id)
      .maybeSingle();
    if (billingError) throw billingError;
    if (!billing?.provider_subscription_id || !["active", "past_due"].includes(billing.status)) {
      return sendJson(res, 409, { error: "Não foi encontrada uma assinatura ativa para cancelar." });
    }

    const response = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(billing.provider_subscription_id)}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ status: "cancelled" }),
    });
    const result = await response.json();
    if (!response.ok || !["cancelled", "canceled"].includes(result?.status)) {
      console.error("Mercado Pago não confirmou o cancelamento:", response.status, result?.message || result?.status || "resposta inválida");
      return sendJson(res, 502, { error: "O Mercado Pago não confirmou o cancelamento. A assinatura continua sem alteração." });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("billing_subscriptions")
      .update({ status: "canceled", atualizado_em: now })
      .eq("empresa_id", company.id)
      .eq("provider_subscription_id", billing.provider_subscription_id);
    if (updateError) throw updateError;

    const { error: companyUpdateError } = await supabase
      .from("empresas")
      .update({ subscription_status: "canceled", atualizado_em: now })
      .eq("id", company.id);
    if (companyUpdateError) throw companyUpdateError;

    return sendJson(res, 200, { status: "canceled" });
  } catch (error) {
    console.error("Falha ao cancelar assinatura:", error.message);
    return sendJson(res, 500, { error: "Não foi possível cancelar a assinatura." });
  }
}
