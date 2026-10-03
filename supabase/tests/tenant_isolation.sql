DO $tenant_isolation_test$
DECLARE
  db_role TEXT := SESSION_USER;
  user_a UUID := gen_random_uuid();
  user_b UUID := gen_random_uuid();
  company_a UUID := gen_random_uuid();
  company_b UUID := gen_random_uuid();
  client_a UUID := gen_random_uuid();
  client_b UUID := gen_random_uuid();
  receivable_a UUID := gen_random_uuid();
  receivable_b UUID := gen_random_uuid();
  row_a UUID := gen_random_uuid();
  row_b UUID := gen_random_uuid();
  event_a TEXT := 'tenant-isolation-a-' || gen_random_uuid()::TEXT;
  event_b TEXT := 'tenant-isolation-b-' || gen_random_uuid()::TEXT;
  table_name TEXT;
  visible_count BIGINT;
  rejected BOOLEAN;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', TRUE);
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  INSERT INTO auth.users (id, email, aud, role, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    (user_a, 'tenant-isolation-' || user_a::TEXT || '@example.invalid', 'authenticated', 'authenticated', NOW(), '{}'::JSONB, '{}'::JSONB, NOW(), NOW()),
    (user_b, 'tenant-isolation-' || user_b::TEXT || '@example.invalid', 'authenticated', 'authenticated', NOW(), '{}'::JSONB, '{}'::JSONB, NOW(), NOW());

  INSERT INTO public.empresas (id, user_id, razao_social, plano, limite_titulos, subscription_status)
  VALUES
    (company_a, user_a, 'Tenant isolation test A', 'essencial', 300, 'active'),
    (company_b, user_b, 'Tenant isolation test B', 'essencial', 300, 'active');

  INSERT INTO public.clientes (id, empresa_id, nome, telefone)
  VALUES
    (client_a, company_a, 'Tenant isolation client A', '0000000001'),
    (client_b, company_b, 'Tenant isolation client B', '0000000002');

  INSERT INTO public.recebiveis (id, empresa_id, cliente_id, valor, vencimento)
  VALUES
    (receivable_a, company_a, client_a, 10, CURRENT_DATE),
    (receivable_b, company_b, client_b, 20, CURRENT_DATE);

  INSERT INTO public.cobrancas (id, empresa_id, cliente_id, recebivel_id, mensagem)
  VALUES
    (row_a, company_a, client_a, receivable_a, 'Tenant isolation test A'),
    (row_b, company_b, client_b, receivable_b, 'Tenant isolation test B');

  INSERT INTO public.promessas (id, empresa_id, cliente_id, recebivel_id, valor_acordado, data_promessa)
  VALUES
    (gen_random_uuid(), company_a, client_a, receivable_a, 10, CURRENT_DATE),
    (gen_random_uuid(), company_b, client_b, receivable_b, 20, CURRENT_DATE);

  INSERT INTO public.reguas (empresa_id, nome, dias_gatilho, mensagem)
  VALUES
    (company_a, 'Tenant isolation test A', 0, 'Test A'),
    (company_b, 'Tenant isolation test B', 0, 'Test B');

  INSERT INTO public.prioridades_cobranca (empresa_id, cliente_id)
  VALUES
    (company_a, client_a),
    (company_b, client_b);

  INSERT INTO public.importacoes (empresa_id, arquivo_nome)
  VALUES
    (company_a, 'tenant-isolation-a.csv'),
    (company_b, 'tenant-isolation-b.csv');

  INSERT INTO public.metas_recuperacao (empresa_id, mes_ano, meta_valor)
  VALUES
    (company_a, '2099-01', 10),
    (company_b, '2099-01', 20);

  INSERT INTO public.templates_mensagem (empresa_id, titulo, texto)
  VALUES
    (company_a, 'Tenant isolation test A', 'Test A'),
    (company_b, 'Tenant isolation test B', 'Test B');

  INSERT INTO public.conversas_ia (empresa_id, role, content)
  VALUES
    (company_a, 'user', 'Tenant isolation test A'),
    (company_b, 'user', 'Tenant isolation test B');

  INSERT INTO public.billing_subscriptions (empresa_id, plano, provider_subscription_id, status)
  VALUES
    (company_a, 'essencial', event_a, 'pending'),
    (company_b, 'essencial', event_b, 'pending');

  INSERT INTO public.manual_billing_reviews (empresa_id, solicitado_por, provider_subscription_id)
  VALUES
    (company_a, user_a, event_a),
    (company_b, user_b, event_b);

  INSERT INTO public.billing_webhook_events (event_key, provider_subscription_id, provider_status)
  VALUES
    (event_a, event_a, 'pending'),
    (event_b, event_b, 'pending');

  PERFORM set_config('role', 'authenticated', TRUE);
  PERFORM set_config('request.jwt.claim.sub', user_a::TEXT, TRUE);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', user_a, 'role', 'authenticated')::TEXT, TRUE);

  SELECT COUNT(*) INTO visible_count FROM public.empresas;
  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'Tenant isolation failed: user A sees % companies, expected 1.', visible_count;
  END IF;

  FOREACH table_name IN ARRAY ARRAY[
    'clientes',
    'recebiveis',
    'cobrancas',
    'promessas',
    'reguas',
    'prioridades_cobranca',
    'importacoes',
    'metas_recuperacao',
    'templates_mensagem',
    'conversas_ia',
    'billing_subscriptions',
    'manual_billing_reviews'
  ]
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE empresa_id = $1', table_name)
      INTO visible_count USING company_a;
    IF visible_count <> 1 THEN
      RAISE EXCEPTION 'Tenant isolation failed: user A sees % own rows in %, expected 1.', visible_count, table_name;
    END IF;

    EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE empresa_id = $1', table_name)
      INTO visible_count USING company_b;
    IF visible_count <> 0 THEN
      RAISE EXCEPTION 'Tenant isolation failed: user A sees % rows from company B in %.', visible_count, table_name;
    END IF;
  END LOOP;

  SELECT COUNT(*) INTO visible_count FROM public.billing_webhook_events;
  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'Tenant isolation failed: authenticated client can read webhook events.';
  END IF;

  rejected := FALSE;
  BEGIN
    INSERT INTO public.recebiveis (empresa_id, cliente_id, valor, vencimento)
    VALUES (company_a, client_b, 10, CURRENT_DATE);
  EXCEPTION WHEN foreign_key_violation THEN
    rejected := TRUE;
  END;
  IF NOT rejected THEN
    RAISE EXCEPTION 'Tenant isolation failed: cross-company receivable/client link was accepted.';
  END IF;

  rejected := FALSE;
  BEGIN
    INSERT INTO public.cobrancas (empresa_id, cliente_id, mensagem)
    VALUES (company_a, client_b, 'Invalid cross-company link');
  EXCEPTION WHEN foreign_key_violation THEN
    rejected := TRUE;
  END;
  IF NOT rejected THEN
    RAISE EXCEPTION 'Tenant isolation failed: cross-company charge/client link was accepted.';
  END IF;

  rejected := FALSE;
  BEGIN
    INSERT INTO public.cobrancas (empresa_id, cliente_id, recebivel_id, mensagem)
    VALUES (company_a, client_a, receivable_b, 'Invalid cross-company link');
  EXCEPTION WHEN foreign_key_violation THEN
    rejected := TRUE;
  END;
  IF NOT rejected THEN
    RAISE EXCEPTION 'Tenant isolation failed: cross-company charge/receivable link was accepted.';
  END IF;

  rejected := FALSE;
  BEGIN
    INSERT INTO public.promessas (empresa_id, cliente_id, valor_acordado, data_promessa)
    VALUES (company_a, client_b, 10, CURRENT_DATE);
  EXCEPTION WHEN foreign_key_violation THEN
    rejected := TRUE;
  END;
  IF NOT rejected THEN
    RAISE EXCEPTION 'Tenant isolation failed: cross-company promise/client link was accepted.';
  END IF;

  rejected := FALSE;
  BEGIN
    INSERT INTO public.promessas (empresa_id, cliente_id, recebivel_id, valor_acordado, data_promessa)
    VALUES (company_a, client_a, receivable_b, 10, CURRENT_DATE);
  EXCEPTION WHEN foreign_key_violation THEN
    rejected := TRUE;
  END;
  IF NOT rejected THEN
    RAISE EXCEPTION 'Tenant isolation failed: cross-company promise/receivable link was accepted.';
  END IF;

  rejected := FALSE;
  BEGIN
    INSERT INTO public.prioridades_cobranca (empresa_id, cliente_id)
    VALUES (company_a, client_b);
  EXCEPTION WHEN foreign_key_violation THEN
    rejected := TRUE;
  END;
  IF NOT rejected THEN
    RAISE EXCEPTION 'Tenant isolation failed: cross-company priority/client link was accepted.';
  END IF;

  PERFORM set_config('role', db_role, TRUE);
  PERFORM set_config('request.jwt.claim.sub', '', TRUE);
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  DELETE FROM auth.users WHERE id IN (user_a, user_b);
  DELETE FROM public.billing_webhook_events WHERE event_key IN (event_a, event_b);
END;
$tenant_isolation_test$;
