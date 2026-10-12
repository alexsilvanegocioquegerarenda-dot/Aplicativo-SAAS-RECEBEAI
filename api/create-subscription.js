import { MercadoPagoConfig, PreApproval } from "mercadopago";

export default async function handler(req, res) {
  // Configuração dos cabeçalhos CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Tratamento da requisição preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Permite apenas requisições POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  try {
    const { title, price, user_id, user_email, plano_id } = req.body;

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN não está configurado.");
      return res.status(500).json({ error: "MERCADOPAGO_ACCESS_TOKEN não configurado nas variáveis de ambiente." });
    }

    // Garante um e-mail válido para a API do Mercado Pago
    const payerEmail = user_email && user_email.includes("@") 
      ? user_email 
      : "cliente_teste_recebeai@testuser.com";

    const client = new MercadoPagoConfig({ accessToken });
    const preapproval = new PreApproval(client);

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const subscriptionBody = {
      reason: title || "RecebeAí - Assinatura de Plano",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: Number(price),
        currency_id: "BRL",
      },
      back_url: `${baseUrl}/dashboard?subscription=success`,
      payer_email: payerEmail,
      external_reference: JSON.stringify({
        user_id: user_id || "guest",
        plano_id: plano_id || "desconhecido",
      }),
      status: "authorized",
    };

    const response = await preapproval.create({ body: subscriptionBody });

    if (response && response.init_point) {
      return res.status(200).json({
        init_point: response.init_point,
        id: response.id,
        status: response.status,
      });
    } else {
      console.error("Resposta do Mercado Pago sem init_point:", response);
      return res.status(400).json({
        error: "Não foi possível gerar a URL de pagamento no Mercado Pago.",
        details: response,
      });
    }
  } catch (error) {
    console.error("Erro detalhado ao criar assinatura:", error);
    return res.status(500).json({
      error: "Ocorreu um erro ao gerar a assinatura recorrente.",
      message: error.message || error,
      cause: error.cause || null,
    });
  }
}
