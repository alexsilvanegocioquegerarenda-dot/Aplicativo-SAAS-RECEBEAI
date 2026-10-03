import React, { useEffect, useState } from "react";
import { decideManualBillingReview, getManualBillingReviews } from "@/lib/billing";

export default function AdminPagamentos() {
  const [reviews, setReviews] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingReviewId, setSavingReviewId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getManualBillingReviews();
      setReviews(result.reviews);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const handleDecision = async (review, decision) => {
    const reviewNote = notes[review.id]?.trim() || "";
    if (reviewNote.length < 5) {
      setError("Registre uma justificativa com pelo menos 5 caracteres.");
      return;
    }
    if (decision === "approved" && !window.confirm(
      "Confirme somente depois de verificar no painel do Mercado Pago que a assinatura está autorizada e que a cobrança inicial foi aprovada. Deseja ativar esta empresa?"
    )) return;

    setSavingReviewId(review.id);
    setError("");
    setNotice("");
    try {
      await decideManualBillingReview({ reviewId: review.id, decision, reviewNote });
      setReviews((current) => current.filter((item) => item.id !== review.id));
      setNotice(decision === "approved"
        ? "Assinatura aprovada e ativada. A decisão ficou registrada para auditoria."
        : "Solicitação rejeitada. A decisão ficou registrada para auditoria.");
    } catch (decisionError) {
      setError(decisionError.message);
    } finally {
      setSavingReviewId(null);
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Revisão manual de pagamentos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Acesso restrito no servidor aos e-mails listados em BILLING_ADMIN_EMAILS.
        </p>
      </header>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        Aprove somente após verificar no Mercado Pago o ID da assinatura, a autorização e a primeira cobrança aprovada.
        A observação da empresa não é prova de pagamento.
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <button
        type="button"
        onClick={loadReviews}
        disabled={loading}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
      >
        {loading ? "Carregando..." : "Atualizar fila"}
      </button>

      {!loading && reviews.length === 0 && !error && (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Não há solicitações aguardando revisão.
        </p>
      )}

      <section className="space-y-4">
        {reviews.map((review) => (
          <article key={review.id} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div>
              <h2 className="font-semibold text-slate-900">{review.company?.razao_social || "Empresa sem nome"}</h2>
              <p className="text-sm text-slate-600">{review.company?.email || "E-mail não informado"}</p>
              <dl className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
                <div><dt className="font-semibold">Plano</dt><dd>{review.billing?.plano || "Indisponível"}</dd></div>
                <div><dt className="font-semibold">Situação</dt><dd>{review.billing?.status || "Indisponível"}</dd></div>
                <div><dt className="font-semibold">ID da assinatura Mercado Pago</dt><dd className="break-all font-mono">{review.provider_subscription_id}</dd></div>
                <div><dt className="font-semibold">Solicitado em</dt><dd>{new Date(review.criado_em).toLocaleString("pt-BR")}</dd></div>
              </dl>
              {review.mensagem && (
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  {review.mensagem}
                </p>
              )}
            </div>

            <label className="block text-xs font-medium text-slate-700">
              Justificativa da decisão (obrigatória)
              <textarea
                value={notes[review.id] || ""}
                onChange={(event) => setNotes((current) => ({ ...current, [review.id]: event.target.value }))}
                maxLength={1000}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleDecision(review, "approved")}
                disabled={savingReviewId === review.id}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                Aprovar após verificar pagamento
              </button>
              <button
                type="button"
                onClick={() => handleDecision(review, "rejected")}
                disabled={savingReviewId === review.id}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
              >
                Rejeitar solicitação
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
