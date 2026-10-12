import { MercadoPagoConfig, Payment } from "mercadopago";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Token do Mercado Pago não configurado." });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: token });
    const { query } = req;
    const topic = query.topic || query.type;
    const paymentId = query.id || query["data.id"];

    if (topic === "payment" && paymentId) {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status === "approved") {
        console.log(`Pagamento APROVADO! ID: ${paymentId}`);
        // AQUI: Atualize o status da assinatura do usuário no Supabase
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Erro no Webhook do Mercado Pago:", error);
    return res.status(500).json({ error: "Erro interno no Webhook" });
  }
}
