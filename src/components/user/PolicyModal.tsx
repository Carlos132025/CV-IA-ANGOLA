import { Icon } from '../common/Icon';
import React, { useState } from 'react';

interface PolicyModalProps {
  isOpen?: boolean;
  initialTab?: 'privacy' | 'terms' | 'refund';
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen = true,
  initialTab = 'privacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'refund'>(initialTab);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-surface-container-lowest rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="policy" className="text-[22px]" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-on-surface">
                Termos & Proteção de Dados (Lei 22/11)
              </h3>
              <p className="text-xs text-on-surface-variant">
                Chinua Ndembo – Comércio e Prestação de Serviços &bull; Luanda, Angola
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-2 rounded-xl hover:bg-surface-container-high transition-colors"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 pt-4 border-b border-surface-border pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Política de Privacidade (Lei 22/11)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Termos de Uso
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('refund')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'refund'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Garantia de Reembolso
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 text-xs sm:text-sm text-slate-700 space-y-4 leading-relaxed pr-2">
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 rounded-2xl border border-primary/15 text-primary text-xs font-semibold">
                🔒 Em estrita conformidade com a <strong>Lei n.º 22/11, de 17 de Junho — Lei de Proteção de Dados Pessoais de Angola</strong>.
              </div>

              <h4 className="font-bold text-sm text-slate-900">1. Quem trata os seus dados</h4>
              <p>
                A CV IA Angola é operada por <strong>Chinua Ndembo – Comércio e Prestação de Serviços</strong>, com sede em Luanda, Angola, responsável pelo tratamento dos dados pessoais recolhidos através desta aplicação.
              </p>

              <h4 className="font-bold text-sm text-slate-900">2. Que dados recolhemos</h4>
              <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                <li><strong>Dados de identificação:</strong> nome completo, e-mail e/ou número de telemóvel (+244)</li>
                <li><strong>Dados de conteúdo do CV:</strong> experiência profissional, formação académica, competências, idiomas, resumo profissional e fotografia tipo passe</li>
                <li><strong>Dados de pagamento:</strong> método de pagamento escolhido (Multicaixa Xpress ou Transferência IBAN), valor pago (2.000 Kz) e comprovativo de pagamento submetido</li>
                <li><strong>Dados técnicos:</strong> registo de acessos e atividade na aplicação para fins de segurança e prevenção de fraude</li>
              </ul>

              <h4 className="font-bold text-sm text-slate-900">3. Finalidades & Segurança</h4>
              <p>
                Os seus dados são usados exclusivamente para gerar o seu currículo em PDF, processar o pagamento, comunicar o estado da transação e prevenir fraudes. Aplicamos ligações encriptadas (HTTPS), encriptação de dados sensíveis em repouso e acesso estrito limitado aos encarregados autorizados de proteção de dados (DPO - CV IA Angola / Chinua Ndembo, Lda) com log de auditoria.
              </p>

              <h4 className="font-bold text-sm text-slate-900">4. Direitos do Titular (Eliminação de Dados)</h4>
              <p>
                Tem o direito de aceder, retificar ou <strong>solicitar a eliminação imediata dos seus dados</strong> (Direito ao Esquecimento) diretamente no seu perfil ou contactando o DPO pela Linha Direta: <strong className="text-primary font-mono">957 427 090</strong> ou e-mail: <strong className="text-primary font-mono">privacidade@cvia.ao</strong>.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">1. Descrição do Serviço & Preço</h4>
              <p>
                A CV IA Angola disponibiliza 4 modelos profissionais de currículo (<strong>Classic Simple, Creative Tech, Executive Classic, Lumina Modern</strong>) com assistência de inteligência artificial. O custo é de <strong>2.000 Kz por download</strong> liberado após confirmação manual do pagamento.
              </p>

              <h4 className="font-bold text-sm text-slate-900">2. Métodos de Pagamento Oficiais</h4>
              <p>
                Pagamentos via <strong>Multicaixa Xpress (923 845 779)</strong> ou <strong>Transferência Bancária BAI (IBAN: 0040 0000 6273 9820 1010 9)</strong> em nome de Chinua Ndembo, Lda.
              </p>

              <h4 className="font-bold text-sm text-slate-900">3. Comprovativos & Fraude</h4>
              <p>
                O utilizador compromete-se a submeter apenas comprovativos de pagamento verdadeiros. A submissão de comprovativos falsos resulta na suspensão imediata da conta.
              </p>

              <h4 className="font-bold text-sm text-slate-900">4. Propriedade do Conteúdo</h4>
              <p>
                Os dados inseridos no formulário permanecem sua propriedade. O CV gerado após o pagamento pode ser livremente impresso e utilizado em candidaturas profissionais.
              </p>
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">1. Garantia de Satisfação e Reembolso</h4>
              <p>
                Caso ocorra qualquer erro técnico comprovado que impeça o descarregamento do seu currículo após a confirmação do pagamento, garantimos:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                <li>Geração e envio prioritário do PDF formatado pelo suporte técnico.</li>
                <li>Emissão de um novo crédito de download sem custo adicional.</li>
                <li>Ou o reembolso total do montante pago (2.000 Kz) no prazo de 24 a 48 horas úteis via BAI ou Multicaixa Xpress.</li>
              </ul>
              <p className="text-slate-600">
                Para solicitar assistência ou suporte prioritário, contacte a Linha Direta: <strong className="text-primary font-mono">957 427 090</strong> ou e-mail <a href="mailto:chinua.ndembo@gmail.com" className="text-primary font-mono hover:underline">chinua.ndembo@gmail.com</a>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-surface-border flex items-center justify-between">
          <span className="text-[11px] text-on-surface-variant">
            Lei n.º 22/11 &bull; República de Angola
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
          >
            Compreendi e Aceito
          </button>
        </div>
      </div>
    </div>
  );
};
