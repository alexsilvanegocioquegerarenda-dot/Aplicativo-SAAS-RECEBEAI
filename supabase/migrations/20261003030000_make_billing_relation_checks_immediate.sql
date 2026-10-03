ALTER TABLE public.cobrancas
  DROP CONSTRAINT IF EXISTS cobrancas_recebivel_empresa_fkey,
  ADD CONSTRAINT cobrancas_recebivel_empresa_fkey
    FOREIGN KEY (recebivel_id, empresa_id)
    REFERENCES public.recebiveis (id, empresa_id)
    ON DELETE SET NULL (recebivel_id);

ALTER TABLE public.promessas
  DROP CONSTRAINT IF EXISTS promessas_recebivel_empresa_fkey,
  ADD CONSTRAINT promessas_recebivel_empresa_fkey
    FOREIGN KEY (recebivel_id, empresa_id)
    REFERENCES public.recebiveis (id, empresa_id)
    ON DELETE SET NULL (recebivel_id);
