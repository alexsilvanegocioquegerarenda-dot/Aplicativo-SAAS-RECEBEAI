import { getAuthenticatedUser, getSupabaseAdmin, sendJson } from "../_lib/supabase.js";

const reviewIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getBillingAdmins() {
  const configuredEmails = process.env.BILLING_ADMIN_EMAILS;
  if (!configuredEmails) {
    throw new Error("Configure BILLING_ADMIN_EMAILS no ambiente de servidor.");
  }
  return new Set(configuredEmails.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

function isBillingAdmin(user) {
  return Boolean(user.email_confirmed_at) &&
    getBillingAdmins().has(user.email?.trim().toLowerCase());
}

async function listManualReviews(supabase) {
  const { data: reviews, error: reviewsError } = await supabase
    .from("manual_billing_reviews")
    .select("id, empresa_id, provider_subscription_id, mensagem, status, criado_em")
    .eq("status", "pending")
    .order("criado_em", { ascending: true })
    .limit(100);
  if (reviewsError) throw reviewsError;
  if (!reviews.length) return [];

  const companyIds = [...new Set(reviews.map((review) => review.empresa_id))];
  const [{ data: companies, error: companiesError }, { data: billingRows, error: billingError }] = await Promise.all([
    supabase.from("empresas").select("id, razao_social, email").in("id", companyIds),
    supabase.from("billing_subscriptions").select("empresa_id, plano, status").in("empresa_id", companyIds),
  ]);
  if (companiesError) throw companiesError;
  if (billingError) throw billingError;

  const companiesById = new Map(companies.map((company) => [company.id, company]));
  const billingByCompanyId = new Map(billingRows.map((billing) => [billing.empresa_id, billing]));
  return reviews.map((review) => ({
    ...review,
    company: companiesById.get(review.empresa_id) || null,
    billing: billingByCompanyId.get(review.empresa_id) || null,
  }));
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return sendJson(res, 405, { error: "Método não permitido." });
  }

  try {
    const supabase = getSupabaseAdmin();
    const user = await getAuthenticatedUser(req, supabase);
    if (!user) return sendJson(res, 401, { error: "Faça login novamente para continuar." });

    if (req.method === "GET") {
      if (!isBillingAdmin(user)) return sendJson(res, 403, { error: "Acesso restrito à equipe de cobrança." });
      return sendJson(res, 200, { reviews: await listManualReviews(supabase) });
    }

    const action = req.body?.action;
    if (action === "request") {
      const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
      if (message.length > 1000) return sendJson(res, 400, { error: "A mensagem deve ter no máximo 1.000 caracteres." });

      const { data: company, error: companyError } = await supabase
        .from("empresas")
        .select("id, subscription_status")
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
      if (
        !billing?.provider_subscription_id ||
        !["pending", "past_due"].includes(billing.status) ||
        !["pending", "past_due"].includes(company.subscription_status)
      ) {
        return sendJson(res, 409, { error: "Não há assinatura pendente elegível para revisão manual." });
      }

      const { data: review, error: insertError } = await supabase
        .from("manual_billing_reviews")
        .insert({
          empresa_id: company.id,
          solicitado_por: user.id,
          provider_subscription_id: billing.provider_subscription_id,
          mensagem: message || null,
        })
        .select("id, status, criado_em")
        .single();
      if (insertError?.code === "23505") {
        return sendJson(res, 409, { error: "Já existe uma solicitação de revisão aguardando análise." });
      }
      if (insertError) throw insertError;
      return sendJson(res, 201, { review });
    }

    if (!isBillingAdmin(user)) return sendJson(res, 403, { error: "Acesso restrito à equipe de cobrança." });
    const reviewId = req.body?.reviewId;
    const decision = req.body?.decision;
    const reviewNote = typeof req.body?.reviewNote === "string" ? req.body.reviewNote.trim() : "";
    if (!reviewIdPattern.test(reviewId || "") || !["approved", "rejected"].includes(decision)) {
      return sendJson(res, 400, { error: "Solicitação ou decisão de revisão inválida." });
    }
    if (reviewNote.length < 5 || reviewNote.length > 1000) {
      return sendJson(res, 400, { error: "Registre uma justificativa entre 5 e 1.000 caracteres." });
    }

    const { error: reviewError } = await supabase.rpc("review_manual_billing_request", {
      p_review_id: reviewId,
      p_reviewer_user_id: user.id,
      p_reviewer_email: user.email,
      p_decision: decision,
      p_review_note: reviewNote,
    });
    if (reviewError) {
      if (reviewError.message?.includes("já foi revisada") || reviewError.message?.includes("não está pendente")) {
        return sendJson(res, 409, { error: "A solicitação já foi revisada ou a assinatura não está mais pendente." });
      }
      throw reviewError;
    }
    return sendJson(res, 200, { reviewId, status: decision });
  } catch (error) {
    console.error("Falha no fluxo de revisão manual:", error.message);
    return sendJson(res, 500, { error: error.message || "Não foi possível processar a revisão manual." });
  }
}
