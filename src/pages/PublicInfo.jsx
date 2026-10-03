import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck, FileText, LifeBuoy } from "lucide-react";

const sectionClass = "space-y-3";
const headingClass = "text-lg font-bold text-slate-900";
const paragraphClass = "leading-7 text-slate-600";
const supportEmail = "financeiro.saasrecebeai@gmail.com";
const providerName = "Alexandre Marçal da Silva";
const providerCpf = "266.281.508-60";
const providerAddress = "Rua Sargento José André da Mota, nº 142 - Jardim Maria Duarte - CEP 05752-000";

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
        </header>

        <article className="mt-5 space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {children}
          <p className="border-t border-slate-100 pt-5 text-xs text-slate-400">
            Vigência: 03/10/2026. Atualizado em 03/10/2026.
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
      description="Condições de acesso, assinatura, cancelamento e uso da plataforma RecebeAi."
      icon={FileText}
    >
      <Section title="1. Identificação e contato">
        <p className={paragraphClass}>
          O RecebeAi é operado por {providerName}, inscrito no CPF sob nº {providerCpf}, com endereço
          informado em {providerAddress}. O canal de contato é{" "}
          <a className="font-semibold text-blue-700 hover:underline" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>.
        </p>
      </Section>

      <Section title="2. Aceite e elegibilidade">
        <p className={paragraphClass}>
          Ao criar uma conta, contratar um plano ou usar a plataforma, o usuário aceita estes Termos
          e a Política de Privacidade. O cadastro em nome de uma empresa deve ser realizado por pessoa
          autorizada. O usuário deve fornecer dados verdadeiros, manter seus contatos atualizados e
          avisar os demais usuários da empresa sobre estas condições.
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

      <Section title="6. Planos, cobrança, cancelamento e reembolso">
        <p className={paragraphClass}>
          Os planos disponíveis e seus preços são os exibidos na página de contratação antes do
          pagamento. Os planos Essencial e Profissional são cobrados mensalmente, com renovação
          automática até o cancelamento; o plano Enterprise não está disponível para contratação
          automática. O preço, período, tributos e forma de pagamento aplicáveis são apresentados
          antes de confirmar cada contratação. A assinatura é ativada após confirmação do pagamento
          pelo provedor e pelo RecebeAi.
        </p>
        <p className={paragraphClass}>
          O cliente pode cancelar a assinatura a qualquer momento na área da conta ou solicitando
          pelo e-mail {supportEmail}. Após a confirmação do Mercado Pago, o cancelamento impede novas
          cobranças e encerra imediatamente o acesso pago. Não há multa de cancelamento, mas não há
          reembolso proporcional do período já iniciado, exceto quando exigido por lei ou previsto
          na regra de reembolso abaixo. O cancelamento não elimina valores vencidos.
        </p>
        <p className={paragraphClass}>
          Para compras feitas pela internet, o RecebeAi aceita pedido de desistência e reembolso
          integral em até 7 dias corridos da contratação inicial. Como política comercial adicional,
          pedidos feitos em até 7 dias corridos de cada renovação mensal também recebem reembolso
          integral daquela cobrança. Solicite pelo e-mail {supportEmail}, identificando a conta e a
          cobrança, sem enviar dados completos de cartão. O pedido será confirmado em até 1 dia útil
          e, quando elegível, o estorno será solicitado ao meio de pagamento em até 5 dias úteis.
          O prazo para o valor aparecer depende do banco, emissor ou provedor de pagamento.
          Direitos legais de arrependimento, contestação, reembolso e proteção do consumidor
          prevalecem quando forem mais favoráveis ou obrigatórios.
        </p>
        <p className={paragraphClass}>
          Cobrança duplicada, não reconhecida ou erro de processamento deve ser reportado imediatamente
          pelo mesmo canal. O RecebeAi investigará e corrigirá cobranças indevidas, sem limitar o
          direito de contestar junto ao meio de pagamento.
        </p>
      </Section>

      <Section title="7. Disponibilidade, suspensão e encerramento">
        <p className={paragraphClass}>
          O serviço é disponibilizado continuamente, exceto por manutenção, falha de conectividade,
          indisponibilidade de fornecedores, força maior ou incidente de segurança. Sempre que
          razoavelmente possível, manutenções programadas serão comunicadas previamente. O acesso
          pode ser temporariamente limitado para proteger contas, cumprir a lei, tratar inadimplência
          ou interromper uso fraudulento/abusivo; quando possível, o usuário será avisado e poderá
          corrigir a situação. O usuário pode solicitar encerramento e exportação de seus dados pelo
          canal de suporte, conforme a Política de Privacidade.
        </p>
      </Section>

      <Section title="8. Propriedade intelectual e responsabilidade">
        <p className={paragraphClass}>
          A plataforma, sua marca e seus componentes permanecem com seus respectivos titulares.
          O usuário mantém os direitos sobre os dados que insere e concede ao RecebeAi apenas a
          autorização necessária para hospedá-los e tratá-los para prestar o serviço, conforme estes
          Termos e a Política de Privacidade. Nenhuma cláusula exclui garantias ou responsabilidades
          que não possam ser afastadas pela legislação aplicável.
        </p>
      </Section>

      <Section title="9. Lei aplicável e alterações">
        <p className={paragraphClass}>
          Estes Termos são regidos pelas leis brasileiras. Controvérsias serão tratadas pelo foro
          competente conforme a legislação aplicável, preservado o foro legal do consumidor quando
          cabível. Alterações relevantes serão informadas por aviso na plataforma ou pelo e-mail
          cadastrado; a versão vigente e a data de atualização estarão nesta página. O uso após a
          vigência da alteração constitui aceite quando permitido por lei; se o usuário não concordar,
          poderá cancelar a assinatura antes da próxima renovação.
        </p>
      </Section>
    </PublicPage>
  );
}

function PrivacyPolicy() {
  return (
    <PublicPage
      title="Política de Privacidade"
      description="Como o RecebeAi trata dados pessoais de titulares e dados inseridos por empresas usuárias."
      icon={ShieldCheck}
    >
      <Section title="1. Quem trata os dados">
        <p className={paragraphClass}>
          O RecebeAi é operado por {providerName}, CPF {providerCpf}, endereço {providerAddress}.
          Contato para privacidade e exercício de direitos:{" "}
          <a className="font-semibold text-blue-700 hover:underline" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>.
        </p>
      </Section>

      <Section title="2. Papéis no tratamento">
        <p className={paragraphClass}>
          Para cadastro, autenticação, cobrança da assinatura, suporte e segurança da própria conta,
          o operador do RecebeAi atua como controlador. Para dados de clientes/devedores inseridos
          por uma empresa usuária, essa empresa define as finalidades e atua como controladora; o
          RecebeAi trata os dados sob instruções da empresa para prestar o serviço, como operador,
          exceto quando a lei atribuir papel diferente.
        </p>
      </Section>

      <Section title="3. Dados que podem ser tratados">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
          <li>Dados de conta e autenticação, como nome, e-mail e identificadores técnicos.</li>
          <li>Dados da empresa usuária, configurações, plano e estado da assinatura.</li>
          <li>Dados de clientes da empresa inseridos no produto, como nome, contato, valores, vencimentos, histórico e observações de cobrança.</li>
          <li>Dados técnicos e registros de uso, diagnóstico, prevenção de fraude e segurança.</li>
          <li>Dados de assinatura e transação recebidos do provedor de pagamento; os dados completos do cartão são tratados pelo provedor, não solicitados pelo RecebeAi.</li>
        </ul>
      </Section>

      <Section title="4. Finalidades e bases legais">
        <p className={paragraphClass}>
          Os dados são usados para criar e proteger contas, fornecer e manter a plataforma, organizar
          recebíveis conforme instruções da empresa, processar assinaturas, responder solicitações,
          prevenir fraude e cumprir obrigações legais. As bases legais variam por operação e incluem
          execução de contrato, cumprimento de obrigação legal/regulatória, exercício regular de
          direitos e, quando aplicável após avaliação, legítimo interesse. A empresa usuária deve
          definir e documentar a base legal para os dados de seus próprios clientes e informá-los.
        </p>
      </Section>

      <Section title="5. Compartilhamento e fornecedores">
        <p className={paragraphClass}>
          Para operar o serviço, dados podem ser compartilhados com Supabase (banco/autenticação),
          Vercel (hospedagem e funções) e Mercado Pago (assinatura e pagamento), além de prestadores
          de suporte ou autoridades quando exigido por lei. Esses provedores podem processar dados
          no Brasil ou no exterior, conforme infraestrutura, contratos e configurações de cada serviço.
          O RecebeAi não vende dados pessoais. O acesso é limitado ao necessário para as finalidades
          descritas e às instruções da empresa controladora.
        </p>
      </Section>

      <Section title="6. Retenção, segurança e incidentes">
        <p className={paragraphClass}>
          Dados operacionais da conta e dados inseridos pela empresa são mantidos enquanto a conta
          estiver ativa. Após encerramento, o titular da conta pode solicitar exportação durante
          30 dias; os dados da conta e os dados operacionais identificáveis serão eliminados ou
          anonimizados dos sistemas ativos em até 90 dias, ressalvados dados cuja conservação seja
          necessária para obrigação legal/regulatória, prevenção a fraude ou exercício regular de
          direitos. Registros de suporte são mantidos por até 2 anos após o encerramento do chamado,
          salvo disputa ou obrigação legal. Registros de transações e documentos fiscais são retidos
          pelo prazo legal aplicável. Registros técnicos de segurança são mantidos pelo prazo
          necessário à segurança e às obrigações legais, normalmente por até 6 meses quando coletados.
        </p>
        <p className={paragraphClass}>
          Backups técnicos seguem os ciclos de retenção oferecidos e configurados nos provedores e
          podem permanecer até sua expiração rotativa; após restauração, uma exclusão anteriormente
          solicitada pode precisar ser reaplicada. O prazo do backup do projeto Supabase depende do
          plano e das configurações do projeto. Acesso a dados é limitado por controles de conta,
          políticas de banco e privilégios. Em caso de incidente com risco ou dano relevante, o
          controlador avaliará e fará as comunicações legalmente exigidas à ANPD e aos titulares.
        </p>
      </Section>

      <Section title="7. Direitos dos titulares">
        <p className={paragraphClass}>
          O titular pode solicitar confirmação de tratamento, acesso, correção, anonimização,
          bloqueio ou eliminação quando cabível, portabilidade conforme regulamentação, informação
          sobre compartilhamento, revisão de decisões automatizadas aplicáveis e revogação do
          consentimento quando essa for a base legal. O pedido será confirmado e atendido nos prazos
          legais; informações simplificadas serão fornecidas imediatamente quando possível e a
          declaração completa será fornecida no prazo legal. Pedidos relativos a dados inseridos por
          uma empresa devem ser encaminhados àquela empresa controladora; o RecebeAi auxiliará o
          controlador quando aplicável. Envie pedidos para{" "}
          <a className="font-semibold text-blue-700 hover:underline" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>.
        </p>
      </Section>

      <Section title="8. Cookies, demonstração e menores">
        <p className={paragraphClass}>
          O modo de demonstração usa dados fictícios locais e é separado da conta real. O serviço é
          destinado a empresas e não é projetado para uso por crianças. Não insira dados de crianças
          ou adolescentes, dados sensíveis ou dados excessivos, salvo se estritamente necessário,
          autorizado e tratado de acordo com a legislação aplicável. O site usa armazenamento técnico
          necessário para autenticação e funcionamento; tecnologias não essenciais, se adicionadas,
          dependerão de informação e consentimento quando exigidos.
        </p>
      </Section>

      <Section title="9. Atualizações desta política">
        <p className={paragraphClass}>
          Esta Política vigora a partir de 03/10/2026. Alterações relevantes serão comunicadas por
          aviso na plataforma ou pelo e-mail cadastrado; a data da atualização ficará indicada nesta
          página. Dúvidas e solicitações podem ser enviadas ao canal indicado acima.
        </p>
      </Section>
    </PublicPage>
  );
}

function Support() {
  return (
    <PublicPage
      title="Suporte"
      description="Canal e prazos de atendimento do RecebeAi."
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
          Atendimento em dias úteis, de segunda a sexta-feira, das 9h às 17h (horário de Brasília),
          exceto feriados nacionais. O RecebeAi confirmará o recebimento de solicitações comuns em
          até 1 dia útil e fornecerá uma resposta, plano de ação ou atualização em até 3 dias úteis.
          Incidentes de segurança ou indisponibilidade ampla devem ser identificados no assunto do
          e-mail e terão confirmação inicial em até 4 horas úteis dentro do horário de atendimento.
          Esses prazos são de resposta inicial/atualização, não uma garantia de resolução nesse prazo.
          Não há atendimento telefônico ou suporte 24 horas anunciado.
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
