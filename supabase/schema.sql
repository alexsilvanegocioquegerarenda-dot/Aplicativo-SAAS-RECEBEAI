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

-- Políticas de acesso permitindo que cada usuário acesse somente dados da sua empresa
DROP POLICY IF EXISTS "Empresas isoladas por usuario" ON public.empresas;
CREATE POLICY "Empresas isoladas por usuario" ON public.empresas
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Clientes visiveis por empresa" ON public.clientes;
CREATE POLICY "Clientes visiveis por empresa" ON public.clientes
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Recebiveis visiveis por empresa" ON public.recebiveis;
CREATE POLICY "Recebiveis visiveis por empresa" ON public.recebiveis
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Cobrancas visiveis por empresa" ON public.cobrancas;
CREATE POLICY "Cobrancas visiveis por empresa" ON public.cobrancas
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Promessas visiveis por empresa" ON public.promessas;
CREATE POLICY "Promessas visiveis por empresa" ON public.promessas
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Reguas visiveis por empresa" ON public.reguas;
CREATE POLICY "Reguas visiveis por empresa" ON public.reguas
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Prioridades visiveis por empresa" ON public.prioridades_cobranca;
CREATE POLICY "Prioridades visiveis por empresa" ON public.prioridades_cobranca
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));

-- ==============================================================================
-- 9. NOVAS TABELAS: IMPORTAÇÕES, METAS, TEMPLATES E CONVERSAS IA
-- ==============================================================================

-- Tabela de Histórico e Auditoria de Importações
CREATE TABLE IF NOT EXISTS public.importacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    arquivo_nome VARCHAR(255) NOT NULL,
    total_registros INTEGER DEFAULT 0,
    total_sucesso INTEGER DEFAULT 0,
    total_erros INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'concluido', -- 'concluido', 'parcial', 'falha'
    detalhes JSONB DEFAULT '[]'::jsonb,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Metas Mensais de Recuperação
CREATE TABLE IF NOT EXISTS public.metas_recuperacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    mes_ano VARCHAR(7) NOT NULL, -- Formato 'YYYY-MM'
    meta_valor NUMERIC(12,2) NOT NULL DEFAULT 50000.00,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_empresa_mes UNIQUE (empresa_id, mes_ano)
);

-- Tabela de Templates Customizáveis de Mensagens
CREATE TABLE IF NOT EXISTS public.templates_mensagem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    canal VARCHAR(30) DEFAULT 'whatsapp', -- 'whatsapp', 'email', 'sms'
    prioridade VARCHAR(20) DEFAULT 'media', -- 'alta', 'media', 'baixa'
    texto TEXT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Histórico da IA Financeira
CREATE TABLE IF NOT EXISTS public.conversas_ia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_importacoes_empresa ON public.importacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_metas_empresa ON public.metas_recuperacao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_templates_empresa ON public.templates_mensagem(empresa_id);
CREATE INDEX IF NOT EXISTS idx_conversas_ia_empresa ON public.conversas_ia(empresa_id);

-- Ativar RLS
ALTER TABLE public.importacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_recuperacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_mensagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas_ia ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Importacoes visiveis por empresa" ON public.importacoes;
CREATE POLICY "Importacoes visiveis por empresa" ON public.importacoes
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Metas visiveis por empresa" ON public.metas_recuperacao;
CREATE POLICY "Metas visiveis por empresa" ON public.metas_recuperacao
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Templates visiveis por empresa" ON public.templates_mensagem;
CREATE POLICY "Templates visiveis por empresa" ON public.templates_mensagem
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Conversas IA visiveis por empresa" ON public.conversas_ia;
CREATE POLICY "Conversas IA visiveis por empresa" ON public.conversas_ia
    FOR ALL USING (empresa_id IN (SELECT id FROM public.empresas WHERE user_id = auth.uid()));

