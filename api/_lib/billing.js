import { createHmac, timingSafeEqual } from "node:crypto";

export const BILLING_PLANS = {
  essencial: {
    name: "RecebeAi Essencial",
    amount: 149,
    titleLimit: 300,
  },
  profissional: {
    name: "RecebeAi Profissional",
    amount: 349,
    titleLimit: 2000,
  },
};

export function getMercadoPagoNotification(req) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const dataId = req.query?.["data.id"] || body.data?.id;
  const type = req.query?.type || body.type || body.topic;
  return {
    dataId: typeof dataId === "string" ? dataId.toLowerCase() : "",
    requestId: req.headers?.["x-request-id"] || "",
    signature: req.headers?.["x-signature"] || "",
    type: typeof type === "string" ? type : "",
  };
}

export function verifyMercadoPagoSignature({ dataId, requestId, signature, secret }) {
  if (!dataId || !requestId || !signature || !secret) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const separator = part.indexOf("=");
      return separator < 0 ? ["", ""] : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
    }).filter(([key, value]) => key && value)
  );
  if (!parts.ts || !parts.v1 || !/^[a-f\d]{64}$/i.test(parts.v1)) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest();
  const received = Buffer.from(parts.v1, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function mapMercadoPagoSubscriptionStatus(status) {
  switch (status) {
    case "authorized":
      return "pending";
    case "paused":
      return "past_due";
    case "cancelled":
    case "canceled":
      return "canceled";
    default:
      return "pending";
  }
}
