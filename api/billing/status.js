import { getAuthenticatedUser, getSupabaseAdmin, sendJson } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Método não permitido." });
  }

  try {
    const supabase = getSupabaseAdmin();
    const user = await getAuthenticatedUser(req, supabase);
    if (!user) return sendJson(res, 401, { error: "Faça login novamente para consultar a assinatura." });

    const { data: company, error: companyError } = await supabase
      .from("empresas")
      .select("id, plano, subscription_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (companyError) throw companyError;
    if (!company) return sendJson(res, 404, { error: "Não foi encontrada uma empresa vinculada à sua conta." });

    const { data: billing, error: billingError } = await supabase
      .from("billing_subscriptions")
      .select("plano, status, atualizado_em, provider_subscription_id")
      .eq("empresa_id", company.id)
      .maybeSingle();
    if (billingError) throw billingError;

    const { data: manualReview, error: manualReviewError } = await supabase
      .from("manual_billing_reviews")
      .select("status")
      .eq("empresa_id", company.id)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (manualReviewError) throw manualReviewError;

    return sendJson(res, 200, {
      plan: billing?.plano || company.plano,
      status: billing?.status || company.subscription_status || "pending",
      canCancel: Boolean(
        billing?.provider_subscription_id &&
        ["active", "past_due"].includes(billing.status)
      ),
      canRequestManualReview: Boolean(
        billing?.provider_subscription_id &&
        ["pending", "past_due"].includes(billing.status) &&
        company.subscription_status !== "active" &&
        manualReview?.status !== "pending"
      ),
      manualReviewStatus: manualReview?.status || null,
      updatedAt: billing?.atualizado_em || null,
    });
  } catch (error) {
    console.error("Falha ao consultar assinatura:", error.message);
    return sendJson(res, 500, { error: "Não foi possível consultar o estado da assinatura." });
  }
}
