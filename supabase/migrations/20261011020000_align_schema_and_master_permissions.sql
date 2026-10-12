-- ==============================================================================
-- RECEBEAI - ALINHAMENTO DE SCHEMA, PERMISSÕES MASTER E DADOS INICIAIS
-- ==============================================================================

-- 1. Alinhamento de colunas da tabela public.templates_mensagem
ALTER TABLE public.templates_mensagem
  ADD COLUMN IF NOT EXISTS nome VARCHAR(150),
  ADD COLUMN IF NOT EXISTS nivel VARCHAR(20) DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS tom VARCHAR(100),
  ADD COLUMN IF NOT EXISTS conteudo TEXT;

UPDATE public.templates_mensagem
SET nome = COALESCE(nome, titulo),
    conteudo = COALESCE(conteudo, texto),
    nivel = COALESCE(nivel, prioridade, 'media')
WHERE nome IS NULL OR conteudo IS NULL;

-- 2. Alinhamento de colunas da tabela public.conversas_ia
ALTER TABLE public.conversas_ia
  ADD COLUMN IF NOT EXISTS pergunta TEXT,
  ADD COLUMN IF NOT EXISTS resposta TEXT,
  ADD COLUMN IF NOT EXISTS created_date TIMESTAMPTZ DEFAULT NOW();

-- 3. Alinhamento de colunas da tabela public.importacoes
ALTER TABLE public.importacoes
  ADD COLUMN IF NOT EXISTS nome_arquivo VARCHAR(255),
  ADD COLUMN IF NOT EXISTS origem VARCHAR(30) DEFAULT 'csv',
  ADD COLUMN IF NOT EXISTS quantidade_registros INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_total NUMERIC(12,2) DEFAULT 0.00;

UPDATE public.importacoes
SET nome_arquivo = COALESCE(nome_arquivo, arquivo_nome),
    quantidade_registros = COALESCE(quantidade_registros, total_registros)
WHERE nome_arquivo IS NULL;

-- 4. Alinhamento de colunas da tabela public.metas_recuperacao
ALTER TABLE public.metas_recuperacao
  ADD COLUMN IF NOT EXISTS periodo_inicio DATE,
  ADD COLUMN IF NOT EXISTS periodo_fim DATE,
  ADD COLUMN IF NOT EXISTS valor_meta NUMERIC(12,2);

UPDATE public.metas_recuperacao
SET valor_meta = COALESCE(valor_meta, meta_valor)
WHERE valor_meta IS NULL;

-- 5. Alinhamento de colunas da tabela public.recebiveis
ALTER TABLE public.recebiveis
  ADD COLUMN IF NOT EXISTS cliente_nome VARCHAR(255),
  ADD COLUMN IF NOT EXISTS importacao_id VARCHAR(100);

-- 6. Atualização do trigger protect_company_billing_fields para permitir Master Admin
CREATE OR REPLACE FUNCTION public.protect_company_billing_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_email TEXT;
  v_is_master BOOLEAN := FALSE;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT lower(trim(email)) INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();

    IF v_user_email = 'financeiro.saasrecebeai@gmail.com'
       OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' THEN
      v_is_master := TRUE;
    END IF;
  END IF;

  IF auth.uid() IS NOT NULL AND NOT v_is_master THEN
    IF TG_OP = 'INSERT' THEN
      NEW.plano := 'essencial';
      NEW.limite_titulos := 300;
      NEW.subscription_status := 'pending';
    ELSIF NEW.plano IS DISTINCT FROM OLD.plano
      OR NEW.limite_titulos IS DISTINCT FROM OLD.limite_titulos
      OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
      RAISE EXCEPTION 'Plano e estado da assinatura só podem ser alterados pelo serviço de cobrança.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF v_is_master THEN
    NEW.plano := COALESCE(NEW.plano, 'enterprise');
    NEW.limite_titulos := COALESCE(NEW.limite_titulos, 99999);
    NEW.subscription_status := 'active';
  END IF;

  RETURN NEW;
END;
$$;

-- 7. Garantir que a empresa do Master Admin esteja ativa e com plano enterprise
DO $$
DECLARE
  v_master_id UUID;
  v_empresa_id UUID;
BEGIN
  SELECT id INTO v_master_id
  FROM auth.users
  WHERE lower(trim(email)) = 'financeiro.saasrecebeai@gmail.com';

  IF v_master_id IS NOT NULL THEN
    SELECT id INTO v_empresa_id
    FROM public.empresas
    WHERE user_id = v_master_id
    LIMIT 1;

    IF v_empresa_id IS NOT NULL THEN
      UPDATE public.empresas
      SET plano = 'enterprise',
          limite_titulos = 99999,
          subscription_status = 'active',
          razao_social = 'RecebeAi Tecnologia',
          email = 'financeiro.saasrecebeai@gmail.com'
      WHERE id = v_empresa_id;
    ELSE
      INSERT INTO public.empresas (user_id, razao_social, cnpj, email, plano, limite_titulos, subscription_status)
      VALUES (v_master_id, 'RecebeAi Tecnologia', '42.000.111/0001-99', 'financeiro.saasrecebeai@gmail.com', 'enterprise', 99999, 'active')
      RETURNING id INTO v_empresa_id;
    END IF;
  END IF;
END;
$$;

-- 8. Função para semear réguas e templates padrão
CREATE OR REPLACE FUNCTION public.seed_default_company_data(p_empresa_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.reguas WHERE empresa_id = p_empresa_id) THEN
    INSERT INTO public.reguas (empresa_id, nome, dias_gatilho, canal, ativo, mensagem)
    VALUES
      (p_empresa_id, 'Lembrete Preventivo (D-3)', -3, 'whatsapp', true, 'Olá {{cliente}}, tudo bem? Lembramos que sua fatura {{nota_fiscal}} no valor de {{valor}} vence em {{vencimento}}. Pague via PIX: {{chave_pix}}'),
      (p_empresa_id, 'Aviso no Vencimento (D0)', 0, 'whatsapp', true, 'Olá {{cliente}}! Sua fatura {{nota_fiscal}} de {{valor}} vence hoje. Evite juros e encargos pagando agora: {{link_pagamento}}'),
      (p_empresa_id, 'Cobrança Amigável (D+3)', 3, 'whatsapp', true, 'Olá {{cliente}}, não identificamos a compensação da sua fatura {{nota_fiscal}} ({{valor}}), vencida em {{vencimento}}. Caso já tenha pago, por favor desconsidere!'),
      (p_empresa_id, 'Cobrança Incisiva (D+10)', 10, 'whatsapp', true, 'Aviso importante: Sua fatura {{nota_fiscal}} encontra-se com 10 dias de atraso. Regularize sua situação para evitar bloqueios. Chave PIX: {{chave_pix}}');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.templates_mensagem WHERE empresa_id = p_empresa_id) THEN
    INSERT INTO public.templates_mensagem (empresa_id, titulo, texto, nome, nivel, tom, conteudo, ativo)
    VALUES
      (p_empresa_id, 'Aviso Preventivo - Baixa Prioridade', 'Olá, {cliente}! Notamos que a fatura {nota_fiscal} no valor de {valor} venceu recentemente há {dias} dias. Segue nossa chave PIX: {pix}', 'Aviso Preventivo - Baixa Prioridade', 'baixa', 'Amigável e preventivo', 'Olá, {cliente}! Notamos que a fatura {nota_fiscal} no valor de {valor} venceu recentemente há {dias} dias. Segue nossa chave PIX para quitação facilitada: {pix}. Caso já tenha efetuado o pagamento, por favor desconsidere este aviso.', true),
      (p_empresa_id, 'Cobrança Regular - Média Prioridade', 'Prezado(a) {cliente}, constatamos uma pendência referente à fatura {nota_fiscal}, vencida há {dias} dias no total de {valor}. Chave PIX: {pix}', 'Cobrança Regular - Média Prioridade', 'media', 'Educado, formal e persistente', 'Prezado(a) {cliente}, constatamos uma pendência financeira referente à fatura {nota_fiscal}, vencida há {dias} dias no total de {valor}. Solicitamos a gentileza de regularizar a situação hoje mesmo para manter sua conta e limite ativos. Chave PIX: {pix}', true),
      (p_empresa_id, 'Aviso Urgente - Alta Prioridade', 'URGENTE: {cliente}, o título {nota_fiscal} ({valor}) encontra-se em atraso grave de {dias} dias. Liquidação via PIX: {pix}', 'Aviso Urgente - Alta Prioridade', 'alta', 'Firme, assertivo com impacto', 'URGENTE: {cliente}, o título {nota_fiscal} ({valor}) encontra-se em atraso grave de {dias} dias. Para evitar protesto em cartório e bloqueio comercial imediato, entre em contato imediatamente ou realize a liquidação via PIX: {pix}.', true);
  END IF;
END;
$$;

-- 9. Semear réguas e templates na empresa do Master Admin
DO $$
DECLARE
  v_master_id UUID;
  v_empresa_id UUID;
BEGIN
  SELECT id INTO v_master_id
  FROM auth.users
  WHERE lower(trim(email)) = 'financeiro.saasrecebeai@gmail.com';

  IF v_master_id IS NOT NULL THEN
    SELECT id INTO v_empresa_id
    FROM public.empresas
    WHERE user_id = v_master_id
    LIMIT 1;

    IF v_empresa_id IS NOT NULL THEN
      PERFORM public.seed_default_company_data(v_empresa_id);
    END IF;
  END IF;
END;
$$;
