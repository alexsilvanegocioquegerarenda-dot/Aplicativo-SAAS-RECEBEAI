import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req, res) {
  // Configura cabeçalhos de CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    console.error("ERRO: MERCADOPAGO_ACCESS_TOKEN não configurado nas variáveis da Vercel.");
    return res.status(500).json({ 
      error: "Variável MERCADOPAGO_ACCESS_TOKEN não foi configurada no painel da Vercel." 
    });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: token });
    const { title, price, quantity, user_id, user_email } = req.body || {};

    if (!price) {
      return res.status(400).json({ error: "Preço inválido para o checkout." });
    }

    const host = req.headers.host || "aplicativo-saas-recebeai.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: title || "Assinatura RecebeAí",
            unit_price: Number(price),
            quantity: Number(quantity) || 1,
            currency_id: "BRL",
          },
        ],
        payer: user_email ? { email: user_email } : undefined,
        external_reference: user_id || "guest",
        back_urls: {
          success: `${baseUrl}/dashboard`,
          failure: `${baseUrl}/planos`,
          pending: `${baseUrl}/dashboard`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/webhook`,
      },
    });

    if (!result?.init_point) {
      throw new Error("Resposta inválida do Mercado Pago ao criar a preferência.");
    }

    return res.status(200).json({ init_point: result.init_point });
  } catch (error) {
    console.error("Erro interno no checkout Mercado Pago:", error);
    return res.status(500).json({
      error: error?.message || "Erro de comunicação com a API do Mercado Pago.",
    });
  }
}
