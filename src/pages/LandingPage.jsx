import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Calendar,
  BarChart3,
  Users,
  ChevronDown,
  Building2,
  Clock,
  Send,
  Star,
  Check,
  Play,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [faqAberto, setFaqAberto] = useState(null);

  const toggleFaq = (index) => {
    setFaqAberto(faqAberto === index ? null : index);
  };

  const planos = [
    {
      id: "essencial",
      nome: "Essencial",
      preco: 149,
      descricao: "Ideal para pequenas empresas e autônomos organizarem suas cobranças.",
      destaque: false,
      recursos: [
        "Até 300 clientes cadastrados",
        "Até R$ 100k em recebíveis gerenciados",
        "Pipeline Kanban de cobrança",
        "Régua de cobrança padrão (5 etapas)",
        "Templates personalizáveis de WhatsApp e E-mail",
        "Cálculo de Aging List e DSO em tempo real",
        "Importação de títulos via planilha CSV",
        "Suporte por e-mail em até 24h úteis",
      ],
      cta: "Começar com Essencial",
    },
    {
      id: "profissional",
      nome: "Profissional",
      badge: "Mais Escolhido",
      preco: 349,
      descricao: "Solução completa com automação de IA, régua avançada e sem limites operacionais.",
      destaque: true,
      recursos: [
        "Clientes e recebíveis ilimitados",
        "IA Financeira para diagnóstico e insights de inadimplência",
        "Priorização preditiva de devedores por score",
        "Disparo automatizado de régua via WhatsApp API",
        "Relatórios consolidados de taxa de recuperação vs meta",
        "Gestão de acordos e promessas com alertas de quebra",
        "Histórico e auditoria de importações em lote",
        "Suporte prioritário via WhatsApp com time especialista",
      ],
      cta: "Assinar Profissional",
    },
    {
      id: "enterprise",
      nome: "Enterprise",
      badge: "Corporativo",
      preco: 799,
      descricao: "Para médias e grandes operações que exigem escala, múltiplos acessos e integrações diretas.",
      destaque: false,
      isEnterprise: true,
      recursos: [
        "Tudo do plano Profissional incluso",
        "Múltiplos usuários com controle de permissões por equipe",
        "API aberta de integração direta com ERPs e Bancos",
        "Regras de régua multicanal 100% customizadas com Webhooks",
        "IA Financeira avançada para negociações e acordos complexos",
        "Painel Master multi-empresas e relatórios customizados",
        "Onboarding e treinamento exclusivo para sua equipe",
        "Gerente de contas dedicado com SLA de suporte em até 1h",
      ],
      cta: "Contratar Enterprise",
    },
  ];

  const faqs = [
    {
      q: "Como funciona o isolamento multi-empresa dos meus dados?",
      a: "Cada empresa cadastrada no RecebeAi possui um banco de dados rigorosamente segregado com Row Level Security (RLS). Nenhuma outra empresa ou usuário comum consegue visualizar seus clientes, valores ou histórico de faturas.",
    },
    {
      q: "Preciso de conhecimento técnico ou integração com TI para usar?",
      a: "Não! O RecebeAi foi projetado para ser intuitivo. Em menos de 3 minutos você pode importar sua planilha de faturas em CSV ou cadastrar seus clientes manualmente e começar a cobrar.",
    },
    {
      q: "Como funciona a cobrança com PIX no WhatsApp?",
      a: "O sistema gera mensagens personalizadas com o nome do cliente, o valor exato, juros calculados e a sua chave PIX para pagamento imediato. Basta um clique para enviar via WhatsApp.",
    },
    {
      q: "Como funciona a garantia de 7 dias?",
      a: "Você pode testar qualquer plano por 7 dias. Se por qualquer motivo você não notar melhora imediata no controle ou na recuperação dos seus recebíveis, cancelamos sem taxas nem burocracia.",
    },
    {
      q: "O que é o cálculo de Aging List e DSO?",
      a: "Aging List é a classificação dos seus recebíveis por faixas de atraso (A vencer, 1-30 dias, 31-60 dias, etc.), e o DSO (Days Sales Outstanding) mede o prazo médio real que seus clientes levam para pagar, ajudando você a antecipar o fluxo de caixa.",
    },
  ];

  const recursosDestaque = [
    {
      icon: MessageSquare,
      titulo: "Régua Multicanal de Cobrança",
      desc: "Automação preventiva (D-3, D0) e cobranças incisivas (D+3, D+10) com templates prontos para WhatsApp e E-mail.",
      cor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      icon: Sparkles,
      titulo: "IA Financeira Preditiva",
      desc: "Inteligência Artificial que analisa o comportamento de pagamento e indica exatamente quem cobrar hoje para maximizar o retorno.",
      cor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: BarChart3,
      titulo: "Aging List & Cálculo de DSO",
      desc: "Visão analítica em tempo real da idade da sua carteira e prazo médio de recebimento para evitar surpresas no caixa.",
      cor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      icon: TrendingUp,
      titulo: "Kanban Visual de Negociações",
      desc: "Acompanhe devedores etapa por etapa, de 'Lembrete Enviado' até 'Acordo Firmado' e 'Recuperado com Sucesso'.",
      cor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: FileSpreadsheet,
      titulo: "Importador Inteligente de CSV",
      desc: "Traga centenas de faturas de qualquer ERP em segundos com mapeamento automático de colunas e auditoria de erros.",
      cor: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    },
    {
      icon: ShieldCheck,
      titulo: "Multi-tenancy com Isolamento RLS",
      desc: "Segurança de padrão bancário. Cada empresa opera em seu próprio compartimento isolado e criptografado.",
      cor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white font-sans">
      {/* 1. NAVBAR FIXO */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Zap className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl font-bold tracking-tight text-white">
                Recebe<span className="text-emerald-400">Ai</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                SaaS de Cobrança Inteligente
              </span>
            </div>
          </Link>

          {/* Links desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#recursos" className="hover:text-emerald-400 transition-colors">
              Recursos
            </a>
            <a href="#como-funciona" className="hover:text-emerald-400 transition-colors">
              Como Funciona
            </a>
            <a href="#planos" className="hover:text-emerald-400 transition-colors">
              Planos & Preços
            </a>
            <a href="#depoimentos" className="hover:text-emerald-400 transition-colors">
              Depoimentos
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Ações / Botões */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all"
              >
                <span>Acessar Meu Painel ({user.empresa_nome || "Empresa"})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <span>Experimentar Grátis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ESPAÇADOR DO NAVBAR */}
      <div className="h-20" />

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Efeitos de luz no fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-500/15 via-blue-500/15 to-purple-500/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inteligência Artificial Financeira Integrada</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Título Principal */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Automatize suas Cobranças. Reduza a Inadimplência em até{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400">
              40% com o RecebeAi
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            A solução completa para pequenas e médias empresas recuperarem faturas atrasadas, calcularem Aging List e DSO em tempo real e dispararem cobranças no WhatsApp com chave PIX sem atrito.
          </p>

          {/* Botões CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/cadastro?plano=profissional"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all transform hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4" />
              <span>Começar Teste Grátis de 7 Dias</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm transition-all"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Acessar Demonstração do App</span>
            </Link>
          </div>

          {/* Badges de Confiança */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sem fidelidade obrigatória</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Isolamento Multi-empresa RLS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ativação Instantânea</span>
            </div>
          </div>
        </div>

        {/* 3. MOCKUP INTERATIVO DO SOFTWARE */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 relative">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-2xl">
            {/* Header da Janela */}
            <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                <span className="text-[11px] text-slate-500 font-mono ml-3">
                  https://aplicativo-saas-recebeai.vercel.app/dashboard
                </span>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                ● Ao Vivo
              </span>
            </div>

            {/* Conteúdo do Mockup */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Cards de Métricas */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total a Receber</div>
                  <div className="text-xl sm:text-2xl font-bold text-white mt-1">R$ 38.550,00</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">7 faturas ativas</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Total Vencido</div>
                  <div className="text-xl sm:text-2xl font-bold text-rose-400 mt-1">R$ 15.050,00</div>
                  <div className="text-[10px] text-rose-400/80 mt-0.5">3 títulos em atraso</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Recuperado este Mês</div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">R$ 12.500,00</div>
                  <div className="text-[10px] text-emerald-400/80 mt-0.5">7 títulos liquidados</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Índice Inadimplência</div>
                  <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">29.5%</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">-8.2% vs mês anterior</div>
                </div>
              </div>

              {/* Grid 2 colunas: Exemplo de WhatsApp com PIX e Aging */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Exemplo de Mensagem WhatsApp */}
                <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        WA
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Disparo Automático via WhatsApp</div>
                        <div className="text-[10px] text-slate-400">Régua D+3 (Cobrança Amigável)</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded">
                      Link PIX Gerado
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-xs text-slate-300 leading-relaxed font-mono">
                    "Olá Mariana! Lembramos que a fatura <strong>NF-2024-101</strong> no valor de <strong>R$ 4.500,00</strong> venceu há 3 dias. Para regularizar agora sem juros adicionais, utilize o PIX Copia e Cola: <code>pix@suaempresa.com.br</code>"
                  </div>
                </div>

                {/* Aging List Mini */}
                <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold text-white">Aging da Carteira em Tempo Real</div>
                    <span className="text-[10px] text-slate-400">DSO Atual: 34 dias</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
                      <span className="text-emerald-300 font-medium">A vencer</span>
                      <span className="font-bold text-white">R$ 23.500,00 (61%)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/20 border border-amber-800/30">
                      <span className="text-amber-300 font-medium">1 a 30 dias de atraso</span>
                      <span className="font-bold text-white">R$ 4.150,00 (10.7%)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/20 border border-rose-800/30">
                      <span className="text-rose-300 font-medium">31 a 60 dias de atraso</span>
                      <span className="font-bold text-white">R$ 8.900,00 (23.1%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO DE MÉTRICAS DE IMPACTO */}
      <section className="py-16 border-y border-slate-800/80 bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold text-emerald-400 tracking-tight">+35%</div>
              <div className="mt-2 text-xs sm:text-sm text-slate-400 font-medium">Recuperação de Inadimplência</div>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold text-blue-400 tracking-tight">-18 Dias</div>
              <div className="mt-2 text-xs sm:text-sm text-slate-400 font-medium">Redução no Prazo de Recebimento (DSO)</div>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold text-purple-400 tracking-tight">3 Minutos</div>
              <div className="mt-2 text-xs sm:text-sm text-slate-400 font-medium">Para Configurar e Começar</div>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold text-teal-400 tracking-tight">100% RLS</div>
              <div className="mt-2 text-xs sm:text-sm text-slate-400 font-medium">Isolamento Seguro Multi-empresa</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEÇÃO DE RECURSOS */}
      <section id="recursos" className="py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Recursos Poderosos</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tudo o que sua empresa precisa para nunca mais ter faturas esquecidas
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Ferramentas modernas projetadas para o financeiro de pequenas e médias empresas operarem com a eficiência de grandes corporações.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recursosDestaque.map((rec, i) => {
            const Icon = rec.icon;
            return (
              <div
                key={i}
                className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7 hover:border-slate-700 hover:bg-slate-900/90 transition-all group"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-5 ${rec.cor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  {rec.titulo}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {rec.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Simples e Rápido</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Como o RecebeAi recupera seu caixa em 3 passos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">Importe sua Carteira</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Faça o upload do seu arquivo CSV ou cadastre clientes manualmente. O sistema classifica prazos, valores e níveis de risco automaticamente.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 font-extrabold text-xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">Ative a Régua e a IA</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A régua inteligente dispara lembretes preventivos antes do vencimento e cobranças personalizadas pós-vencimento via WhatsApp.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 font-extrabold text-xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">Liquidação via PIX</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                O devedor recebe a chave PIX e o valor já atualizado no celular. Ele paga instantaneamente e seu saldo é recuperado no mesmo dia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PLANOS E PREÇOS */}
      <section id="planos" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Transparência Total</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Escolha o plano ideal para a escala da sua empresa
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Comece hoje com 7 dias de garantia incondicional. Sem contratos de longo prazo nem letras miúdas.
          </p>

          {/* Selo Informativo de Preços Fixos */}
          <div className="flex items-center justify-center mt-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Preços fixos mensais sem pegadinhas • Cancele quando quiser • 7 dias de garantia
            </span>
          </div>
        </div>

        {/* Cards dos 3 Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {planos.map((plano) => {
            return (
              <div
                key={plano.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-200 ${
                  plano.destaque
                    ? "bg-gradient-to-b from-emerald-950/30 via-slate-900 to-slate-950 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10"
                    : plano.isEnterprise
                    ? "bg-gradient-to-b from-purple-950/30 via-slate-900 to-slate-950 border-2 border-purple-500/60 shadow-xl shadow-purple-500/10"
                    : "bg-slate-900/80 border border-slate-800 shadow-lg"
                }`}
              >
                {plano.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm ${
                        plano.destaque ? "bg-emerald-500 text-white" : "bg-purple-600 text-white"
                      }`}
                    >
                      {plano.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-white">{plano.nome}</h3>
                    {plano.destaque && <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />}
                    {plano.isEnterprise && <Sparkles className="w-5 h-5 text-purple-400" />}
                  </div>
                  <p className="text-xs text-slate-400 min-h-[36px] mb-6">
                    {plano.descricao}
                  </p>

                  {/* Preço */}
                  <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-slate-800">
                    <span className="text-sm text-slate-400 font-medium">R$</span>
                    <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                      {plano.preco}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">,00/mês</span>
                  </div>

                  {/* Recursos */}
                  <div className="space-y-3 mb-8">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      O que está incluso:
                    </p>
                    <ul className="space-y-2.5">
                      {plano.recursos.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <div
                            className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                              plano.destaque
                                ? "bg-emerald-500/20 text-emerald-400"
                                : plano.isEnterprise
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Botão de Contratação */}
                <Link
                  to={`/cadastro?plano=${plano.id}`}
                  className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                    plano.destaque
                      ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/25"
                      : plano.isEnterprise
                      ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/25"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  }`}
                >
                  <span>{plano.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. DEPOIMENTOS */}
      <section id="depoimentos" className="py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Depoimentos Reais</div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Quem usa o RecebeAi não perde mais o sono com inadimplência
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic mb-4">
                  "Tínhamos R$ 42 mil parados em faturas atrasadas há mais de 30 dias. Com a régua automática no WhatsApp e a chave PIX, recuperamos R$ 28 mil na primeira semana!"
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  RS
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Rodrigo Silveira</div>
                  <div className="text-[10px] text-slate-400">Diretor, Silveira Materiais Elétricos</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic mb-4">
                  "O cálculo do Aging e a IA Financeira nos mostram exatamente quem tem risco alto antes mesmo de vender. Nosso DSO caiu de 52 dias para 31 dias."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  CP
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Camila Prado</div>
                  <div className="text-[10px] text-slate-400">Gestora Financeira, Delta Consultoria</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic mb-4">
                  "O pipeline Kanban de promessas de pagamento mudou nossa rotina. Não deixamos nenhum acordo cair no esquecimento e o isolamento dos dados nos dá total segurança."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                <div className="w-9 h-9 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                  FL
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Fábio Lins</div>
                  <div className="text-[10px] text-slate-400">Sócio, Lins & Associados</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ INTERATIVO */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Tire Suas Dúvidas</div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Perguntas Frequentes</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((f, i) => {
            const isAberto = faqAberto === i;
            return (
              <div
                key={i}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(i)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-white hover:text-emerald-300 transition-colors"
                >
                  <span>{f.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isAberto ? "rotate-180 text-emerald-400" : ""
                    }`}
                  />
                </button>
                {isAberto && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. CTA FINAL */}
      <section className="py-20 bg-gradient-to-b from-slate-950 to-emerald-950/30 border-t border-slate-800 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 mb-4">
            <Zap className="h-6 w-6" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Pronto para transformar cobranças em dinheiro no caixa?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Crie a conta da sua empresa em 2 minutos e comece a recuperar recebíveis hoje mesmo com inteligência e respeito ao seu cliente.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/cadastro?plano=profissional"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-xl shadow-emerald-500/30 transition-all"
            >
              <span>Criar Minha Empresa no RecebeAi</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold text-sm transition-all"
            >
              Já sou cliente / Entrar
            </Link>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-bold text-white text-sm">RecebeAi</span>
            <span className="text-slate-600">|</span>
            <span>Tecnologia em Gestão e Cobrança de Recebíveis</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#recursos" className="hover:text-slate-300 transition-colors">Recursos</a>
            <a href="#planos" className="hover:text-slate-300 transition-colors">Planos</a>
            <Link to="/login" className="hover:text-slate-300 transition-colors">Área do Cliente</Link>
            <Link to="/cadastro" className="hover:text-slate-300 transition-colors">Criar Empresa</Link>
          </div>
          <div>
            © {new Date().getFullYear()} RecebeAi. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
