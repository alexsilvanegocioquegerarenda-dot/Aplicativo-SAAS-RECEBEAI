import { supabase } from "@/api/supabaseClient";

export async function startMercadoPagoCheckout(plan) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error("Faça login novamente para iniciar a assinatura.");

  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Não foi possível iniciar o checkout.");
  if (!result.checkoutUrl || !/^https:\/\/(www\.)?mercadopago\.com(\.br)?\//i.test(result.checkoutUrl)) {
    throw new Error("O servidor retornou um endereço de checkout inválido.");
  }
  window.location.assign(result.checkoutUrl);
}

export async function fetchBillingStatus() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error("Faça login novamente para consultar a assinatura.");

  const response = await fetch("/api/billing/status", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Não foi possível consultar a assinatura.");
  return result;
}

export async function cancelMercadoPagoSubscription() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error("Faça login novamente para cancelar a assinatura.");

  const response = await fetch("/api/billing/cancel", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Não foi possível cancelar a assinatura.");
  return result;
}

async function callManualReviewApi(accessToken, options = {}) {
  const response = await fetch("/api/billing/manual-review", {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Não foi possível acessar a revisão manual.");
  return result;
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.access_token) throw new Error("Faça login novamente para continuar.");
  return data.session.access_token;
}

export async function requestManualBillingReview(message) {
  const accessToken = await getAccessToken();
  return callManualReviewApi(accessToken, {
    method: "POST",
    body: JSON.stringify({ action: "request", message }),
  });
}

export async function getManualBillingReviews() {
  const accessToken = await getAccessToken();
  return callManualReviewApi(accessToken, { method: "GET" });
}

export async function decideManualBillingReview({ reviewId, decision, reviewNote }) {
  const accessToken = await getAccessToken();
  return callManualReviewApi(accessToken, {
    method: "POST",
    body: JSON.stringify({ reviewId, decision, reviewNote }),
  });
}
