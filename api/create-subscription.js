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

    // Validação dos dados de entrada
    if (!price || !user_email) {
      return res.status(400).json({
        error: "Parâmetros obrigatórios ausentes: price e user_email são necessários.",
      });
    }

    // Inicializa a SDK do Mercado Pago com o Access Token das variáveis de ambiente
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN não está configurado nas variáveis de ambiente.");
      return res.status(500).json({ error: "Erro de configuração no servidor de pagamento." });
    }

    const client = new MercadoPagoConfig({
      accessToken: accessToken,
    });

    const preapproval = new PreApproval(client);

    // Domínio dinâmico para URLs de retorno
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Monta a estrutura da assinatura recorrente (Preapproval)
    const subscriptionBody = {
      reason: title || "RecebeAí - Assinatura de Plano",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: Number(price),
        currency_id: "BRL",
      },
      back_url: `${baseUrl}/dashboard?subscription=success`,
      payer_email: user_email,
      external_reference: JSON.stringify({
        user_id: user_id || null,
        plano_id: plano_id || null,
      }),
      status: "authorized",
    };

    // Solicita a criação da assinatura recorrente ao Mercado Pago
    const response = await preapproval.create({ body: subscriptionBody });

    // Retorna a URL de checkout (init_point)
    return res.status(200).json({
      init_point: response.init_point,
      id: response.id,
      status: response.status,
    });
  } catch (error) {
    console.error("Erro ao criar assinatura no Mercado Pago:", error);
    return res.status(500).json({
      error: "Ocorreu um erro ao gerar a assinatura recorrente.",
      details: error.message || error,
    });
  }
}
