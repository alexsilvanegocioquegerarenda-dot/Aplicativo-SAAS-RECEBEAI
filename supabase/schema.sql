-- ==============================================================================
-- RECEBEAI - SCHEMA DDL PARA BANCO DE DADOS SUPABASE (POSTGRESQL)
-- ==============================================================================
-- Este script cria a estrutura completa de tabelas, relacionamentos,
-- índices de performance e políticas de segurança RLS (Row Level Security)
-- para suporte a múltiplos clientes (Multi-tenancy / isolamento por empresa).
-- ==============================================================================

-- 1. Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Empresas (Tenants)
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    telefone VARCHAR(30),
    email VARCHAR(255),
    chave_pix VARCHAR(255),
    tipo_chave_pix VARCHAR(20) DEFAULT 'email',
    multa_percentual NUMERIC(5,2) DEFAULT 2.00,
    juros_mes_percentual NUMERIC(5,2) DEFAULT 1.00,
    plano VARCHAR(30) DEFAULT 'pro', -- 'starter', 'pro', 'enterprise'
    limite_titulos INTEGER DEFAULT 300,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Clientes / Devedores
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    email VARCHAR(255),
    telefone VARCHAR(30) NOT NULL,
    contato_nome VARCHAR(100),
    status VARCHAR(30) DEFAULT 'em_dia', -- 'em_dia', 'a_vencer', 'atrasado'
    risco VARCHAR(20) DEFAULT 'baixo', -- 'baixo', 'medio', 'alto'
    limite_credito NUMERIC(12,2) DEFAULT 10000.00,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Recebíveis / Títulos
CREATE TABLE IF NOT EXISTS public.recebiveis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    nota_fiscal VARCHAR(50),
    descricao TEXT,
    valor NUMERIC(12,2) NOT NULL,
    valor_pago NUMERIC(12,2) DEFAULT 0.00,
    vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(30) DEFAULT 'em_dia', -- 'em_dia', 'a_vencer', 'atrasado', 'pago'
    forma_pagamento VARCHAR(30) DEFAULT 'pix', -- 'pix', 'boleto', 'cartao'
    chave_pix VARCHAR(255),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Histórico de Cobranças Disparadas
CREATE TABLE IF NOT EXISTS public.cobrancas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    recebivel_id UUID REFERENCES public.recebiveis(id) ON DELETE SET NULL,
    tipo VARCHAR(30) DEFAULT 'whatsapp', -- 'whatsapp', 'email', 'sms'
    origem VARCHAR(30) DEFAULT 'regua', -- 'regua', 'manual'
    regua_step INTEGER,
    status VARCHAR(30) DEFAULT 'enviada', -- 'enviada', 'entregue', 'visualizada', 'respondida'
    data_envio DATE DEFAULT CURRENT_DATE,
    mensagem TEXT NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Promessas de Pagamento & Acordos
CREATE TABLE IF NOT EXISTS public.promessas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    recebivel_id UUID REFERENCES public.recebiveis(id) ON DELETE SET NULL,
    valor_acordado NUMERIC(12,2) NOT NULL,
    data_promessa DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'pendente', -- 'pendente', 'cumprida', 'quebrada'
    observacao TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Régua de Cobrança Customizável
CREATE TABLE IF NOT EXISTS public.reguas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    dias_gatilho INTEGER NOT NULL, -- -3 = 3 dias antes, 0 = no vencimento, 3 = 3 dias depois
    canal VARCHAR(30) DEFAULT 'whatsapp',
    ativo BOOLEAN DEFAULT TRUE,
    mensagem TEXT NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de Prioridades e Recomendações
CREATE TABLE IF NOT EXISTS public.prioridades_cobranca (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 50,
    nivel VARCHAR(20) DEFAULT 'media', -- 'baixa', 'media', 'alta'
    motivo TEXT,
    recomendacao TEXT,
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ÍNDICES PARA CONSULTAS RÁPIDAS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON public.clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_recebiveis_empresa ON public.recebiveis(empresa_id);
CREATE INDEX IF NOT EXISTS idx_recebiveis_cliente ON public.recebiveis(cliente_id);
CREATE INDEX IF NOT EXISTS idx_recebiveis_vencimento ON public.recebiveis(vencimento);
CREATE INDEX IF NOT EXISTS idx_recebiveis_status ON public.recebiveis(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_cliente ON public.cobrancas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_promessas_cliente ON public.promessas(cliente_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - ISOLAMENTO MULTI-EMPRESA
-- ==============================================================================
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recebiveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promessas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reguas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prioridades_cobranca ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso permitindo que cada usuário acerte somente dados da sua empresa
CREATE POLICY "Empresas isoladas por usuario" ON public.empresas
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Clientes visiveis por empresa" ON public.clientes
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));

CREATE POLICY "Recebiveis visiveis por empresa" ON public.recebiveis
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));

CREATE POLICY "Cobrancas visiveis por empresa" ON public.cobrancas
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));

CREATE POLICY "Promessas visiveis por empresa" ON public.promessas
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));

CREATE POLICY "Reguas visiveis por empresa" ON public.reguas
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));
