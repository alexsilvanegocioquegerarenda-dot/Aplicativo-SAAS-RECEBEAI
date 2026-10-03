ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) NOT NULL DEFAULT 'active';

ALTER TABLE public.empresas
  DROP CONSTRAINT IF EXISTS empresas_subscription_status_check;

ALTER TABLE public.empresas
  ADD CONSTRAINT empresas_subscription_status_check
  CHECK (subscription_status IN ('pending', 'active', 'past_due', 'canceled'));

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  empresa_id UUID PRIMARY KEY REFERENCES public.empresas(id) ON DELETE CASCADE,
  plano VARCHAR(20) NOT NULL CHECK (plano IN ('essencial', 'profissional')),
  provider VARCHAR(30) NOT NULL DEFAULT 'mercado_pago',
  provider_subscription_id VARCHAR(100) UNIQUE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('starting', 'pending', 'active', 'past_due', 'canceled', 'error')),
  checkout_url TEXT,
  proxima_cobranca_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.billing_webhook_events (
  event_key VARCHAR(64) PRIMARY KEY,
  provider_subscription_id VARCHAR(100) NOT NULL,
  provider_status VARCHAR(30) NOT NULL,
  recebido_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
DECLARE
  invalid_links TEXT[];
BEGIN
  SELECT ARRAY_AGG(link_name)
  INTO invalid_links
  FROM (
    SELECT 'recebiveis.cliente_id' AS link_name
    WHERE EXISTS (
      SELECT 1 FROM public.recebiveis r
      JOIN public.clientes c ON c.id = r.cliente_id
      WHERE c.empresa_id <> r.empresa_id
    )
    UNION ALL
    SELECT 'cobrancas.cliente_id'
    WHERE EXISTS (
      SELECT 1 FROM public.cobrancas c
      JOIN public.clientes cl ON cl.id = c.cliente_id
      WHERE cl.empresa_id <> c.empresa_id
    )
    UNION ALL
    SELECT 'cobrancas.recebivel_id'
    WHERE EXISTS (
      SELECT 1 FROM public.cobrancas c
      JOIN public.recebiveis r ON r.id = c.recebivel_id
      WHERE r.empresa_id <> c.empresa_id
    )
    UNION ALL
    SELECT 'promessas.cliente_id'
    WHERE EXISTS (
      SELECT 1 FROM public.promessas p
      JOIN public.clientes c ON c.id = p.cliente_id
      WHERE c.empresa_id <> p.empresa_id
    )
    UNION ALL
    SELECT 'promessas.recebivel_id'
    WHERE EXISTS (
      SELECT 1 FROM public.promessas p
      JOIN public.recebiveis r ON r.id = p.recebivel_id
      WHERE r.empresa_id <> p.empresa_id
    )
    UNION ALL
    SELECT 'prioridades_cobranca.cliente_id'
    WHERE EXISTS (
      SELECT 1 FROM public.prioridades_cobranca p
      JOIN public.clientes c ON c.id = p.cliente_id
      WHERE c.empresa_id <> p.empresa_id
    )
  ) AS invalid_links_found;

  IF invalid_links IS NOT NULL THEN
    RAISE EXCEPTION
      'Tenant isolation migration stopped: cross-company references exist in %. Repair these rows before retrying; no rows were deleted.',
      ARRAY_TO_STRING(invalid_links, ', ');
  END IF;
END;
$$;

ALTER TABLE public.clientes
  ADD CONSTRAINT clientes_id_empresa_key UNIQUE (id, empresa_id);

ALTER TABLE public.recebiveis
  ADD CONSTRAINT recebiveis_id_empresa_key UNIQUE (id, empresa_id),
  ADD CONSTRAINT recebiveis_cliente_empresa_fkey
    FOREIGN KEY (cliente_id, empresa_id)
    REFERENCES public.clientes (id, empresa_id)
    ON DELETE CASCADE;

ALTER TABLE public.cobrancas
  ADD CONSTRAINT cobrancas_cliente_empresa_fkey
    FOREIGN KEY (cliente_id, empresa_id)
    REFERENCES public.clientes (id, empresa_id)
    ON DELETE CASCADE,
  ADD CONSTRAINT cobrancas_recebivel_empresa_fkey
    FOREIGN KEY (recebivel_id, empresa_id)
    REFERENCES public.recebiveis (id, empresa_id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.promessas
  ADD CONSTRAINT promessas_cliente_empresa_fkey
    FOREIGN KEY (cliente_id, empresa_id)
    REFERENCES public.clientes (id, empresa_id)
    ON DELETE CASCADE,
  ADD CONSTRAINT promessas_recebivel_empresa_fkey
    FOREIGN KEY (recebivel_id, empresa_id)
    REFERENCES public.recebiveis (id, empresa_id)
    ON DELETE NO ACTION
    DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.prioridades_cobranca
  ADD CONSTRAINT prioridades_cliente_empresa_fkey
    FOREIGN KEY (cliente_id, empresa_id)
    REFERENCES public.clientes (id, empresa_id)
    ON DELETE CASCADE;

DROP POLICY IF EXISTS "Clientes visiveis por empresa" ON public.clientes;
CREATE POLICY "Clientes visiveis por empresa" ON public.clientes
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Recebiveis visiveis por empresa" ON public.recebiveis;
CREATE POLICY "Recebiveis visiveis por empresa" ON public.recebiveis
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Cobrancas visiveis por empresa" ON public.cobrancas;
CREATE POLICY "Cobrancas visiveis por empresa" ON public.cobrancas
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Promessas visiveis por empresa" ON public.promessas;
CREATE POLICY "Promessas visiveis por empresa" ON public.promessas
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Reguas visiveis por empresa" ON public.reguas;
CREATE POLICY "Reguas visiveis por empresa" ON public.reguas
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Prioridades visiveis por empresa" ON public.prioridades_cobranca;
CREATE POLICY "Prioridades visiveis por empresa" ON public.prioridades_cobranca
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Importacoes visiveis por empresa" ON public.importacoes;
CREATE POLICY "Importacoes visiveis por empresa" ON public.importacoes
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Metas visiveis por empresa" ON public.metas_recuperacao;
CREATE POLICY "Metas visiveis por empresa" ON public.metas_recuperacao
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Templates visiveis por empresa" ON public.templates_mensagem;
CREATE POLICY "Templates visiveis por empresa" ON public.templates_mensagem
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Conversas IA visiveis por empresa" ON public.conversas_ia;
CREATE POLICY "Conversas IA visiveis por empresa" ON public.conversas_ia
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM public.empresas
      WHERE user_id = auth.uid() AND subscription_status = 'active'
    )
  );

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant boundary empresas" ON public.empresas;
CREATE POLICY "Tenant boundary empresas" ON public.empresas
  AS RESTRICTIVE FOR ALL TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Tenant boundary clientes" ON public.clientes;
CREATE POLICY "Tenant boundary clientes" ON public.clientes
  AS RESTRICTIVE FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Tenant boundary recebiveis" ON public.recebiveis;
CREATE POLICY "Tenant boundary recebiveis" ON public.recebiveis
  AS RESTRICTIVE FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Tenant boundary cobrancas" ON public.cobrancas;
CREATE POLICY "Tenant boundary cobrancas" ON public.cobrancas
  AS RESTRICTIVE FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Tenant boundary promessas" ON public.promessas;
CREATE POLICY "Tenant boundary promessas" ON public.promessas
  AS RESTRICTIVE FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Tenant boundary reguas" ON public.reguas;
CREATE POLICY "Tenant boundary reguas" ON public.reguas
  AS RESTRICTIVE FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Tenant boundary prioridades_cobranca" ON public.prioridades_cobranca;
CREATE POLICY "Tenant boundary prioridades_cobranca" ON public.prioridades_cobranca
  AS RESTRICTIVE FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Tenant boundary importacoes" ON public.importacoes;
CREATE POLICY "Tenant boundary importacoes" ON public.importacoes
  AS RESTRICTIVE FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Tenant boundary metas_recuperacao" ON public.metas_recuperacao;
CREATE POLICY "Tenant boundary metas_recuperacao" ON public.metas_recuperacao
  AS RESTRICTIVE FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Tenant boundary templates_mensagem" ON public.templates_mensagem;
CREATE POLICY "Tenant boundary templates_mensagem" ON public.templates_mensagem
  AS RESTRICTIVE FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Tenant boundary conversas_ia" ON public.conversas_ia;
CREATE POLICY "Tenant boundary conversas_ia" ON public.conversas_ia
  AS RESTRICTIVE FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
        AND e.subscription_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Assinatura visivel pela empresa" ON public.billing_subscriptions;
CREATE POLICY "Assinatura visivel pela empresa" ON public.billing_subscriptions
  FOR SELECT USING (
    empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Tenant boundary billing_subscriptions" ON public.billing_subscriptions;
CREATE POLICY "Tenant boundary billing_subscriptions" ON public.billing_subscriptions
  AS RESTRICTIVE FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Eventos de cobranca somente servidor" ON public.billing_webhook_events;
CREATE POLICY "Eventos de cobranca somente servidor" ON public.billing_webhook_events
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Tenant boundary billing_webhook_events" ON public.billing_webhook_events;
CREATE POLICY "Tenant boundary billing_webhook_events" ON public.billing_webhook_events
  AS RESTRICTIVE FOR ALL TO public
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.protect_company_billing_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
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
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_company_billing_fields ON public.empresas;
CREATE TRIGGER protect_company_billing_fields
  BEFORE INSERT OR UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.protect_company_billing_fields();

REVOKE ALL ON public.billing_subscriptions FROM anon, authenticated;
GRANT SELECT ON public.billing_subscriptions TO authenticated;
REVOKE ALL ON public.billing_webhook_events FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.manual_billing_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  solicitado_por UUID NOT NULL REFERENCES auth.users(id),
  provider_subscription_id VARCHAR(100) NOT NULL,
  mensagem TEXT CHECK (mensagem IS NULL OR char_length(mensagem) <= 1000),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_user_id UUID REFERENCES auth.users(id),
  reviewer_email VARCHAR(255),
  review_note TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revisado_em TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_manual_billing_one_pending_per_company
  ON public.manual_billing_reviews(empresa_id)
  WHERE status = 'pending';

ALTER TABLE public.manual_billing_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Empresa consulta solicitacoes de revisao" ON public.manual_billing_reviews;
CREATE POLICY "Empresa consulta solicitacoes de revisao" ON public.manual_billing_reviews
  FOR SELECT USING (
    empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Empresa solicita revisao da propria assinatura" ON public.manual_billing_reviews;
CREATE POLICY "Empresa solicita revisao da propria assinatura" ON public.manual_billing_reviews
  FOR INSERT WITH CHECK (
    solicitado_por = auth.uid()
    AND empresa_id IN (
      SELECT e.id
      FROM public.empresas e
      JOIN public.billing_subscriptions b ON b.empresa_id = e.id
      WHERE e.user_id = auth.uid()
        AND e.subscription_status IN ('pending', 'past_due')
        AND b.status IN ('pending', 'past_due')
        AND b.provider_subscription_id = manual_billing_reviews.provider_subscription_id
    )
  );

DROP POLICY IF EXISTS "Tenant boundary manual_billing_reviews" ON public.manual_billing_reviews;
CREATE POLICY "Tenant boundary manual_billing_reviews" ON public.manual_billing_reviews
  AS RESTRICTIVE FOR ALL TO public
  USING (
    empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid())
  )
  WITH CHECK (
    solicitado_por = auth.uid()
    AND empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid())
  );

REVOKE ALL ON public.manual_billing_reviews FROM anon, authenticated;
GRANT SELECT ON public.manual_billing_reviews TO authenticated;
GRANT INSERT (empresa_id, solicitado_por, provider_subscription_id, mensagem)
  ON public.manual_billing_reviews TO authenticated;

CREATE OR REPLACE FUNCTION public.review_manual_billing_request(
  p_review_id UUID,
  p_reviewer_user_id UUID,
  p_reviewer_email VARCHAR,
  p_decision VARCHAR,
  p_review_note TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  review_row public.manual_billing_reviews%ROWTYPE;
  billing_row public.billing_subscriptions%ROWTYPE;
  title_limit INTEGER;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decisão de revisão inválida.';
  END IF;

  SELECT * INTO review_row
  FROM public.manual_billing_reviews
  WHERE id = p_review_id
  FOR UPDATE;

  IF NOT FOUND OR review_row.status <> 'pending' THEN
    RAISE EXCEPTION 'A solicitação não existe ou já foi revisada.';
  END IF;

  IF p_decision = 'approved' THEN
    SELECT * INTO billing_row
    FROM public.billing_subscriptions
    WHERE empresa_id = review_row.empresa_id
      AND provider_subscription_id = review_row.provider_subscription_id
    FOR UPDATE;

    IF NOT FOUND OR billing_row.status NOT IN ('pending', 'past_due') THEN
      RAISE EXCEPTION 'A assinatura não está pendente de revisão.';
    END IF;

    title_limit := CASE billing_row.plano
      WHEN 'essencial' THEN 300
      WHEN 'profissional' THEN 2000
      ELSE NULL
    END;

    IF title_limit IS NULL THEN
      RAISE EXCEPTION 'O plano não pode ser ativado por este fluxo.';
    END IF;

    UPDATE public.billing_subscriptions
    SET status = 'active', atualizado_em = NOW()
    WHERE empresa_id = review_row.empresa_id;

    UPDATE public.empresas
    SET subscription_status = 'active',
        plano = billing_row.plano,
        limite_titulos = title_limit,
        atualizado_em = NOW()
    WHERE id = review_row.empresa_id;
  END IF;

  UPDATE public.manual_billing_reviews
  SET status = p_decision,
      reviewer_user_id = p_reviewer_user_id,
      reviewer_email = p_reviewer_email,
      review_note = p_review_note,
      revisado_em = NOW()
  WHERE id = p_review_id;
END;
$$;

REVOKE ALL ON FUNCTION public.review_manual_billing_request(UUID, UUID, VARCHAR, VARCHAR, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_manual_billing_request(UUID, UUID, VARCHAR, VARCHAR, TEXT) TO service_role;
