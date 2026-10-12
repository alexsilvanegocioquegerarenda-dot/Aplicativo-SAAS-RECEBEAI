export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  try {
    const { title, price, user_id, user_email, plano_id } = req.body || {};

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ error: "MERCADOPAGO_ACCESS_TOKEN não configurado no servidor Vercel." });
    }

    const payerEmail = user_email && user_email.includes("@") 
      ? user_email 
      : "cliente_teste_recebeai@testuser.com";

    const formattedPrice = Number(parseFloat(price || 29.90).toFixed(2));

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const payload = {
      reason: title || "RecebeAí - Assinatura de Plano",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: formattedPrice,
        currency_id: "BRL"
      },
      back_url: `${baseUrl}/dashboard?subscription=success`,
      payer_email: payerEmail,
      external_reference: JSON.stringify({
        user_id: user_id || "guest",
        plano_id: plano_id || "desconhecido"
      }),
      status: "authorized"
    };

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Erro retornado da API do Mercado Pago:", data);
      return res.status(mpResponse.status).json({
        error: "Recusado pelo Mercado Pago",
        details: data
      });
    }

    return res.status(200).json({
      init_point: data.init_point,
      id: data.id,
      status: data.status
    });

  } catch (error) {
    console.error("Erro interno:", error);
    return res.status(500).json({
      error: "Erro interno no servidor.",
      message: error.message
    });
  }
}
