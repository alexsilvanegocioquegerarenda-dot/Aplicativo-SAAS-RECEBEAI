import { MercadoPagoConfig, PreApproval, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

// Inicializa o cliente do Supabase utilizando a Service Role Key (com privilégios de escrita administrativa)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Apenas notificações POST são processadas
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { type, action, data } = req.body;
    const topic = req.query.topic || req.query.type || type;
    const resourceId = data?.id || req.query.id || req.query["data.id"];

    // Ignora requisições de teste sem ID de recurso
    if (!resourceId) {
      return res.status(200).json({ received: true, note: "No resource ID provided" });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN não está configurado.");
      return res.status(500).json({ error: "Missing Access Token" });
    }

    const client = new MercadoPagoConfig({ accessToken });

    // -------------------------------------------------------------
    // CASO 1: Notificação de Assinatura Recorrente (Preapproval)
    // -------------------------------------------------------------
    if (topic === "subscription_preapproval" || action === "created" || action === "updated") {
      const preapproval = new PreApproval(client);
      const subscriptionData = await preapproval.get({ id: resourceId });

      if (subscriptionData) {
        let externalRef = {};
        try {
          externalRef = JSON.parse(subscriptionData.external_reference || "{}");
        } catch (e) {
          console.warn("External reference não é um JSON válido:", subscriptionData.external_reference);
        }

        const userId = externalRef.user_id;
        const mpStatus = subscriptionData.status; // "authorized", "paused", "cancelled"

        // Mapeamento do status do Mercado Pago para o RecebeAí
        let billingStatus = "inactive";
        if (mpStatus === "authorized") {
          billingStatus = "active";
        } else if (mpStatus === "paused") {
          billingStatus = "past_due";
        } else if (mpStatus === "cancelled") {
          billingStatus = "inactive";
        }

        // Atualiza a tabela de usuários/assinaturas no Supabase
        if (userId) {
          const { error } = await supabase
            .from("profiles") // Altere para a sua tabela de usuários se for diferente (ex: 'users' ou 'subscriptions')
            .update({
              billingStatus: billingStatus,
              subscription_status: billingStatus,
              mercadopago_subscription_id: subscriptionData.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (error) {
            console.error("Erro ao atualizar o Supabase para assinatura:", error);
          } else {
            console.log(`Sucesso: Usuário ${userId} atualizado para status '${billingStatus}'.`);
          }
        }
      }
    }

    // -------------------------------------------------------------
    // CASO 2: Notificação de Pagamento Individual (Payment/Invoice)
    // -------------------------------------------------------------
    if (topic === "payment" || topic === "merchant_order") {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: resourceId });

      if (paymentData) {
        let externalRef = {};
        try {
          externalRef = JSON.parse(paymentData.external_reference || "{}");
        } catch (e) {
          console.warn("External reference não é JSON válido:", paymentData.external_reference);
        }

        const userId = externalRef.user_id;
        const paymentStatus = paymentData.status; // "approved", "pending", "rejected"

        let billingStatus = "inactive";
        if (paymentStatus === "approved") {
          billingStatus = "active";
        } else if (paymentStatus === "rejected") {
          billingStatus = "past_due";
        }

        if (userId && paymentStatus === "approved") {
          const { error } = await supabase
            .from("profiles")
            .update({
              billingStatus: billingStatus,
              subscription_status: billingStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (error) {
            console.error("Erro ao atualizar pagamento no Supabase:", error);
          }
        }
      }
    }

    // Responde 200 OK rapidamente para o Mercado Pago não tentar reenviar a notificação
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Erro ao processar Webhook do Mercado Pago:", error);
    // Retorna 200 para evitar retentativas infinitas caso seja um payload inválido
    return res.status(200).json({ error: error.message });
  }
}
