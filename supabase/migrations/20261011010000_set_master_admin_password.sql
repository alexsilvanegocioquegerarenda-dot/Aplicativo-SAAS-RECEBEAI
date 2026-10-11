-- ==============================================================================
-- RECEBEAI - DEFINIR SENHA DEFINITIVA DO USUÁRIO MASTER
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

UPDATE auth.users
SET encrypted_password = crypt('Al877344Silva*', gen_salt('bf', 10)),
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb,
    email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE lower(trim(email)) = 'financeiro.saasrecebeai@gmail.com';
