import { Icon } from '../common/Icon';
import React, { useState } from 'react';

interface LegalViewProps {
  initialDoc?: 'privacy' | 'terms';
  onNavigateHome?: () => void;
  onNavigateBuilder?: () => void;
}

export const LegalView: React.FC<LegalViewProps> = ({
  initialDoc = 'privacy',
  onNavigateHome,
  onNavigateBuilder,
}) => {
  const [activeDoc, setActiveDoc] = useState<'privacy' | 'terms'>(initialDoc);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Navigation Breadcrumb & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-2">
            <Icon name="verified_user" className="text-[16px]" />
            Conformidade com a Lei n.º 22/11 (República de Angola)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface font-display tracking-tight">
            {activeDoc === 'privacy' ? 'Política de Privacidade & Proteção de Dados' : 'Termos de Uso da Plataforma'}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Operado por <strong>Chinua Ndembo – Comércio e Prestação de Serviços</strong> &bull; Luanda, Angola
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-2xl border border-surface-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveDoc('privacy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeDoc === 'privacy'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name="policy" className="text-[16px]" />
            Política de Privacidade
          </button>
          <button
            type="button"
            onClick={() => setActiveDoc('terms')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeDoc === 'terms'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name="gavel" className="text-[16px]" />
            Termos de Uso
          </button>
        </div>
      </div>

      {/* Document Content Box */}
      <div className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl border border-surface-border shadow-xs text-on-surface leading-relaxed text-sm space-y-6">
        {activeDoc === 'privacy' ? (
          <div className="space-y-6 text-slate-700">
            <div className="border-b border-surface-border pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Política de Privacidade e Proteção de Dados Pessoais — CV IA Angola
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                <strong>Última atualização:</strong> 20 de agosto de 2026
              </p>
            </div>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                Quem trata os seus dados
              </h3>
              <p className="text-xs sm:text-sm pl-8">
                A CV IA Angola é um serviço operado por <strong>Chinua Ndembo – Comércio e Prestação de Serviços</strong>, com sede em Luanda, Angola, responsável pelo tratamento dos dados pessoais recolhidos através desta aplicação, em conformidade com a <strong>Lei n.º 22/11, de 17 de Junho — Lei de Proteção de Dados Pessoais</strong>.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                Que dados recolhemos
              </h3>
              <div className="text-xs sm:text-sm pl-8 space-y-2">
                <p>Para lhe prestar o serviço de criação de currículo, recolhemos:</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
                  <li><strong>Dados de identificação:</strong> nome completo, e-mail e/ou número de telemóvel</li>
                  <li><strong>Dados de conteúdo do CV:</strong> experiência profissional, formação académica, competências, idiomas, resumo profissional e fotografia tipo passe (quando fornecida)</li>
                  <li><strong>Dados de pagamento:</strong> método de pagamento escolhido (Multicaixa Xpress ou Transferência IBAN), valor pago e comprovativo de pagamento submetido</li>
                  <li><strong>Dados técnicos:</strong> registo de acessos e atividade na aplicação, para fins de segurança e prevenção de fraude</li>
                </ul>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                Para que finalidades usamos os seus dados
              </h3>
              <div className="text-xs sm:text-sm pl-8 space-y-2">
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
                  <li>Gerar e disponibilizar o seu currículo em formato PDF</li>
                  <li>Processar e validar o pagamento do serviço</li>
                  <li>Comunicar consigo sobre o estado do seu pedido (aprovação, rejeição, confirmação)</li>
                  <li>Prevenir fraude e comprovativos de pagamento falsos</li>
                  <li>Cumprir obrigações legais aplicáveis em Angola</li>
                </ul>
                <p className="font-medium text-slate-800 pt-1">
                  Não usamos os seus dados para finalidades diferentes das indicadas acima, nem os vendemos a terceiros.
                </p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
                Base legal do tratamento
              </h3>
              <p className="text-xs sm:text-sm pl-8">
                O tratamento dos seus dados baseia-se no <strong>consentimento</strong> que nos dá ao criar uma conta e submeter os seus dados, e na <strong>execução do serviço</strong> que nos contratou (criação e entrega do CV).
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">5</span>
                Por quanto tempo guardamos os seus dados
              </h3>
              <div className="text-xs sm:text-sm pl-8 space-y-1.5 text-slate-600">
                <p>&bull; Os dados do seu CV e conta são guardados enquanto mantiver a conta ativa na aplicação.</p>
                <p>&bull; Os comprovativos de pagamento são guardados durante o tempo necessário para efeitos de auditoria e prevenção de fraude.</p>
                <p>&bull; Pode solicitar a eliminação dos seus dados a qualquer momento, através do contacto indicado na secção 8 ou da sua área de utilizador, sujeito a obrigações legais de conservação que se apliquem.</p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">6</span>
                Segurança dos dados
              </h3>
              <div className="text-xs sm:text-sm pl-8 space-y-1.5 text-slate-600">
                <p>Aplicamos medidas técnicas e organizativas para proteger os seus dados, incluindo:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Ligações encriptadas (HTTPS) em toda a aplicação</li>
                  <li>Encriptação de dados sensíveis armazenados (fotografia, contactos, comprovativos de pagamento)</li>
                  <li>Acesso restrito aos dados de clientes, limitado aos encarregados de proteção de dados (DPO - CV IA Angola / Chinua Ndembo, Lda)</li>
                  <li>Registo de auditoria de acessos a dados de clientes</li>
                </ul>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">7</span>
                Os seus direitos
              </h3>
              <div className="text-xs sm:text-sm pl-8 space-y-1.5 text-slate-600">
                <p>Nos termos da Lei 22/11, tem direito a:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>Aceder</strong> aos dados pessoais que tratamos sobre si</li>
                  <li><strong>Retificar</strong> dados incorretos ou desatualizados</li>
                  <li><strong>Solicitar a eliminação</strong> dos seus dados (Direito ao Esquecimento)</li>
                  <li><strong>Retirar o consentimento</strong> dado, a qualquer momento</li>
                  <li><strong>Opor-se</strong> a determinados tratamentos dos seus dados</li>
                </ul>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">8</span>
                Como exercer os seus direitos ou esclarecer dúvidas
              </h3>
              <p className="text-xs sm:text-sm pl-8">
                Para exercer qualquer um destes direitos, ou para qualquer questão sobre esta Política, contacte o <strong>DPO — CV IA Angola (Chinua Ndembo, Lda)</strong> através da Linha Direta: <strong className="text-primary font-mono">957 427 090</strong> ou utilize a opção "Solicitar Eliminação dos Meus Dados" no menu do seu perfil.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">9</span>
                Partilha de dados com terceiros
              </h3>
              <p className="text-xs sm:text-sm pl-8">
                Os seus dados de pagamento podem ser partilhados com prestadores de serviços de pagamento (Multicaixa/EMIS, instituição bancária BAI) apenas na medida necessária para processar a transação. Não partilhamos os seus dados com terceiros para fins de marketing.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">10</span>
                Alterações a esta Política
              </h3>
              <p className="text-xs sm:text-sm pl-8">
                Esta Política pode ser atualizada periodicamente. Notificaremos os utilizadores sobre alterações relevantes através da aplicação.
              </p>
            </section>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium mt-6">
              *Ao criar uma conta e utilizar a CV IA Angola, confirma que leu e aceita esta Política de Privacidade.*
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-slate-700">
            <div className="border-b border-surface-border pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Termos de Uso — CV IA Angola
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                <strong>Última atualização:</strong> 20 de agosto de 2026
              </p>
            </div>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                Aceitação dos Termos
              </h3>
              <p className="text-xs sm:text-sm pl-8">
                Ao aceder ou utilizar a aplicação <strong>CV IA Angola</strong>, operada por <strong>Chinua Ndembo – Comércio e Prestação de Serviços</strong>, com sede em Luanda, Angola, o utilizador declara ter lido, compreendido e aceite os presentes Termos de Uso, bem como a Política de Privacidade. Se não concordar com estes Termos, não deve utilizar o serviço.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                Descrição do Serviço
              </h3>
              <p className="text-xs sm:text-sm pl-8">
                A CV IA Angola é uma plataforma digital que permite ao utilizador criar um currículo profissional com apoio de inteligência artificial, escolher entre os modelos disponíveis (<strong>Classic Simple, Creative Tech, Executive Classic, Lumina Modern</strong>) e descarregar o resultado em formato PDF, mediante pagamento.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                Cadastro e Conta
              </h3>
              <div className="text-xs sm:text-sm pl-8 space-y-1.5 text-slate-600">
                <p>&bull; Para utilizar o serviço, o utilizador deve registar-se com e-mail ou número de telemóvel válido.</p>
                <p>&bull; O utilizador é responsável por manter a confidencialidade da sua palavra-passe e por todas as atividades realizadas na sua conta.</p>
                <p>&bull; O utilizador compromete-se a fornecer informações verdadeiras e atualizadas.</p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
                Preço e Pagamento
              </h3>
              <div className="text-xs sm:text-sm pl-8 space-y-1.5 text-slate-600">
                <p>&bull; Cada download de currículo tem o custo de <strong>2.000 Kz (dois mil Kwanzas)</strong>.</p>
                <p>&bull; O pagamento pode ser efetuado através de <strong>Multicaixa Xpress</strong> ou <strong>Transferência bancária (IBAN do BAI)</strong>, conforme indicado na aplicação.</p>
                <p>&bull; O acesso ao download do CV é liberado apenas após a <strong>confirmação manual do pagamento</strong> pela equipa administrativa.</p>
                <p>&bull; Cada pagamento dá direito a <strong>um único download</strong>. Para criar ou descarregar um novo CV (incluindo versões editadas), é necessário efetuar um novo pagamento.</p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">5</span>
                Política de Reembolso
              </h3>
              <div className="text-xs sm:text-sm pl-8 space-y-1.5 text-slate-600">
                <p>&bull; <strong>Não há lugar a reembolso</strong> após a confirmação do pagamento e liberação do download do CV.</p>
                <p>&bull; Caso o pagamento seja rejeitado por comprovativo inválido, ilegível ou incorreto, o utilizador será notificado do motivo e poderá reenviar um novo comprovativo, sem custo adicional, desde que o pagamento original seja válido.</p>
                <p>&bull; Em caso de erro técnico comprovado da aplicação que impeça o acesso ao CV já pago, o utilizador tem direito a nova tentativa de download sem custo adicional, ou a reembolso, a critério da CV IA Angola.</p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">6</span>
                Comprovativos de Pagamento e Prevenção de Fraude
              </h3>
              <p className="text-xs sm:text-sm pl-8">
                O utilizador compromete-se a submeter apenas comprovativos de pagamento verdadeiros e correspondentes a uma transação real. A submissão de comprovativos falsos ou fraudulentos pode resultar na suspensão ou encerramento imediato da conta, sem prejuízo de outras medidas legais aplicáveis.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">7</span>
                Propriedade e Uso do Conteúdo
              </h3>
              <div className="text-xs sm:text-sm pl-8 space-y-1.5 text-slate-600">
                <p>&bull; O conteúdo inserido pelo utilizador no formulário (dados pessoais, experiência, fotografia, etc.) permanece propriedade do utilizador.</p>
                <p>&bull; O CV gerado, após pagamento confirmado, pode ser livremente utilizado, partilhado e impresso pelo utilizador para fins pessoais e profissionais.</p>
                <p>&bull; Os modelos de design, estrutura visual e tecnologia da aplicação são propriedade da CV IA Angola e não podem ser copiados, revendidos ou redistribuídos sem autorização.</p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">8</span>
                Sugestões geradas por Inteligência Artificial
              </h3>
              <p className="text-xs sm:text-sm pl-8">
                A aplicação pode sugerir textos e melhorias através de inteligência artificial, com base nas informações fornecidas pelo utilizador. Estas sugestões têm caráter meramente auxiliar. O utilizador é responsável por rever e validar a veracidade e adequação de todo o conteúdo final do seu currículo.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">9</span>
                Proteção de Dados Pessoais
              </h3>
              <p className="text-xs sm:text-sm pl-8">
                O tratamento dos dados pessoais do utilizador rege-se pela <strong>Política de Privacidade</strong> da CV IA Angola, elaborada em conformidade com a <strong>Lei n.º 22/11, de 17 de Junho — Lei de Proteção de Dados Pessoais</strong>, disponível na aplicação.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">10</span>
                Avaliações
              </h3>
              <div className="text-xs sm:text-sm pl-8 space-y-1.5 text-slate-600">
                <p>&bull; Apenas utilizadores com pagamento aprovado podem submeter uma avaliação sobre o serviço.</p>
                <p>&bull; As avaliações devem refletir uma experiência genuína com o serviço. Avaliações falsas, ofensivas ou que violem direitos de terceiros poderão ser removidas.</p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">11</span>
                Limitação de Responsabilidade
              </h3>
              <div className="text-xs sm:text-sm pl-8 space-y-1.5 text-slate-600">
                <p>&bull; A CV IA Angola envida os melhores esforços para garantir a disponibilidade e correto funcionamento da aplicação, mas não garante disponibilidade ininterrupta ou isenta de erros.</p>
                <p>&bull; A CV IA Angola não se responsabiliza por decisões de contratação ou seleção profissional tomadas por terceiros com base no CV gerado pelo utilizador.</p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">12</span>
                Alterações aos Termos
              </h3>
              <p className="text-xs sm:text-sm pl-8">
                Estes Termos de Uso podem ser atualizados periodicamente. As alterações relevantes serão comunicadas na aplicação. A utilização continuada do serviço após a alteração implica a aceitação dos novos Termos.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">13</span>
                Lei Aplicável
              </h3>
              <p className="text-xs sm:text-sm pl-8">
                Os presentes Termos regem-se pela legislação da <strong>República de Angola</strong>, incluindo a <strong>Lei n.º 22/11, de 17 de Junho</strong>, no que respeita à proteção de dados pessoais.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">14</span>
                Contacto & Suporte
              </h3>
              <p className="text-xs sm:text-sm pl-8">
                Para questões relacionadas com estes Termos de Uso, contacte o suporte da <strong>CV IA Angola (Chinua Ndembo, Lda)</strong> através da Linha Direta: <strong className="text-primary font-mono">957 427 090</strong> ou e-mail: <a href="mailto:chinua.ndembo@gmail.com" className="text-primary font-mono hover:underline">chinua.ndembo@gmail.com</a>.
              </p>
            </section>

            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium mt-6">
              *Ao criar uma conta e utilizar a CV IA Angola, confirma que leu e aceita estes Termos de Uso.*
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
        {onNavigateHome && (
          <button
            type="button"
            onClick={onNavigateHome}
            className="px-5 py-2.5 rounded-xl border border-surface-border bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Icon name="arrow_back" className="text-[16px]" />
            Voltar à Página Inicial
          </button>
        )}

        {onNavigateBuilder && (
          <button
            type="button"
            onClick={onNavigateBuilder}
            className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>Criar Meu Currículo (2.000 Kz)</span>
            <Icon name="arrow_forward" className="text-[16px]" />
          </button>
        )}
      </div>
    </div>
  );
};
