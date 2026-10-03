import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck, FileText, LifeBuoy } from "lucide-react";

const sectionClass = "space-y-3";
const headingClass = "text-lg font-bold text-slate-900";
const paragraphClass = "leading-7 text-slate-600";

function PublicPage({ title, description, icon: Icon, children }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao RecebeAi
        </Link>

        <header className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">RecebeAi</p>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-500">{description}</p>
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong>Documento preliminar — revisão necessária antes da comercialização.</strong>{" "}
            A identificação fiscal/endereço do fornecedor, prazos comerciais, retenção de dados,
            fornecedores e demais campos marcados como pendentes precisam ser confirmados antes
            de apresentar este texto como versão final.
          </div>
        </header>

        <article className="mt-5 space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {children}
          <p className="border-t border-slate-100 pt-5 text-xs text-slate-400">
            Versão preliminar de 03/10/2026. Este material é informativo e não substitui revisão jurídica.
          </p>
        </article>

      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section className={sectionClass}>
      <h2 className={headingClass}>{title}</h2>
      {children}
    </section>
  );
}

function TermsOfUse() {
  return (
    <PublicPage
      title="Termos de Uso"
      description="Regras preliminares para acesso e uso da plataforma RecebeAi. A versão final deve ser revisada e aceita pelo cliente antes da contratação."
      icon={FileText}
    >
      <Section title="1. Identificação e contato">
        <p className={paragraphClass}>
          O RecebeAi é uma plataforma de organização de clientes, recebíveis e atividades de cobrança,
          operada por Alexandre Marçal da Silva. A qualificação fiscal e o endereço do fornecedor
          ainda precisam ser confirmados e publicados antes da comercialização. O canal de suporte é{" "}
          <a className="font-semibold text-blue-700 hover:underline" href="mailto:financeiro.saasrecebeai@gmail.com">
            financeiro.saasrecebeai@gmail.com
          </a>.
        </p>
      </Section>

      <Section title="2. Aceite e elegibilidade">
        <p className={paragraphClass}>
          Ao criar uma conta ou usar a plataforma após a publicação da versão final destes Termos,
          o usuário declara que leu e aceita as condições aplicáveis. O cadastro deve ser feito por
          pessoa autorizada a representar a empresa e a fornecer os dados inseridos. A versão final
          deverá informar a forma de aceite, a data de vigência e como serão comunicadas alterações.
        </p>
      </Section>

      <Section title="3. Serviço e limites">
        <p className={paragraphClass}>
          O RecebeAi oferece recursos para registrar clientes e recebíveis, organizar atividades,
          visualizar indicadores e preparar mensagens de cobrança. A disponibilidade dos recursos
          depende do plano contratado e das condições técnicas. As mensagens são preparadas para
          envio pelo usuário; a plataforma não envia cobranças automaticamente nem processa ou
          confirma pagamentos feitos diretamente entre o cliente da empresa e a empresa usuária.
        </p>
        <p className={paragraphClass}>
          Indicadores e sugestões são ferramentas auxiliares, não aconselhamento jurídico, contábil
          ou financeiro e não garantem recuperação de valores. A empresa usuária deve conferir os
          dados e o conteúdo antes de tomar decisões ou contatar seus próprios clientes.
        </p>
      </Section>

      <Section title="4. Conta e responsabilidades do usuário">
        <p className={paragraphClass}>
          O usuário deve manter credenciais seguras, limitar acessos às pessoas autorizadas,
          informar dados corretos e avisar o suporte sobre suspeita de acesso indevido. A empresa
          usuária é responsável pela base legal, transparência, exatidão e atualização dos dados
          pessoais e financeiros que inserir, bem como pela legitimidade, horário, conteúdo e
          frequência dos contatos de cobrança que realizar.
        </p>
        <p className={paragraphClass}>
          Não é permitido inserir dados sem autorização, usar a plataforma para fraude, assédio,
          discriminação ou atividade ilegal, tentar acessar dados de outra empresa, contornar
          controles de segurança ou interromper o serviço.
        </p>
      </Section>

      <Section title="5. Dados e segurança">
        <p className={paragraphClass}>
          Cada empresa deve usar sua própria conta e manter seus usuários autorizados. O RecebeAi
          implementa controles de acesso e isolamento no banco, mas nenhum serviço conectado à
          internet pode prometer risco zero. O cliente deve reportar incidentes e manter cópias
          próprias dos dados necessários à sua operação. O tratamento de dados pessoais é descrito
          na <Link className="font-semibold text-blue-700 hover:underline" to="/privacidade">Política de Privacidade</Link>.
        </p>
      </Section>

      <Section title="6. Planos, cobrança e cancelamento — pendente de confirmação">
        <p className={paragraphClass}>
          A página comercial atualmente apresenta os planos Essencial (R$ 149/mês) e Profissional
          (R$ 349/mês); o plano Enterprise está indisponível para contratação automática. Preço,
          periodicidade, tributos, renovação, início da cobrança, cancelamento, reembolso, período
          de acesso após cancelamento e canal de contestação devem ser confirmados no checkout e na
          versão final destes Termos. Não contrate com base neste rascunho. A ativação depende da
          confirmação do pagamento pelo provedor e pelo RecebeAi.
        </p>
      </Section>

      <Section title="7. Disponibilidade, suspensão e encerramento">
        <p className={paragraphClass}>
          Podem ocorrer manutenção, indisponibilidade de fornecedores ou falhas de rede. O
          procedimento, aviso prévio quando possível, critérios de suspensão por inadimplência ou
          uso indevido, encerramento da conta, exportação e eliminação dos dados precisam ser
          definidos na versão final. Nenhuma disposição limita direitos inderrogáveis previstos em lei.
        </p>
      </Section>

      <Section title="8. Propriedade intelectual e responsabilidade">
        <p className={paragraphClass}>
          A plataforma, sua marca e seus componentes permanecem com seus respectivos titulares.
          Estes Termos não transferem a propriedade dos dados inseridos pelo usuário. As regras
          finais de licença, garantias, responsabilidade e limites de indenização devem ser revisadas
          por assessoria jurídica e não excluem responsabilidades que a lei não permita excluir.
        </p>
      </Section>

      <Section title="9. Lei aplicável e alterações">
        <p className={paragraphClass}>
          Aplicam-se as leis brasileiras, observadas as normas de proteção do consumidor e de dados
          pessoais quando cabíveis. Foro, procedimento de reclamação e comunicação de alterações
          devem ser definidos na revisão final, respeitados os direitos legais do usuário.
        </p>
      </Section>
    </PublicPage>
  );
}

function PrivacyPolicy() {
  return (
    <PublicPage
      title="Política de Privacidade"
      description="Resumo preliminar sobre dados tratados pelo RecebeAi, para que sejam completados e validados antes do uso com dados reais."
      icon={ShieldCheck}
    >
      <Section title="1. Quem trata os dados">
        <p className={paragraphClass}>
          O serviço é operado por Alexandre Marçal da Silva. A qualificação fiscal e o endereço do
          controlador precisam ser confirmados antes da comercialização. Para assuntos de privacidade,
          utilize{" "}
          <a className="font-semibold text-blue-700 hover:underline" href="mailto:financeiro.saasrecebeai@gmail.com">
            financeiro.saasrecebeai@gmail.com
          </a>.
        </p>
      </Section>

      <Section title="2. Papéis no tratamento">
        <p className={paragraphClass}>
          Para cadastro, autenticação, cobrança da assinatura, suporte e segurança da própria conta,
          o operador do RecebeAi define as finalidades e atua como controlador, sujeito à confirmação
          jurídica. Para dados dos clientes/devedores inseridos por uma empresa usuária, essa empresa
          normalmente define a finalidade e atua como controladora; o RecebeAi trata os dados para
          prestar o serviço e pode atuar como operador. As instruções, responsabilidades e eventual
          contrato de tratamento de dados entre as partes precisam ser formalizados antes do piloto.
        </p>
      </Section>

      <Section title="3. Dados que podem ser tratados">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
          <li>Dados de conta e autenticação, como nome, e-mail e identificadores técnicos.</li>
          <li>Dados da empresa usuária, configurações, plano e estado da assinatura.</li>
          <li>Dados de clientes da empresa inseridos no produto, como nome, contato, valores, vencimentos, histórico e observações de cobrança.</li>
          <li>Dados técnicos e registros necessários para operação, diagnóstico, prevenção de fraude e segurança; categorias e retenção devem ser inventariadas.</li>
          <li>Dados de pagamento/assinatura tratados pelo provedor de pagamentos. O RecebeAi não deve armazenar dados completos de cartão; confirmar na integração e no provedor.</li>
        </ul>
      </Section>

      <Section title="4. Finalidades e bases legais">
        <p className={paragraphClass}>
          Os dados podem ser usados para fornecer a plataforma, autenticar usuários, organizar
          recebíveis, prestar suporte, administrar assinaturas e pagamentos, manter a segurança e
          cumprir obrigações legais. A base legal aplicável deve ser definida por finalidade e
          categoria, incluindo execução de contrato, obrigação legal, exercício regular de direitos
          ou legítimo interesse quando cabível. Não se deve inserir dado pessoal sem base legal e
          informação adequada aos titulares.
        </p>
      </Section>

      <Section title="5. Compartilhamento e fornecedores">
        <p className={paragraphClass}>
          O funcionamento envolve provedores de hospedagem, banco de dados, autenticação e pagamento,
          incluindo Supabase, Vercel e Mercado Pago conforme a configuração atual. A lista final deve
          especificar entidades, serviços, finalidades, regiões de processamento, suboperadores e
          eventuais transferências internacionais. Os dados não devem ser vendidos. O compartilhamento
          deve ficar limitado ao necessário, às instruções do cliente e às obrigações legais.
        </p>
      </Section>

      <Section title="6. Retenção, segurança e incidentes">
        <p className={paragraphClass}>
          O prazo de retenção por categoria, os critérios de eliminação e os dados mantidos em backups
          ainda precisam ser definidos. São usados controles de acesso e isolamento entre empresas;
          detalhes de segurança publicados devem corresponder à arquitetura e aos testes efetivamente
          verificados. O procedimento para avaliar e comunicar incidentes deve ser formalizado,
          observadas as regras e prazos legais aplicáveis.
        </p>
      </Section>

      <Section title="7. Direitos dos titulares">
        <p className={paragraphClass}>
          Titulares podem solicitar, nos termos da LGPD, confirmação e acesso, correção, anonimização,
          bloqueio ou eliminação quando cabível, portabilidade conforme regulamentação, informação
          sobre compartilhamento, revisão de decisões automatizadas quando aplicável, e revogação do
          consentimento quando essa for a base legal. Pedidos sobre dados inseridos por uma empresa
          usuária devem ser direcionados primeiro a essa empresa, que controla tais dados; o RecebeAi
          dará apoio conforme o papel e as instruções aplicáveis. Solicitações ao operador do serviço:
          <a className="ml-1 font-semibold text-blue-700 hover:underline" href="mailto:financeiro.saasrecebeai@gmail.com">
            financeiro.saasrecebeai@gmail.com
          </a>.
        </p>
      </Section>

      <Section title="8. Cookies, demonstração e menores">
        <p className={paragraphClass}>
          O produto possui modo de demonstração com dados fictícios locais, separado da conta real.
          Inventário de cookies, armazenamento local, analytics e tecnologias de terceiros deve ser
          completado antes da versão final. O serviço é voltado a empresas e não deve receber dados
          de crianças ou adolescentes sem avaliação jurídica e salvaguardas específicas.
        </p>
      </Section>

      <Section title="9. Atualizações desta política">
        <p className={paragraphClass}>
          A versão final deve indicar vigência e mecanismo para avisar alterações relevantes. Consulte
          esta página e entre em contato pelo canal acima para dúvidas ou solicitações.
        </p>
      </Section>
    </PublicPage>
  );
}

function Support() {
  return (
    <PublicPage
      title="Suporte"
      description="Canal de atendimento do RecebeAi. Os prazos e horários ainda não foram definidos; não há SLA anunciado."
      icon={LifeBuoy}
    >
      <Section title="Fale com o suporte">
        <p className={paragraphClass}>
          Envie sua solicitação para o e-mail de suporte. Inclua o nome da empresa, o e-mail da conta,
          uma descrição do problema e, se possível, os passos para reproduzi-lo.
        </p>
        <a
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          href="mailto:financeiro.saasrecebeai@gmail.com?subject=Suporte%20RecebeAi"
        >
          <Mail className="h-4 w-4" />
          financeiro.saasrecebeai@gmail.com
        </a>
      </Section>

      <Section title="Proteja suas informações">
        <p className={paragraphClass}>
          Nunca envie senha, token de acesso, código de autenticação, chave de API, dados completos
          de cartão ou credenciais de clientes por e-mail. Para relatar um incidente de segurança,
          escreva “URGENTE — segurança” no assunto e descreva o ocorrido sem anexar segredos.
        </p>
      </Section>

      <Section title="Horário e prazo de resposta">
        <p className={paragraphClass}>
          Horário de atendimento, prazo de primeira resposta, escalonamento e eventual suporte
          prioritário ainda não foram definidos. Não há garantia de resposta em prazo específico.
          Esses compromissos precisam ser estabelecidos antes da comercialização.
        </p>
      </Section>

      <Section title="Dados para solicitações LGPD">
        <p className={paragraphClass}>
          Para exercer direitos relacionados à sua conta ou questionar o tratamento realizado pelo
          RecebeAi, use o mesmo canal. Solicitações sobre dados que sua empresa inseriu na plataforma
          devem ser encaminhadas ao administrador da sua empresa.
        </p>
      </Section>
    </PublicPage>
  );
}

export { PrivacyPolicy, Support, TermsOfUse };
