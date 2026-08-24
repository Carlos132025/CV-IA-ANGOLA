import React, { useState, useEffect } from 'react';
import { CVTemplate } from '../../types';
import { CVPreviewDoc } from './CVPreviewDoc';
import { TEMPLATE_SAMPLE_MAP, SAMPLE_LUMINA_MODERN } from '../../data/templateSampleData';
import { PWAInstallModal } from '../common/PWAInstallModal';
import { promptPWAInstall, isStandalone, subscribeInstallPrompt } from '../../utils/pwaManager';
import { Logo } from '../common/Logo';

interface LandingViewProps {
  onStartBuilder: () => void;
  onSelectTemplate: (templateId: string) => void;
  templates: CVTemplate[];
  onOpenAuth?: (mode: 'login' | 'register_input') => void;
  onNavigateReviews?: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateTerms?: () => void;
  onOpenPolicyModal?: (tab: 'privacy' | 'terms' | 'refund') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStartBuilder,
  onSelectTemplate,
  templates,
  onOpenAuth,
  onNavigateReviews,
  onNavigatePrivacy,
  onNavigateTerms,
  onOpenPolicyModal,
}) => {
  const [selectedPreviewTab, setSelectedPreviewTab] = useState<string>('lumina-modern');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [zoomedTemplate, setZoomedTemplate] = useState<CVTemplate | null>(null);
  const [showPWAInstallModal, setShowPWAInstallModal] = useState<boolean>(false);
  const [standalone, setStandalone] = useState<boolean>(() => isStandalone());

  useEffect(() => {
    const unsubscribe = subscribeInstallPrompt(() => {
      setStandalone(isStandalone());
    });
    return unsubscribe;
  }, []);

  const handleInstallApp = async () => {
    const res = await promptPWAInstall();
    if (res === 'manual_guide' || res === 'dismissed') {
      setShowPWAInstallModal(true);
    }
  };

  const activeTemplate = templates.find((t) => t.id === selectedPreviewTab) || templates[0];

  const faqs = [
    {
      question: 'O que significa ATS?',
      answer:
        'ATS (Applicant Tracking System) é um sistema usado por empresas para filtrar e organizar currículos automaticamente antes de um recrutador humano os ver. Um CV otimizado para ATS aumenta as hipóteses de ser selecionado.',
    },
    {
      question: 'Como funciona o pagamento de 2.000 Kz (Multicaixa Xpress e BAI)?',
      answer:
        'O valor é fixo de 2.000 Kz por cada currículo descarregado em PDF de alta qualidade. Pode pagar em poucos segundos via Multicaixa Xpress (para o número 923 845 779) ou por Transferência Bancária BAI (IBAN: 0040 0000 6273 9820 1010 9, Titular: Chinua Ndembo, Lda). Sem mensalidades ou débitos surpresa.',
    },
    {
      question: 'Posso cadastrar-me apenas com o número de telemóvel ou apenas com e-mail?',
      answer:
        'Sim! Para facilitar o acesso em Angola, pode criar a sua conta utilizando apenas o seu número de telemóvel (recebendo um código de confirmação por SMS) OU apenas o seu e-mail. Não é obrigatório ter os dois.',
    },
    {
      question: 'E se eu me esquecer da minha palavra-passe?',
      answer:
        'Basta clicar em "Esqueci-me da palavra-passe" na tela de login, introduzir o seu número de telemóvel ou e-mail registado e receberá um código de verificação seguro de 6 dígitos. Após validar o código, poderá definir uma nova palavra-passe imediatamente.',
    },
    {
      question: 'Como a Inteligência Artificial melhora o meu currículo?',
      answer:
        'O nosso assistente de IA analisa a sua profissão e sugere resumos profissionais impactantes, responsabilidades detalhadas e competências valorizadas por empresas em Angola (Sonangol, Unitel, BAI, BFA, etc.). Pode aplicar as sugestões com 1 clique.',
    },
    {
      question: 'A foto tipo passe com recorte 3:4 funciona pelo telemóvel?',
      answer:
        'Sim! Pode carregar qualquer foto tirada com a câmara do seu telemóvel. O nosso sistema faz o enquadramento na proporção 3:4 oficial para RH e permite remover ou suavizar o fundo para um padrão 100% corporativo.',
    },
    {
      question: 'Os 4 modelos são aceites pelos sistemas de recrutamento (ATS)?',
      answer:
        'Sim! Todos os 4 modelos (Classic Simple, Creative Tech, Executive Classic e Lumina Modern) foram desenhados seguindo as normas internacionais e nacionais de leitura automática de candidatos (ATS), garantindo que as empresas consigam ler o seu perfil sem falhas técnicas.',
    },
  ];

  const testimonials = [
    {
      name: 'Manuel Domingos',
      role: 'Engenheiro Informático',
      company: 'Contratado em Talatona, Luanda',
      comment: 'Fiz o meu CV no telemóvel em 5 minutos usando o modelo Lumina Modern. O assistente de IA formulou o meu resumo de forma impecável. Fui chamado para entrevista na mesma semana!',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Ana Paula Costa',
      role: 'Contabilista Sénior',
      company: 'Contratada no Setor Bancário',
      comment: 'O modelo Executive Classic deu um ar muito mais sóbrio e profissional à minha experiência de 8 anos em contabilidade. O pagamento de 2.000 Kz por Multicaixa Xpress foi super rápido.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Edgar Ferreira',
      role: 'Gestor de Vendas & Logística',
      company: 'Benguela, Angola',
      comment: 'Nunca foi tão simples ter um currículo bem formatado. A foto tipo passe cortada com fundo limpo e a estrutura do Creative Tech fizeram toda a diferença na minha apresentação.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface selection:bg-primary-fixed-dim selection:text-primary">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-4 pb-12 sm:pt-12 sm:pb-24 border-b border-surface-border bg-gradient-to-b from-primary/5 via-surface to-surface">
        {/* Subtle Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#004ac6_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 relative z-10">
          <div className="text-center space-y-4 sm:space-y-6 max-w-3xl mx-auto">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] sm:text-xs font-bold shadow-xs max-w-full">
              <span className="material-symbols-outlined text-[15px] sm:text-[16px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span className="truncate sm:whitespace-normal">Inteligência Artificial para o Mercado de Angola</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-2xl sm:text-5xl lg:text-6xl font-extrabold text-on-surface tracking-tight leading-[1.2] sm:leading-[1.15] px-1">
              O seu Currículo Profissional com IA em{' '}
              <span className="text-primary underline decoration-primary/30 decoration-wavy">2 Minutos</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-base lg:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed px-1">
              Crie um CV moderno, perfeito para recrutadores em Angola. Aprimoramento automático de textos, foto tipo passe 3:4 com fundo limpo e 4 modelos com aprovação ATS.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2">
              <button
                id="hero-create-cv-btn"
                onClick={onStartBuilder}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-primary text-white font-display font-bold text-xs sm:text-base rounded-2xl shadow-lg hover:bg-primary/95 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">edit_document</span>
                <span>Criar Meu Currículo com IA</span>
              </button>

              <a
                href="#modelos"
                className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 bg-surface-container-low hover:bg-surface-container border border-surface-border text-on-surface font-display font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-primary">visibility</span>
                <span>Ver os 4 Modelos</span>
              </a>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-x-6 text-[11px] sm:text-xs text-on-surface-variant pt-2 font-medium">
              <div className="flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
                <span>Apenas 2.000 Kz (Preço Único)</span>
              </div>
              <div className="flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-lg border border-surface-border/50">
                <span className="material-symbols-outlined text-[15px] text-primary">smartphone</span>
                <span>Multicaixa Xpress & BAI</span>
              </div>
              <div className="flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-lg border border-surface-border/50">
                <span className="material-symbols-outlined text-[15px] text-primary">person_check</span>
                <span>Registo por Telemóvel ou E-mail</span>
              </div>
            </div>

            {/* Support & PWA Installation Banners */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5">
              {/* WhatsApp Support Highlight */}
              <a
                href="https://wa.me/244957427090?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20meu%20curr%C3%ADculo%20no%20CV%20IA%20Angola."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15 text-emerald-900 shadow-xs backdrop-blur-xs transition-all group"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div className="text-left text-xs">
                  <div className="font-extrabold text-emerald-900 flex items-center gap-1">
                    <span>Apoio WhatsApp:</span>
                    <span className="font-mono text-emerald-700 font-bold">957 427 090</span>
                  </div>
                </div>
              </a>

              {/* Install App Quick Button */}
              {!standalone && (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/15 text-blue-900 shadow-xs backdrop-blur-xs transition-all group cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[16px]">install_mobile</span>
                  </div>
                  <div className="text-left text-xs">
                    <div className="font-extrabold text-blue-900 flex items-center gap-1">
                      <span>Instalar App no Telemóvel</span>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Live Preview Showcase in Hero */}
          <div className="mt-8 sm:mt-16 bg-surface-container-lowest rounded-3xl border border-surface-border shadow-xl p-3.5 sm:p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-surface-border">
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-display text-xs sm:text-sm font-bold text-on-surface">
                  Demonstração em Tempo Real dos Modelos
                </span>
              </div>

              {/* Template Switcher Tabs */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 p-1 bg-surface-container rounded-2xl border border-surface-border w-full md:w-auto">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedPreviewTab(tpl.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      selectedPreviewTab === tpl.id
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="truncate">{tpl.name}</span>
                    {selectedPreviewTab === tpl.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Template Showcase Banner - Real Document Preview */}
            {activeTemplate && (
              <div className="mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
                <div className="lg:col-span-7 bg-slate-100 rounded-2xl overflow-hidden border border-surface-border relative group shadow-sm flex flex-col items-center justify-start min-h-[320px] sm:min-h-[380px] max-h-[460px] p-2">
                  {/* Real CV Document Rendering with scale */}
                  <div
                    className="w-full h-full overflow-hidden flex items-start justify-center relative cursor-pointer"
                    onClick={() => setZoomedTemplate(activeTemplate)}
                    title="Clique para ver o CV em tamanho real"
                  >
                    <div className="transform scale-[0.36] xs:scale-[0.42] sm:scale-[0.50] md:scale-[0.56] origin-top pointer-events-none shadow-xl rounded-lg overflow-hidden bg-white select-none">
                      <CVPreviewDoc
                        resume={TEMPLATE_SAMPLE_MAP[activeTemplate.id] || SAMPLE_LUMINA_MODERN}
                        resumeData={TEMPLATE_SAMPLE_MAP[activeTemplate.id] || SAMPLE_LUMINA_MODERN}
                        templates={templates}
                        selectedTemplateId={activeTemplate.id}
                        accentColor={TEMPLATE_SAMPLE_MAP[activeTemplate.id]?.accentColor || '#004ac6'}
                        showWatermark={false}
                      />
                    </div>
                  </div>

                  <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold text-primary shadow-sm flex items-center gap-1.5 z-10">
                    <span className="material-symbols-outlined text-[13px] sm:text-[14px]">stars</span>
                    <span>{activeTemplate.category}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setZoomedTemplate(activeTemplate)}
                    className="absolute bottom-3 right-3 bg-surface-container-lowest/95 backdrop-blur-md hover:bg-surface-container-lowest text-on-surface px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1 transition-all z-10 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">zoom_in</span>
                    <span>Ver CV Completo</span>
                  </button>
                </div>

                <div className="lg:col-span-5 space-y-3.5 sm:space-y-4 text-left">
                  <div className="inline-block px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                    Modelo Ativo: {activeTemplate.name}
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
                    Estrutura Pensada para o Mercado de Angola
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    {activeTemplate.description}
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-on-surface">
                      <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">check_circle</span>
                      <span>Enquadramento oficial de foto 3:4 com fundo neutro</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface">
                      <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">check_circle</span>
                      <span>Compatibilidade total com filtros ATS de empresas em Angola</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface">
                      <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">check_circle</span>
                      <span>Resumos e experiências aprimorados pelo assistente de IA</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={() => {
                        onSelectTemplate(activeTemplate.id);
                        onStartBuilder();
                      }}
                      className="w-full py-3 px-4 bg-primary text-white text-xs font-display font-bold rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit_note</span>
                      <span>Usar este Modelo Agora</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. COMO FUNCIONA (4 PASSOS SIMPLES)                                       */}
      {/* ========================================================================= */}
      <section id="como-funciona" className="py-12 sm:py-24 border-b border-surface-border bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-10 sm:mb-16">
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Como Funciona em 4 Passos Simples
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Sem complicações. Crie, aprimore e descarregue o seu currículo pronto para submissão.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {/* Step 1 */}
            <div className="bg-surface-container-low p-6 rounded-3xl border border-surface-border space-y-4 relative flex flex-col justify-between hover:border-primary/50 transition-all group shadow-xs">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-display font-black text-lg flex items-center justify-center shadow-md">
                  1
                </div>
                <h3 className="font-display text-base font-bold text-on-surface">
                  Entrada Simples
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Cadastre-se usando apenas o seu <strong>número de telemóvel (+244)</strong> ou <strong>e-mail</strong> com código OTP instantâneo.
                </p>
              </div>
              <div className="pt-3 border-t border-surface-border/60 text-[11px] font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                <span>Sem senhas complexas</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-surface-container-low p-6 rounded-3xl border border-surface-border space-y-4 relative flex flex-col justify-between hover:border-teal-500/50 transition-all group shadow-xs">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-display font-black text-lg flex items-center justify-center shadow-md">
                  2
                </div>
                <h3 className="font-display text-base font-bold text-on-surface">
                  Preencha com IA
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Insira as suas experiências e use o botão de <strong>Assistente de IA</strong> para gerar resumos e conquistas profissionais de alto impacto.
                </p>
              </div>
              <div className="pt-3 border-t border-surface-border/60 text-[11px] font-bold text-teal-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                <span>Textos profissionais em 1 clique</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-surface-container-low p-6 rounded-3xl border border-surface-border space-y-4 relative flex flex-col justify-between hover:border-indigo-500/50 transition-all group shadow-xs">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-display font-black text-lg flex items-center justify-center shadow-md">
                  3
                </div>
                <h3 className="font-display text-base font-bold text-on-surface">
                  Foto Passe 3:4
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Carregue uma fotografia pelo telemóvel. O sistema faz o <strong>enquadramento 3:4 automático</strong> e aplica fundo limpo corporativo.
                </p>
              </div>
              <div className="pt-3 border-t border-surface-border/60 text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">face</span>
                <span>Padrão 100% corporativo</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-surface-container-low p-6 rounded-3xl border border-surface-border space-y-4 relative flex flex-col justify-between hover:border-emerald-500/50 transition-all group shadow-xs">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-display font-black text-lg flex items-center justify-center shadow-md">
                  4
                </div>
                <h3 className="font-display text-base font-bold text-on-surface">
                  2.000 Kz & Download
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Pague com <strong>Multicaixa Xpress (923 845 779)</strong> ou Transferência BAI e receba o ficheiro PDF de alta resolução sem marca d'água.
                </p>
              </div>
              <div className="pt-3 border-t border-surface-border/60 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Download imediato em PDF</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. OS 4 MODELOS DE CV EM DETALHE                                          */}
      {/* ========================================================================= */}
      <section id="modelos" className="py-12 sm:py-24 border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-10 sm:mb-16">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              Catálogo de Design Profissional
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Escolha entre 4 Modelos Otimizados
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Modelos projetados especificamente para atender aos padrões dos Recursos Humanos em Angola.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((tpl) => {
              const getBadgeStyle = (category: string) => {
                switch (category) {
                  case 'Mais popular':
                    return {
                      bg: 'bg-blue-600 text-white border-blue-400/30',
                      icon: 'stars',
                    };
                  case 'Premium':
                    return {
                      bg: 'bg-amber-600 text-white border-amber-400/30',
                      icon: 'workspace_premium',
                    };
                  case 'Novo':
                    return {
                      bg: 'bg-emerald-600 text-white border-emerald-400/30',
                      icon: 'auto_awesome',
                    };
                  case 'Clássico':
                  default:
                    return {
                      bg: 'bg-slate-800 text-white border-slate-700',
                      icon: 'verified',
                    };
                }
              };

              const badge = getBadgeStyle(tpl.category);

              return (
                <div
                  key={tpl.id}
                  className="bg-surface-container-lowest rounded-3xl border border-surface-border shadow-md overflow-hidden group hover:border-primary hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <div
                    className="relative h-80 bg-slate-100 overflow-hidden cursor-pointer"
                    onClick={() => setZoomedTemplate(tpl)}
                    title={`Clique para ver o modelo ${tpl.name} em tamanho real`}
                  >
                    <img
                      src={tpl.thumbnailUrl}
                      alt={`Pré-visualização real do modelo ${tpl.name}`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 shadow-inner"
                    />
                    
                    {/* Visual overlay on mobile & hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-3.5 gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomedTemplate(tpl);
                        }}
                        className="w-full py-2.5 bg-white text-slate-900 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px] text-primary">zoom_in</span>
                        <span>Ver CV em Tamanho Real</span>
                      </button>
                    </div>

                    <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-extrabold shadow-md flex items-center gap-1 border ${badge.bg}`}>
                      <span className="material-symbols-outlined text-[13px]">{badge.icon}</span>
                      <span>{tpl.category}</span>
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-on-surface">
                          {tpl.name}
                        </h3>
                        <span className="text-[11px] font-mono text-on-surface-variant font-medium">
                          {tpl.popularityPercentage}% escolha
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-surface-border flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setZoomedTemplate(tpl)}
                        className="w-full py-2 bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-border font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">zoom_in</span>
                        <span>Pré-visualizar CV Real</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectTemplate(tpl.id);
                          onStartBuilder();
                        }}
                        className="w-full py-2.5 bg-primary text-white font-display font-bold text-xs rounded-xl hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <span>Usar este Modelo</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PREÇO EM DESTAQUE (2.000 KZ)                                           */}
      {/* ========================================================================= */}
      <section id="precos" className="py-16 sm:py-24 border-b border-surface-border bg-gradient-to-b from-surface-container-lowest to-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-primary/10 via-surface-container-lowest to-emerald-500/10 rounded-3xl border-2 border-primary/30 p-6 sm:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">price_check</span>
                  <span>Pagamento Único Sem Subscrição</span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface">
                  Tudo Incluído por Apenas 2.000 Kz
                </h2>

                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Pague uma única vez quando estiver 100% satisfeito com o seu currículo e descarregue o PDF completo sem marca d'água.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-medium text-on-surface">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                    <span>Download ilimitado do PDF gerado</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-on-surface">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                    <span>Acesso completo ao gerador e corretor de textos por IA</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-on-surface">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                    <span>Enquadramento profissional da foto passe 3:4</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-on-surface">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                    <span>Pagamento via Multicaixa Xpress (923 845 779) ou BAI</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-5 bg-surface-container-lowest p-6 rounded-2xl border border-surface-border shadow-md text-center space-y-4">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Valor por Currículo
                </span>

                <div className="font-display font-extrabold text-4xl sm:text-5xl text-primary">
                  2.000 <span className="text-lg font-bold text-on-surface">Kz</span>
                </div>

                <div className="text-[11px] text-on-surface-variant bg-surface-container-low p-2.5 rounded-xl border border-surface-border">
                  1 Pagamento = 1 Download PDF Completo em Alta Definição
                </div>

                <button
                  onClick={onStartBuilder}
                  className="w-full py-3.5 bg-primary text-white font-display font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                  <span>Começar a Criar Agora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DEPOIMENTOS DE CANDIDATOS EM ANGOLA                                    */}
      {/* ========================================================================= */}
      <section id="avaliacoes" className="py-16 sm:py-24 border-b border-surface-border bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-bold border border-amber-500/20">
              <span className="material-symbols-outlined text-[16px] text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                grade
              </span>
              Avaliações Verificadas (4.9 / 5.0)
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Profissionais que Conquistaram Entrevistas
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Veja a opinião de quem já usou o CV IA Angola para avançar na carreira. Apenas compradores verificados avaliam.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-surface-container-low p-6 rounded-3xl border border-surface-border space-y-4 flex flex-col justify-between shadow-xs hover:border-primary/30 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex text-amber-500">
                    {'★'.repeat(5)}
                  </div>
                  <p className="text-xs text-on-surface italic leading-relaxed">
                    "{t.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-surface-border/60">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border border-primary/20"
                    loading="lazy"
                    decoding="async"
                  />
                  <div>
                    <h4 className="font-display text-xs font-bold text-on-surface">
                      {t.name}
                    </h4>
                    <p className="text-[11px] text-primary font-semibold">{t.role}</p>
                    <p className="text-[10px] text-on-surface-variant">{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {onNavigateReviews && (
            <div className="text-center mt-8">
              <button
                type="button"
                onClick={onNavigateReviews}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high border border-surface-border text-xs font-bold text-on-surface transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-primary text-[18px]">rate_review</span>
                <span>Ver Todas as Avaliações & Deixar Opinião</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FAQ (PERGUNTAS FREQUENTES)                                             */}
      {/* ========================================================================= */}
      <section id="perguntas" className="py-16 sm:py-24 border-b border-surface-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              Tire as Suas Dúvidas
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Perguntas Frequentes (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Tudo o que precisa de saber sobre o funcionamento do CV IA Angola.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-surface-container-lowest rounded-2xl border border-surface-border overflow-hidden transition-all shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-display font-bold text-xs sm:text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <span>{faq.question}</span>
                    <span
                      className={`material-symbols-outlined text-[20px] text-primary transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-on-surface-variant leading-relaxed border-t border-surface-border/50 bg-surface-container-lowest animate-in fade-in duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. BOTTOM CTA BANNER                                                      */}
      {/* ========================================================================= */}
      <section className="py-16 bg-primary text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
            Pronto para Criar o Seu Currículo Vencedor?
          </h2>
          <p className="text-xs sm:text-base text-white/90 max-w-xl mx-auto">
            Junte-se a milhares de candidatos em Luanda e em todo o país. Otimize o seu perfil e comece hoje mesmo por apenas 2.000 Kz.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onStartBuilder}
              className="w-full sm:w-auto px-8 py-4 bg-white text-primary font-display font-bold text-sm rounded-2xl shadow-xl hover:bg-white/95 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">edit_document</span>
              <span>Criar Meu Currículo com IA</span>
            </button>

            {onOpenAuth && (
              <button
                onClick={() => onOpenAuth('register_input')}
                className="w-full sm:w-auto px-6 py-4 bg-primary-container/30 hover:bg-primary-container/40 border border-white/30 text-white font-display font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                <span>Criar Conta Gratuita</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="border-t border-surface-border pt-12 pb-24 sm:pb-12 bg-surface-container-lowest text-on-surface space-y-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center text-center md:text-left border-b border-surface-border/60 pb-8">
            {/* Brand column */}
            <div className="space-y-2 flex flex-col items-center md:items-start">
              <Logo variant="full" size="md" showSubtitle={false} />
              <p className="text-xs text-on-surface-variant max-w-xs">
                Plataforma líder em Angola para criação rápida e profissional de currículos adaptados ao mercado de trabalho.
              </p>
            </div>

            {/* Direct Support & Entity */}
            <div className="space-y-1.5 text-xs text-on-surface">
              <p className="font-bold text-on-surface flex items-center justify-center md:justify-start gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">apartment</span>
                Chinua Ndembo, Lda
              </p>
              <p className="text-on-surface-variant flex items-center justify-center md:justify-start gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">call</span>
                Suporte & Linha Direta: <a href="tel:957427090" className="text-primary hover:underline font-mono font-bold">957 427 090</a>
              </p>
              <p className="text-on-surface-variant flex items-center justify-center md:justify-start gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-blue-600">mail</span>
                Atendimento: <a href="mailto:chinua.ndembo@gmail.com" className="font-mono text-on-surface hover:text-primary hover:underline">chinua.ndembo@gmail.com</a>
              </p>
            </div>

            {/* Security and Trust Badge */}
            <div className="flex flex-col items-center md:items-end space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
                <span className="material-symbols-outlined text-[18px] text-emerald-700">verified_user</span>
                <span>Pagamento Seguro: Multicaixa Xpress & BAI</span>
              </div>
              <p className="text-[11px] text-on-surface-variant text-center md:text-right">
                Processamento instantâneo e suporte local garantido.
              </p>
            </div>
          </div>

          {/* Legal and Compliance Links (Lei 22/11) */}
          <div className="py-4 border-b border-surface-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (onNavigatePrivacy) onNavigatePrivacy();
                  else if (onOpenPolicyModal) onOpenPolicyModal('privacy');
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-border text-on-surface hover:text-primary text-[11px] sm:text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px]"
              >
                <span className="material-symbols-outlined text-[15px] text-primary">policy</span>
                <span>Privacidade (Lei 22/11)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onNavigateTerms) onNavigateTerms();
                  else if (onOpenPolicyModal) onOpenPolicyModal('terms');
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-border text-on-surface hover:text-primary text-[11px] sm:text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px]"
              >
                <span className="material-symbols-outlined text-[15px] text-primary">gavel</span>
                <span>Termos de Uso</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onOpenPolicyModal) onOpenPolicyModal('refund');
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-border text-on-surface hover:text-primary text-[11px] sm:text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px]"
              >
                <span className="material-symbols-outlined text-[15px] text-emerald-600">currency_exchange</span>
                <span>Reembolso</span>
              </button>
            </div>

            <div className="text-center sm:text-right text-[11px] text-on-surface-variant shrink-0">
              <span>PROTEÇÃO DE DADOS: </span>
              <strong className="font-semibold text-on-surface">DPO - Chinua Ndembo, Lda</strong>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
            <p className="text-[12px] text-center sm:text-left">
              &copy; {new Date().getFullYear()} CV IA Angola (Chinua Ndembo, Lda). Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Serviço 100% Operacional
              </span>
              <span>&bull;</span>
              <span>Luanda, Angola</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 9. FLOATING WHATSAPP SUPPORT WIDGET (957 427 090)                         */}
      {/* ========================================================================= */}
      <aside
        id="floating-whatsapp-support"
        aria-label="Suporte WhatsApp"
        className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 flex items-center gap-2 group animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <a
          href="https://wa.me/244957427090?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20meu%20curr%C3%ADculo%20no%20CV%20IA%20Angola."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl transition-all duration-300 transform group-hover:scale-105 border-2 border-white ring-4 ring-emerald-500/20 active:scale-95 cursor-pointer"
          title="Precisa de Ajuda? Fale Connosco no WhatsApp: 957 427 090"
        >
          <div className="relative flex items-center justify-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-white" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-200 rounded-full" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-100 uppercase tracking-wider leading-none">
              Apoio WhatsApp
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono leading-tight">
              957 427 090
            </span>
          </div>
        </a>
      </aside>

      {/* ========================================================================= */}
      {/* 10. ZOOM TEMPLATE MODAL (LIVE DOCUMENT PREVIEW)                           */}
      {/* ========================================================================= */}
      {zoomedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-surface-border">
            <div className="p-3.5 sm:p-4 border-b border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">description</span>
                </div>
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
                    <span>Modelo: {zoomedTemplate.name}</span>
                    <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-sans font-bold">
                      Aprovado ATS
                    </span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-on-surface-variant line-clamp-1 sm:line-clamp-none">{zoomedTemplate.description}</p>
                </div>
              </div>
              <button
                onClick={() => setZoomedTemplate(null)}
                className="p-1.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 sm:p-6 flex justify-center bg-slate-100">
              <div className="w-full max-w-[794px] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
                <CVPreviewDoc
                  resume={TEMPLATE_SAMPLE_MAP[zoomedTemplate.id] || SAMPLE_LUMINA_MODERN}
                  resumeData={TEMPLATE_SAMPLE_MAP[zoomedTemplate.id] || SAMPLE_LUMINA_MODERN}
                  templates={templates}
                  selectedTemplateId={zoomedTemplate.id}
                  accentColor={TEMPLATE_SAMPLE_MAP[zoomedTemplate.id]?.accentColor || '#004ac6'}
                  showWatermark={false}
                />
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 bg-surface-container-lowest">
              <div className="text-xs text-on-surface-variant text-center sm:text-left">
                Taxa de download: <strong className="text-primary font-bold">2.000 Kz</strong> (Pagamento Único)
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setZoomedTemplate(null)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container border border-surface-border transition-all cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    onSelectTemplate(zoomedTemplate.id);
                    setZoomedTemplate(null);
                    onStartBuilder();
                  }}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-primary text-white font-display font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_document</span>
                  <span>Usar Este Modelo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 11. PWA INSTALLATION MODAL                                                */}
      {/* ========================================================================= */}
      <PWAInstallModal
        isOpen={showPWAInstallModal}
        onClose={() => setShowPWAInstallModal(false)}
      />
    </div>
  );
};
