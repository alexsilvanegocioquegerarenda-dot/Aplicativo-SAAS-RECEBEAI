-- ==============================================================================
-- RECEBEAI - PROMOÇÃO E TRIGGER DO USUÁRIO MASTER
-- ==============================================================================
-- Garante que o e-mail financeiro.saasrecebeai@gmail.com receba automaticamente
-- a role 'admin' em auth.users.raw_app_meta_data sempre que for criado ou atualizado,
-- e que seu e-mail seja confirmado imediatamente.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_master_admin_app_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF lower(trim(NEW.email)) = 'financeiro.saasrecebeai@gmail.com' THEN
    NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb;
    NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_master_admin_created ON auth.users;
CREATE TRIGGER on_master_admin_created
  BEFORE INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_master_admin_app_metadata();

-- Promover e confirmar imediatamente o usuário se ele já existir no banco
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb,
    email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE lower(trim(email)) = 'financeiro.saasrecebeai@gmail.com';
