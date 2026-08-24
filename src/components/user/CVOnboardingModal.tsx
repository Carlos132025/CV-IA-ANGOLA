import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CVOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ONBOARDING_STEPS = [
  {
    step: 1,
    title: 'Preencha os Seus Dados',
    subtitle: 'Passo a Passo Intuitivo',
    description:
      'Insira as suas informações pessoais, número de telemóvel angolano (+244), foto passe 3:4, histórico profissional, cursos e formação académica com facilidade.',
    icon: 'badge',
    badge: 'Passo 1 de 4',
    highlight: 'Dica: Pode carregar a sua foto tipo passe diretamente do telemóvel.',
    color: 'from-blue-600 to-indigo-600',
  },
  {
    step: 2,
    title: 'Potenciado por Inteligência Artificial',
    subtitle: 'Melhoria Automática de Textos',
    description:
      'Utilize os botões mágicos de IA para gerar resumos profissionais de alto impacto e responsabilidades ajustadas às exigências das empresas em Angola.',
    icon: 'auto_awesome',
    badge: 'Passo 2 de 4',
    highlight: 'Destaque-se: O algoritmo melhora a gramática e a persuasão do seu currículo.',
    color: 'from-indigo-600 to-purple-600',
  },
  {
    step: 3,
    title: '4 Modelos Profissionais Modernos',
    subtitle: 'Design de Alto Nível',
    description:
      'Escolha entre os modelos Lumina Modern, Executive Classic, Creative Tech e Classic Simple com pré-visualização instantânea e personalização de cores.',
    icon: 'palette',
    badge: 'Passo 3 de 4',
    highlight: 'Adaptabilidade: Alterne livremente entre os 4 temas a qualquer momento.',
    color: 'from-purple-600 to-pink-600',
  },
  {
    step: 4,
    title: 'Pague e Baixe o Seu PDF',
    subtitle: 'Multicaixa Xpress & BAI Directo',
    description:
      'Efetue o pagamento único de apenas 2.000 Kz via Multicaixa Xpress (923 845 779) ou Transferência BAI para desbloquear o download em PDF nítido e pronto para imprimir.',
    icon: 'verified',
    badge: 'Passo 4 de 4',
    highlight: 'Vantagem: O seu CV fica salvo e desbloqueado para sempre na sua conta.',
    color: 'from-emerald-600 to-teal-600',
  },
];

export const CVOnboardingModal: React.FC<CVOnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('cvia_onboarding_completed', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs no-print">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-border overflow-hidden"
        >
          {/* Header Progress Bar & Badge */}
          <div className="p-6 sm:p-7 pb-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                <span className="material-symbols-outlined text-[14px]">school</span>
                {currentStep.badge}
              </span>
              <button
                type="button"
                onClick={handleComplete}
                className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-surface-container-high"
              >
                Pular Tutorial
              </button>
            </div>

            {/* Step Progress Indicators */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {ONBOARDING_STEPS.map((s, idx) => (
                <button
                  key={s.step}
                  onClick={() => setCurrentStepIndex(idx)}
                  type="button"
                  aria-label={`Ir para passo ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? 'bg-primary w-full shadow-xs'
                      : idx < currentStepIndex
                      ? 'bg-primary/40'
                      : 'bg-surface-container-highest'
                  }`}
                />
              ))}
            </div>

            {/* Step Content with Motion */}
            <div className="min-h-[220px] flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-linear-to-br ${currentStep.color} text-white flex items-center justify-center flex-shrink-0 shadow-md`}
                  >
                    <span className="material-symbols-outlined text-[26px]">
                      {currentStep.icon}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {currentStep.subtitle}
                    </span>
                    <h3 className="text-xl font-bold text-on-surface font-display tracking-tight leading-snug">
                      {currentStep.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                  {currentStep.description}
                </p>
              </div>

              <div className="bg-surface-container-low p-3.5 rounded-2xl border border-surface-border/60 flex items-center gap-2.5 text-xs text-on-surface font-medium">
                <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">
                  lightbulb
                </span>
                <span>{currentStep.highlight}</span>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-6 bg-surface-container-low/60 border-t border-surface-border flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                currentStepIndex === 0
                  ? 'opacity-0 pointer-events-none'
                  : 'text-on-surface-variant hover:bg-surface-container-high cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Anterior
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-white flex items-center gap-2 shadow-sm hover:shadow-md hover:bg-primary/95 transition-all cursor-pointer"
            >
              <span>{isLastStep ? 'Começar a Criar CV' : 'Seguinte'}</span>
              <span className="material-symbols-outlined text-[16px]">
                {isLastStep ? 'check_circle' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
