import React, { useState, Suspense, lazy } from 'react';
import { BuilderStep, CVTemplate, ResumeData } from '../../types';
import { CVPreviewDoc } from './CVPreviewDoc';
import { LoadingFallback } from '../common/LoadingFallback';
import type { AISuggestionMode } from './AISuggestionModal';
import type { SubmittedPaymentData } from './PaymentModal';

// Lazy Loaded Sub-modals
const AISuggestionModal = lazy(() => import('./AISuggestionModal').then(m => ({ default: m.AISuggestionModal })));
const PassportPhotoModal = lazy(() => import('./PassportPhotoModal').then(m => ({ default: m.PassportPhotoModal })));
const PaymentModal = lazy(() => import('./PaymentModal').then(m => ({ default: m.PaymentModal })));
const PolicyModal = lazy(() => import('./PolicyModal').then(m => ({ default: m.PolicyModal })));
const CVOnboardingModal = lazy(() => import('./CVOnboardingModal').then(m => ({ default: m.CVOnboardingModal })));

import {
  checkIfCvHasUnpaidEdits,
  getPaidSnapshotAsResume,
} from '../../utils/cvHelpers';

interface CVBuilderWizardProps {
  resume: ResumeData;
  setResume: React.Dispatch<React.SetStateAction<ResumeData>>;
  templates: CVTemplate[];
  onPaymentSuccess?: (method: 'Multicaixa' | 'Transferência', txId: string) => void;
  onPaymentSubmitted?: (data: SubmittedPaymentData) => void;
  basePriceKz?: number;
  onNavigateMyCVs?: () => void;
}

export const CVBuilderWizard: React.FC<CVBuilderWizardProps> = ({
  resume,
  setResume,
  templates,
  onPaymentSuccess,
  onPaymentSubmitted,
  basePriceKz = 2000,
  onNavigateMyCVs,
}) => {
  const [step, setStep] = useState<BuilderStep>(1);

  // Editable CV Title state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInputValue, setTitleInputValue] = useState(resume.title || 'Meu Currículo');

  // AI Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiMode, setAiMode] = useState<AISuggestionMode>('summary');
  const [aiTargetExpId, setAiTargetExpId] = useState<string | null>(null);

  // Passport Photo Modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Payment Modal & Policies
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyInitialTab, setPolicyInitialTab] = useState<'terms' | 'refund' | 'privacy'>('terms');

  // User Onboarding Tour
  const [showOnboardingModal, setShowOnboardingModal] = useState(() => {
    try {
      return !localStorage.getItem('cvia_onboarding_completed');
    } catch {
      return false;
    }
  });

  // Input states
  const [newSkillInput, setNewSkillInput] = useState('');
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const stepTitles = {
    1: 'Informações Pessoais',
    2: 'Experiência Profissional',
    3: 'Formação & Certificados',
    4: 'Competências, Idiomas & Referências',
    5: 'Checkout & Descarregar CV',
  };

  const progressPercent = step * 20;

  // Copy helper
  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Helper to update resume data
  const updateResumeData = (updater: (prev: ResumeData) => ResumeData) => {
    setResume((prev) => {
      const updated = updater(prev);
      return {
        ...updated,
        updatedAt: 'Agora mesmo',
        isPaid: prev.isPaid,
        paymentStatus: prev.paymentStatus,
      };
    });
  };

  // Active experience being edited with AI if any
  const activeExp = resume.experiences.find((e) => e.id === aiTargetExpId);

  // Open AI Modal for Summary
  const handleOpenAISummary = () => {
    setAiMode('summary');
    setAiTargetExpId(null);
    setShowAIModal(true);
  };

  // Open AI Modal for a specific Experience item
  const handleOpenAIExperience = (expId: string) => {
    setAiMode('experience');
    setAiTargetExpId(expId);
    setShowAIModal(true);
  };

  // Open AI Modal for Skills
  const handleOpenAISkills = () => {
    setAiMode('skills');
    setAiTargetExpId(null);
    setShowAIModal(true);
  };

  // Handle AI application result
  const handleApplyAIText = (newText: string) => {
    if (aiMode === 'summary') {
      updateResumeData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          professionalSummary: newText,
        },
      }));
    } else if (aiMode === 'experience' && aiTargetExpId) {
      updateResumeData((prev) => ({
        ...prev,
        experiences: prev.experiences.map((exp) =>
          exp.id === aiTargetExpId ? { ...exp, description: newText } : exp
        ),
      }));
    }
  };

  // Handle AI bulk skills application
  const handleApplyAISkills = (skillsList: string[]) => {
    updateResumeData((prev) => {
      const existingNames = new Set(prev.skills.map((s) => s.name.toLowerCase()));
      const newSkillObjects = skillsList
        .filter((s) => !existingNames.has(s.toLowerCase()))
        .map((s) => ({ id: `sk-${Date.now()}-${Math.random()}`, name: s }));

      return {
        ...prev,
        skills: [...prev.skills, ...newSkillObjects],
      };
    });
  };

  // Quick remove photo
  const handleRemovePhoto = () => {
    updateResumeData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        photoUrl: '',
      },
    }));
  };

  // 1) Work experience handlers (multiple entries with add, edit, remove)
  const handleAddExperience = () => {
    updateResumeData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: `exp-${Date.now()}-${Math.random()}`,
          role: '',
          company: '',
          location: 'Luanda, Angola',
          startDate: '2023',
          endDate: 'Presente',
          isCurrent: true,
          description: '',
          highlights: [''],
        },
      ],
    }));
  };

  const handleRemoveExperience = (id: string) => {
    updateResumeData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
    }));
  };

  // 2) Education handlers
  const handleAddEducation = () => {
    updateResumeData((prev) => ({
      ...prev,
      educations: [
        ...prev.educations,
        {
          id: `edu-${Date.now()}-${Math.random()}`,
          degree: '',
          institution: '',
          location: 'Luanda, Angola',
          completionYear: '2024',
        },
      ],
    }));
  };

  const handleRemoveEducation = (id: string) => {
    updateResumeData((prev) => ({
      ...prev,
      educations: prev.educations.filter((e) => e.id !== id),
    }));
  };

  // 3) Certifications handlers
  const handleAddCertification = () => {
    updateResumeData((prev) => ({
      ...prev,
      certifications: [
        ...(prev.certifications || []),
        {
          id: `cert-${Date.now()}-${Math.random()}`,
          name: '',
          institution: '',
          year: new Date().getFullYear().toString(),
        },
      ],
    }));
  };

  const handleRemoveCertification = (id: string) => {
    updateResumeData((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter((c) => c.id !== id),
    }));
  };

  // 4) References handlers
  const handleAddReference = () => {
    updateResumeData((prev) => ({
      ...prev,
      references: [
        ...(prev.references || []),
        {
          id: `ref-${Date.now()}-${Math.random()}`,
          name: '',
          role: '',
          company: '',
          phone: '',
          email: '',
          relationship: '',
        },
      ],
    }));
  };

  const handleRemoveReference = (id: string) => {
    updateResumeData((prev) => ({
      ...prev,
      references: (prev.references || []).filter((r) => r.id !== id),
    }));
  };

  // 5) Skills handlers
  const handleAddSkill = (skillName: string) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;
    if (resume.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    updateResumeData((prev) => ({
      ...prev,
      skills: [...prev.skills, { id: `sk-${Date.now()}-${Math.random()}`, name: trimmed }],
    }));
    setNewSkillInput('');
  };

  const handleRemoveSkill = (id: string) => {
    updateResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.id !== id),
    }));
  };

  // 6) Languages handlers
  const handleAddLanguage = (customName?: string, customLevel?: 'Básico' | 'Intermédio' | 'Avançado' | 'Fluente' | 'Nativo') => {
    updateResumeData((prev) => ({
      ...prev,
      languages: [
        ...prev.languages,
        {
          id: `lang-${Date.now()}-${Math.random()}`,
          language: customName || 'Português',
          proficiency: customLevel || 'Fluente',
        },
      ],
    }));
  };

  const handleRemoveLanguage = (id: string) => {
    updateResumeData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l.id !== id),
    }));
  };

  // Download / Print Trigger with temporary .is-printing class
  const triggerPrintWithClass = (onAfterPrint?: () => void) => {
    // Add temporary .is-printing class to body and CV container
    document.body.classList.add('is-printing');
    const cvElements = document.querySelectorAll('.cv-document');
    cvElements.forEach((el) => el.classList.add('is-printing'));

    const removePrintClass = () => {
      document.body.classList.remove('is-printing');
      cvElements.forEach((el) => el.classList.remove('is-printing'));
      window.removeEventListener('afterprint', removePrintClass);
      if (onAfterPrint) onAfterPrint();
    };

    window.addEventListener('afterprint', removePrintClass);

    // Fallback cleanup in case afterprint doesn't trigger
    setTimeout(() => {
      document.body.classList.remove('is-printing');
      cvElements.forEach((el) => el.classList.remove('is-printing'));
    }, 5000);

    window.print();
  };

  const handleDownloadPDF = () => {
    const isUnlocked = resume.isPaid || (resume.downloadsRemaining ?? 0) > 0 || resume.paymentStatus === 'approved';
    if (!isUnlocked) {
      setShowPaymentModal(true);
      return;
    }

    // Trigger Print with .is-printing class
    triggerPrintWithClass(() => {
      setDownloadSuccessNotice(true);
    });

    // Track download count while maintaining unlocked status
    setResume((prev) => ({
      ...prev,
      isPaid: true,
      downloadCount: (prev.downloadCount ?? 0) + 1,
    }));
  };

  // Common languages options for Angola and international hiring
  const availableLanguagesList = [
    'Português',
    'Inglês',
    'Francês',
    'Espanhol',
    'Mandarim (Chinês)',
    'Alemão',
    'Italiano',
    'Russo',
    'Árabe',
    'Kimbundu',
    'Umbundu',
    'Cokwe',
    'Lingala',
    'Kikongo',
  ];

  const hasUnpaidEdits = checkIfCvHasUnpaidEdits(resume);
  const isFullyPaid = (resume.isPaid || resume.paymentStatus === 'approved') && !hasUnpaidEdits;
  const isModifiedAfterPayment = Boolean(resume.paidSnapshot) && hasUnpaidEdits;
  const isUnlockedForDownload = isFullyPaid;
  const isPendingPayment =
    !isFullyPaid &&
    !isModifiedAfterPayment &&
    (resume.paymentStatus === 'pending' ||
      (Boolean(resume.pendingTransactionId) && resume.paymentStatus !== 'rejected'));
  const isRejectedPayment = !isFullyPaid && resume.paymentStatus === 'rejected';

  // Snapshot print modal/target for downloading previous paid version for free
  const [snapshotToPrint, setSnapshotToPrint] = useState<ResumeData | null>(null);

  const handleDownloadSnapshotPDF = () => {
    if (!resume.paidSnapshot) return;
    const originalDoc = getPaidSnapshotAsResume(resume);
    setSnapshotToPrint(originalDoc);
    setTimeout(() => {
      triggerPrintWithClass();
    }, 400);
  };

  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusCheckMessage, setStatusCheckMessage] = useState<string | null>(null);

  const handleCheckStatus = () => {
    setCheckingStatus(true);
    setStatusCheckMessage(null);
    setTimeout(() => {
      setCheckingStatus(false);
      if (isUnlockedForDownload) {
        setStatusCheckMessage('Pagamento aprovado! O seu CV está agora desbloqueado.');
      } else if (isRejectedPayment) {
        setStatusCheckMessage('O comprovativo foi rejeitado. Consulte o motivo abaixo.');
      } else {
        setStatusCheckMessage('O pagamento continua em análise pelo administrador. Notificado via Discord.');
      }
      setTimeout(() => setStatusCheckMessage(null), 5000);
    }, 1000);
  };

  const handleSaveTitle = () => {
    if (titleInputValue.trim()) {
      setResume((prev) => ({ ...prev, title: titleInputValue.trim() }));
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto p-4 sm:p-6 pb-48 sm:pb-56 gap-6">
      {/* Hidden print container for re-downloading original paid snapshot for free */}
      {snapshotToPrint && (
        <div className="hidden print:block fixed inset-0 z-[9999] bg-white">
          <CVPreviewDoc
            resume={snapshotToPrint}
            isWatermarked={false}
          />
        </div>
      )}

      {/* Top CV Identity & Multi-CV Navigation Bar */}
      <div className="bg-surface-container-lowest p-3.5 sm:p-4 rounded-2xl border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">description</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                CV Ativo:
              </span>
              {isUnlockedForDownload ? (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="material-symbols-outlined text-[11px]">verified</span>
                  Pago & Vitalício
                </span>
              ) : isModifiedAfterPayment ? (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  <span className="material-symbols-outlined text-[11px]">published_with_changes</span>
                  Editado pós-pagamento (2.000 Kz para nova versão)
                </span>
              ) : isPendingPayment ? (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  <span className="material-symbols-outlined text-[11px]">hourglass_top</span>
                  Em Validação
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  Rascunho
                </span>
              )}
            </div>

            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  autoFocus
                  value={titleInputValue}
                  onChange={(e) => setTitleInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  placeholder="Nome deste CV (ex: Carlos TI ou CV Irmã)"
                  className="px-2.5 py-1 text-xs font-bold text-on-surface rounded-lg bg-surface-container border border-primary focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-bold"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                <h2 className="font-display font-bold text-sm text-on-surface truncate">
                  {resume.title || 'Meu Currículo'}
                </h2>
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant group-hover:text-primary transition-colors">
                  edit
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setShowOnboardingModal(true)}
            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-bold border border-surface-border transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Ver guia rápido de 4 passos"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-500">help</span>
            <span className="hidden xs:inline">Como Funciona?</span>
          </button>

          {onNavigateMyCVs && (
            <button
              type="button"
              onClick={onNavigateMyCVs}
              className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold border border-surface-border transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">folder_shared</span>
              <span>Ver Todos os Meus CVs</span>
            </button>
          )}
        </div>
      </div>

      {/* Sticky Top Step Progress Bar */}
      <div className="sticky top-16 z-30 bg-surface/95 backdrop-blur-md pt-2 pb-4 border-b border-surface-border">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-primary font-bold">Passo {step} de 5</span>
          <span className="text-on-surface font-display text-sm font-bold">{stepTitles[step]}</span>
          <span className="text-on-surface-variant font-mono">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: Informações Pessoais, Foto Tipo Passe & Resumo Profissional       */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Card: Foto Tipo Passe */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/60 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  account_box
                </span>
                <h2 className="font-display text-base font-bold text-on-surface">
                  Foto Tipo Passe Profissional
                </h2>
              </div>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                Proporção 3:4 Passe
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Photo Preview */}
              <div className="relative group flex-shrink-0">
                {resume.personalInfo.photoUrl ? (
                  <div className="relative">
                    <img
                      src={resume.personalInfo.photoUrl}
                      alt="Foto Tipo Passe"
                      className="w-28 h-36 rounded-xl object-cover border-2 border-primary shadow-sm bg-surface-container"
                    />
                    <span className="absolute bottom-1 right-1 bg-emerald-600 text-white p-1 rounded-md shadow-xs text-[12px] material-symbols-outlined">
                      verified
                    </span>
                  </div>
                ) : (
                  <div
                    className="w-28 h-36 rounded-xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center text-on-surface-variant bg-surface-container-low hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={() => setShowPhotoModal(true)}
                  >
                    <span className="material-symbols-outlined text-[34px] text-primary">add_a_photo</span>
                    <span className="text-[10px] font-bold text-primary mt-1">Carregar Foto</span>
                  </div>
                )}
              </div>

              {/* Upload & Edit Controls */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="flex-1 bg-primary text-white py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-primary/95 transition-all text-center cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">crop</span>
                    {resume.personalInfo.photoUrl ? 'Editar Enquadramento / Fundo' : 'Carregar & Ajustar Foto Passe'}
                  </button>
                  {resume.personalInfo.photoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-2 border border-surface-border hover:bg-error/10 hover:text-error text-xs rounded-xl text-on-surface-variant transition-colors"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="bg-primary/5 p-3 rounded-xl border border-primary/15 text-[11px] text-on-surface-variant space-y-1">
                  <p className="font-semibold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                    Formatador Automático de Foto Tipo Passe:
                  </p>
                  <p>
                    Recorta na proporção 35x45mm, centraliza o rosto nos olhos e permite aplicar <strong>Fundo Branco Puro</strong> ou <strong>Azul Claro</strong> para recrutamento em Angola.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Dados de Identificação & Contacto Completo */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/60 space-y-4">
            <h2 className="font-display text-base font-bold text-on-surface pb-2 border-b border-surface-border flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
              Dados Pessoais & Contactos
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Nome Completo <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ex: João Manuel Silva"
                  value={resume.personalInfo.fullName}
                  onChange={(e) =>
                    updateResumeData((prev) => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, fullName: e.target.value },
                    }))
                  }
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Título / Cargo Profissional <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ex: Engenheiro de Redes / Contabilista Sénior"
                  value={resume.personalInfo.professionalTitle}
                  onChange={(e) =>
                    updateResumeData((prev) => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, professionalTitle: e.target.value },
                    }))
                  }
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Email Profissional <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  placeholder="ex: joao.silva@email.com"
                  value={resume.personalInfo.email}
                  onChange={(e) =>
                    updateResumeData((prev) => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, email: e.target.value },
                    }))
                  }
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Contacto Telefónico (Angola) <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="ex: +244 923 456 789"
                  value={resume.personalInfo.phone}
                  onChange={(e) =>
                    updateResumeData((prev) => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, phone: e.target.value },
                    }))
                  }
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Localização / Província
                </label>
                <input
                  type="text"
                  placeholder="ex: Luanda, Talatona (ou Benguela, Huambo, Huíla)"
                  value={resume.personalInfo.location}
                  onChange={(e) =>
                    updateResumeData((prev) => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, location: e.target.value },
                    }))
                  }
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  LinkedIn / Website / Portfólio (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ex: linkedin.com/in/joaosilva"
                  value={resume.personalInfo.linkedinUrl || ''}
                  onChange={(e) =>
                    updateResumeData((prev) => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, linkedinUrl: e.target.value },
                    }))
                  }
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Nacionalidade (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ex: Angolana"
                  value={resume.personalInfo.nationality || ''}
                  onChange={(e) =>
                    updateResumeData((prev) => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, nationality: e.target.value },
                    }))
                  }
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Carta de Condução (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ex: Ligeiros B, Pesados C"
                  value={resume.personalInfo.driverLicense || ''}
                  onChange={(e) =>
                    updateResumeData((prev) => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, driverLicense: e.target.value },
                    }))
                  }
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Card: Resumo Profissional com Assistente IA */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div>
                <h2 className="font-display text-base font-bold text-on-surface">
                  Resumo Profissional / Perfil
                </h2>
                <p className="text-[11px] text-on-surface-variant">
                  Destaque a sua experiência, principais forças e valor para recrutadores em Angola.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAISummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary to-emerald-600 text-white font-bold text-xs shadow-xs hover:opacity-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                Assistente IA
              </button>
            </div>

            {/* Sugestões Rápidas */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                Sugestões Rápidas:
              </span>
              {[
                {
                  label: 'Orientado a Resultados',
                  fullText: 'Profissional dedicado com foco em resultados, rigor técnico e capacidade de resolução ágil de problemas operacionais.',
                },
                {
                  label: 'Liderança & Gestão',
                  fullText: 'Vasta experiência em liderança de equipas, gestão de recursos e otimização contínua de processos no mercado angolano.',
                },
                {
                  label: 'Proatividade & Foco',
                  fullText: 'Perfil proativo, organizado e com forte aptidão para trabalho colaborativo e cumprimento rigoroso de prazos e metas.',
                },
              ].map((suggestion, qIdx) => (
                <button
                  key={qIdx}
                  type="button"
                  onClick={() =>
                    updateResumeData((prev) => {
                      const current = prev.personalInfo.professionalSummary?.trim() || '';
                      const newSummary = current ? `${current} ${suggestion.fullText}` : suggestion.fullText;
                      return {
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          professionalSummary: newSummary,
                        },
                      };
                    })
                  }
                  className="text-xs bg-surface-container-low hover:bg-primary/10 hover:text-primary px-2.5 py-1 rounded-lg text-on-surface transition-all border border-surface-border/60 cursor-pointer font-medium active:scale-95 flex items-center gap-1 select-none"
                  title={`Inserir: "${suggestion.fullText}"`}
                >
                  <span className="text-primary font-bold">+</span>
                  <span>{suggestion.label}</span>
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              placeholder="Descreva resumidamente o seu percurso, principais forças e objetivos profissionais..."
              value={resume.personalInfo.professionalSummary}
              onChange={(e) =>
                updateResumeData((prev) => ({
                  ...prev,
                  personalInfo: {
                    ...prev.personalInfo,
                    professionalSummary: e.target.value,
                  },
                }))
              }
              className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
            ></textarea>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Experiência Profissional (Múltiplas Entradas + IA)                */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-primary/10 border border-primary/20 p-4 rounded-2xl text-xs text-on-surface">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0">
                work_history
              </span>
              <div>
                <p className="font-bold text-on-surface">Múltiplas Experiências Profissionais:</p>
                <p className="text-on-surface-variant text-[11px] mt-0.5 leading-relaxed">
                  Adicione todas as empresas onde trabalhou. Cada cargo pode ser editado, enriquecido com a nossa <strong>IA</strong> ou removido individualmente.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddExperience}
              className="flex-shrink-0 bg-primary text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs hover:bg-primary/95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              + Adicionar Experiência
            </button>
          </div>

          {/* List of Experiences */}
          {resume.experiences.length === 0 ? (
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-border/60 text-center space-y-3">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50">
                work_off
              </span>
              <p className="text-xs text-on-surface-variant">
                Nenhuma experiência profissional adicionada. Se estiver no início de carreira ou primeiro emprego, pode prosseguir ou adicionar estágios e voluntariados.
              </p>
              <button
                type="button"
                onClick={handleAddExperience}
                className="bg-primary text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs hover:bg-primary/90 transition-all inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Adicionar Primeira Experiência
              </button>
            </div>
          ) : (
            resume.experiences.map((exp, index) => (
              <div
                key={exp.id}
                className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/60 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-surface-border gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-on-surface truncate">
                      {exp.role ? `${exp.role} ${exp.company ? `(${exp.company})` : ''}` : `Experiência #${index + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenAIExperience(exp.id)}
                      className="px-2.5 py-1 bg-gradient-to-r from-primary/10 to-emerald-500/10 hover:from-primary hover:to-emerald-500 text-primary hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-primary/20"
                    >
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      Melhorar com IA
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(exp.id)}
                      className="text-error text-xs font-semibold hover:bg-error/10 px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5"
                      title="Remover experiência"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Remover
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Cargo / Função <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Gestor de Conta / Eletricista / Técnico de TI"
                      value={exp.role}
                      onChange={(e) => {
                        const updated = [...resume.experiences];
                        updated[index].role = e.target.value;
                        updateResumeData((prev) => ({ ...prev, experiences: updated }));
                      }}
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Empresa / Organização <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Unitel, Sonangol, Banco BAI, PHC Angola..."
                      value={exp.company}
                      onChange={(e) => {
                        const updated = [...resume.experiences];
                        updated[index].company = e.target.value;
                        updateResumeData((prev) => ({ ...prev, experiences: updated }));
                      }}
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Localidade
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Luanda, Angola"
                      value={exp.location}
                      onChange={(e) => {
                        const updated = [...resume.experiences];
                        updated[index].location = e.target.value;
                        updateResumeData((prev) => ({ ...prev, experiences: updated }));
                      }}
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Ano / Data de Início
                    </label>
                    <input
                      type="text"
                      placeholder="ex: 2020 ou Jan 2021"
                      value={exp.startDate}
                      onChange={(e) => {
                        const updated = [...resume.experiences];
                        updated[index].startDate = e.target.value;
                        updateResumeData((prev) => ({ ...prev, experiences: updated }));
                      }}
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-on-surface">
                        Ano / Data de Término
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-primary cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={exp.isCurrent}
                          onChange={(e) => {
                            const updated = [...resume.experiences];
                            updated[index].isCurrent = e.target.checked;
                            if (e.target.checked) updated[index].endDate = 'Presente';
                            updateResumeData((prev) => ({ ...prev, experiences: updated }));
                          }}
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span>Trabalho atualmente nesta função</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      placeholder="ex: 2023 ou Presente"
                      disabled={exp.isCurrent}
                      value={exp.isCurrent ? 'Presente' : exp.endDate}
                      onChange={(e) => {
                        const updated = [...resume.experiences];
                        updated[index].endDate = e.target.value;
                        updateResumeData((prev) => ({ ...prev, experiences: updated }));
                      }}
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-on-surface">
                      Descrição das Responsabilidades & Conquistas
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenAIExperience(exp.id)}
                      className="text-[11px] text-primary hover:underline font-bold flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[13px]">magic_button</span>
                      Sugerir texto profissional com IA
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Descreva as principais funções desempenhadas, metas alcançadas, ferramentas e procedimentos..."
                    value={exp.description}
                    onChange={(e) => {
                      const updated = [...resume.experiences];
                      updated[index].description = e.target.value;
                      updateResumeData((prev) => ({ ...prev, experiences: updated }));
                    }}
                    className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
                  ></textarea>
                </div>
              </div>
            ))
          )}

          {/* Add Experience Button */}
          <button
            type="button"
            onClick={handleAddExperience}
            className="w-full py-3.5 border-2 border-dashed border-surface-border rounded-2xl text-xs font-bold text-primary hover:bg-primary/5 hover:border-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            + Adicionar Experiência
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: Formação Académica & Certificações / Cursos                       */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-start gap-3 text-xs text-on-surface">
            <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">
              school
            </span>
            <p className="leading-relaxed">
              <strong>Formação em Angola & Internacional:</strong> Indique as suas habilitações literárias (ex: UAN, UCAN, ISPTEC, Gregório Semedo, IMEL, etc.) e certificações profissionais.
            </p>
          </div>

          {/* Education List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Habilitações Literárias ({resume.educations.length})
              </h3>
              <button
                type="button"
                onClick={handleAddEducation}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Adicionar Formação
              </button>
            </div>

            {resume.educations.map((edu, index) => (
              <div
                key={edu.id}
                className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/60 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <span className="text-xs font-bold text-primary uppercase">
                    Grau Académico #{index + 1}
                  </span>
                  {resume.educations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(edu.id)}
                      className="text-error text-xs font-semibold hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Remover
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Grau & Curso <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Licenciatura em Gestão de Empresas / Ensino Médio"
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = [...resume.educations];
                        updated[index].degree = e.target.value;
                        updateResumeData((prev) => ({ ...prev, educations: updated }));
                      }}
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Universidade / Instituto / Escola <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Universidade Católica de Angola (UCAN) / IMEL"
                      value={edu.institution}
                      onChange={(e) => {
                        const updated = [...resume.educations];
                        updated[index].institution = e.target.value;
                        updateResumeData((prev) => ({ ...prev, educations: updated }));
                      }}
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Localização
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Luanda, Angola"
                      value={edu.location}
                      onChange={(e) => {
                        const updated = [...resume.educations];
                        updated[index].location = e.target.value;
                        updateResumeData((prev) => ({ ...prev, educations: updated }));
                      }}
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Ano de Conclusão
                    </label>
                    <input
                      type="text"
                      placeholder="ex: 2022"
                      value={edu.completionYear}
                      onChange={(e) => {
                        const updated = [...resume.educations];
                        updated[index].completionYear = e.target.value;
                        updateResumeData((prev) => ({ ...prev, educations: updated }));
                      }}
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddEducation}
              className="w-full py-3 border-2 border-dashed border-surface-border rounded-2xl text-xs font-bold text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Adicionar Outra Formação Académica
            </button>
          </div>

          {/* Certifications Section */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/60 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <h2 className="font-display text-base font-bold text-on-surface">
                Certificações & Cursos Complementares
              </h2>
              <button
                type="button"
                onClick={handleAddCertification}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                + Adicionar Curso
              </button>
            </div>

            {(resume.certifications || []).length === 0 ? (
              <p className="text-xs text-on-surface-variant italic py-1">
                Nenhuma certificação adicionada. Clique abaixo para incluir cursos técnicos (ex: Primavera BSS, Excel Avançado, CCNA, Higiene e Segurança no Trabalho).
              </p>
            ) : (
              (resume.certifications || []).map((cert, cIdx) => (
                <div key={cert.id} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-surface-container-low/30 p-2 sm:p-0 rounded-xl">
                  <input
                    type="text"
                    placeholder="Nome do Certificado (ex: CCNA, Scrum, Excel Avançado)"
                    value={cert.name}
                    onChange={(e) => {
                      const updated = [...(resume.certifications || [])];
                      updated[cIdx].name = e.target.value;
                      updateResumeData((prev) => ({ ...prev, certifications: updated }));
                    }}
                    className="flex-1 min-w-0 bg-surface-container-low border-none rounded-xl p-2.5 text-xs outline-none font-medium"
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Entidade / Escola"
                      value={cert.institution}
                      onChange={(e) => {
                        const updated = [...(resume.certifications || [])];
                        updated[cIdx].institution = e.target.value;
                        updateResumeData((prev) => ({ ...prev, certifications: updated }));
                      }}
                      className="flex-1 sm:w-36 min-w-0 bg-surface-container-low border-none rounded-xl p-2.5 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Ano"
                      value={cert.year}
                      onChange={(e) => {
                        const updated = [...(resume.certifications || [])];
                        updated[cIdx].year = e.target.value;
                        updateResumeData((prev) => ({ ...prev, certifications: updated }));
                      }}
                      className="w-20 bg-surface-container-low border-none rounded-xl p-2.5 text-xs outline-none font-mono text-center shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(cert.id)}
                      className="text-error p-1.5 hover:bg-error/10 rounded-lg transition-colors shrink-0"
                      title="Remover certificação"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                </div>
              ))
            )}

            <button
              type="button"
              onClick={handleAddCertification}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 pt-1"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              + Adicionar Certificação / Curso
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: Competências, Idiomas Ampliados & Referências Profissionais       */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Informative Step Notice */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs text-on-surface">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-[22px] flex-shrink-0">
                verified
              </span>
              <div>
                <p className="font-bold text-emerald-800">
                  Estrutura Completa do CV: Competências, Idiomas & Referências
                </p>
                <p className="text-on-surface-variant text-[11px] mt-0.5">
                  Preencha os idiomas com o respetivo nível e inclua referências de contacto para fortalecer a sua candidatura.
                </p>
              </div>
            </div>
          </div>

          {/* 1. Competências Técnicas & Interpessoais (Tags / Chips) */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/60 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  psychology
                </span>
                <h2 className="font-display text-base font-bold text-on-surface">
                  1. Competências Técnicas & Interpessoais
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAISkills}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                  Sugerir com IA
                </button>
                <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                  {resume.skills.length}
                </span>
              </div>
            </div>

            {/* Input to add skill tag */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Escreva uma competência e prima Enter (ex: Primavera BSS, Excel Avançado, Liderança)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(newSkillInput);
                  }
                }}
                className="flex-1 bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => handleAddSkill(newSkillInput)}
                className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Adicionar
              </button>
            </div>

            {/* Suggested quick skills for Angola */}
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-amber-500">bolt</span>
                Sugestões Rápidas mais Procuradas em Angola:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Primavera BSS',
                  'Excel Avançado',
                  'PHC Software',
                  'Gestão Financeira & AGT',
                  'Atendimento ao Cliente',
                  'Inglês Técnico',
                  'Liderança de Equipas',
                  'Gestão de Stocks & Armazém',
                  'Contabilidade Geral',
                  'Análise de Dados / Power BI',
                  'Vendas & Negociação',
                  'Condução Ligeiros / Pesados',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddSkill(s)}
                    className="text-[11px] bg-surface-container-low hover:bg-primary/10 hover:text-primary px-2.5 py-1 rounded-lg text-on-surface transition-all border border-surface-border/50 font-medium cursor-pointer"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Skills Chips Container */}
            <div className="pt-3 border-t border-surface-border/60">
              <p className="text-xs font-semibold text-on-surface mb-2">
                Competências no seu CV:
              </p>
              {resume.skills.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic py-2">
                  Nenhuma competência adicionada ainda. Digite acima ou clique nas sugestões para adicionar.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150 shadow-2xs"
                    >
                      {skill.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="hover:text-error hover:bg-error/10 p-0.5 rounded transition-colors"
                        title="Remover tag"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. Secção de Idiomas Ampliada com Nível */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/60 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  translate
                </span>
                <h2 className="font-display text-base font-bold text-on-surface">
                  2. Idiomas & Nível de Domínio
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleAddLanguage()}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                + Adicionar Idioma
              </button>
            </div>

            {/* Quick Language Add Buttons */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="text-on-surface-variant font-medium self-center text-[11px] mr-1">
                Adicionar rápido:
              </span>
              {[
                { name: 'Português', level: 'Nativo' as const },
                { name: 'Inglês', level: 'Intermédio' as const },
                { name: 'Francês', level: 'Básico' as const },
                { name: 'Espanhol', level: 'Intermédio' as const },
                { name: 'Mandarim (Chinês)', level: 'Básico' as const },
                { name: 'Kimbundu', level: 'Fluente' as const },
                { name: 'Umbundu', level: 'Fluente' as const },
                { name: 'Lingala', level: 'Intermédio' as const },
              ].map((langPreset) => (
                <button
                  key={langPreset.name}
                  type="button"
                  onClick={() => handleAddLanguage(langPreset.name, langPreset.level)}
                  className="bg-surface-container-low hover:bg-primary/10 hover:text-primary px-2.5 py-1 rounded-lg text-on-surface text-[11px] font-medium border border-surface-border/50 transition-colors cursor-pointer active:scale-95 select-none"
                >
                  + {langPreset.name} ({langPreset.level})
                </button>
              ))}
            </div>

            {/* Languages rows list */}
            <div className="space-y-3 pt-2">
              {resume.languages.map((lang, lIdx) => (
                <div
                  key={lang.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-surface-border/50"
                >
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                      Idioma
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        list={`lang-list-${lang.id}`}
                        placeholder="ex: Português, Inglês, Francês, Mandarim..."
                        value={lang.language}
                        onChange={(e) => {
                          const updated = [...resume.languages];
                          updated[lIdx].language = e.target.value;
                          updateResumeData((prev) => ({ ...prev, languages: updated }));
                        }}
                        className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-lg p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <datalist id={`lang-list-${lang.id}`}>
                        {availableLanguagesList.map((al) => (
                          <option key={al} value={al} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="w-full sm:w-56">
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                      Nível de Proficiência
                    </label>
                    <select
                      value={lang.proficiency}
                      onChange={(e) => {
                        const updated = [...resume.languages];
                        updated[lIdx].proficiency = e.target.value as any;
                        updateResumeData((prev) => ({ ...prev, languages: updated }));
                      }}
                      className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-lg p-2.5 text-xs font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="Nativo">Nativo (Língua Materna)</option>
                      <option value="Fluente">Fluente (Total domínio)</option>
                      <option value="Avançado">Avançado (C1/C2)</option>
                      <option value="Intermédio">Intermédio (B1/B2)</option>
                      <option value="Básico">Básico (A1/A2)</option>
                    </select>
                  </div>

                  <div className="self-end sm:self-center sm:pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(lang.id)}
                      className="text-error p-2 hover:bg-error/10 rounded-lg transition-colors flex items-center gap-1 text-xs"
                      title="Remover idioma"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      <span className="sm:hidden font-semibold">Remover</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Referências Profissionais (Opcional) */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/60 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  contact_page
                </span>
                <h2 className="font-display text-base font-bold text-on-surface">
                  3. Referências Profissionais (Opcional)
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddReference}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                + Adicionar Referência
              </button>
            </div>

            <p className="text-[11px] text-on-surface-variant">
              Adicione contactos de anteriores chefias, supervisores ou colegas que possam atestar a sua qualidade profissional em Angola.
            </p>

            {(resume.references || []).length === 0 ? (
              <div className="p-4 bg-surface-container-low rounded-xl border border-surface-border/50 text-center">
                <p className="text-xs text-on-surface-variant">
                  Nenhuma referência adicionada. Se desejar incluir, clique no botão abaixo.
                </p>
                <button
                  type="button"
                  onClick={handleAddReference}
                  className="mt-2 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Adicionar Referência
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {(resume.references || []).map((ref, rIdx) => (
                  <div
                    key={ref.id}
                    className="p-4 bg-surface-container-low rounded-xl border border-surface-border/60 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-surface-border/50">
                      <span className="text-xs font-bold text-primary">
                        Referência #{rIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveReference(ref.id)}
                        className="text-error text-xs font-semibold hover:underline flex items-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        Remover
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                          Nome do Contacto / Referência
                        </label>
                        <input
                          type="text"
                          placeholder="ex: Dr. António Ferreira"
                          value={ref.name}
                          onChange={(e) => {
                            const updated = [...(resume.references || [])];
                            updated[rIdx].name = e.target.value;
                            updateResumeData((prev) => ({ ...prev, references: updated }));
                          }}
                          className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-lg p-2.5 text-xs font-medium outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                          Cargo & Empresa
                        </label>
                        <input
                          type="text"
                          placeholder="ex: Diretor de Operações na Sonangol"
                          value={`${ref.role || ''}${ref.company ? ` • ${ref.company}` : ''}`}
                          onChange={(e) => {
                            const val = e.target.value;
                            const parts = val.split('•').map((s) => s.trim());
                            const updated = [...(resume.references || [])];
                            updated[rIdx].role = parts[0] || '';
                            updated[rIdx].company = parts[1] || '';
                            updateResumeData((prev) => ({ ...prev, references: updated }));
                          }}
                          className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-lg p-2.5 text-xs font-medium outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          placeholder="ex: +244 923 000 000"
                          value={ref.phone}
                          onChange={(e) => {
                            const updated = [...(resume.references || [])];
                            updated[rIdx].phone = e.target.value;
                            updateResumeData((prev) => ({ ...prev, references: updated }));
                          }}
                          className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-lg p-2.5 text-xs font-mono outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">
                          Email (Opcional)
                        </label>
                        <input
                          type="email"
                          placeholder="ex: diretor.antonio@empresa.ao"
                          value={ref.email || ''}
                          onChange={(e) => {
                            const updated = [...(resume.references || [])];
                            updated[rIdx].email = e.target.value;
                            updateResumeData((prev) => ({ ...prev, references: updated }));
                          }}
                          className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-lg p-2.5 text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: Checkout Criativo & Profissional + Pré-visualização do CV         */}
      {/* ========================================================================= */}
      {step === 5 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Download Success Notice if downloaded */}
          {downloadSuccessNotice && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-emerald-900 animate-in fade-in duration-200 shadow-sm">
              <span className="material-symbols-outlined text-emerald-600 text-[22px] flex-shrink-0">
                task_alt
              </span>
              <div className="space-y-1">
                <p className="font-bold text-sm">Download Concluído com Sucesso!</p>
                <p className="text-emerald-800 leading-relaxed">
                  O seu crédito de download para este currículo foi utilizado. De acordo com as regras da plataforma, <strong>cada pagamento de {basePriceKz.toLocaleString()} Kz dá direito a 1 download</strong>. Se fizer novas alterações ou criar um novo CV, será necessário um novo pagamento de {basePriceKz.toLocaleString()} Kz.
                </p>
              </div>
            </div>
          )}

          {/* CHECKOUT HERO / SUMMARY PANEL */}
          <div className="bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-md border border-surface-border/80 space-y-6">
            {/* Header with Title and Price Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Checkout Seguro • CV IA Angola
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface mt-2">
                  {isUnlockedForDownload
                    ? 'Currículo Pronto para Download'
                    : isPendingPayment
                    ? 'Pagamento em Análise'
                    : isRejectedPayment
                    ? 'Comprovativo Não Validado'
                    : 'Finalizar & Desbloquear CV'}
                </h1>
                <p className="text-xs text-on-surface-variant">
                  {isUnlockedForDownload
                    ? 'O seu pagamento foi validado! Descarregue o PDF em alta resolução.'
                    : isPendingPayment
                    ? 'Comprovativo enviado — aguarda aprovação do administrador.'
                    : isRejectedPayment
                    ? 'O comprovativo anterior não foi validado. Pode reenviar um novo comprovativo a qualquer momento.'
                    : 'Remova marcas de água, desbloqueie os dados de contacto e obtenha o PDF profissional.'}
                </p>
              </div>

              {/* Price Tag Highlight */}
              <div className="bg-surface-container-lowest border-2 border-primary/30 p-4 rounded-2xl text-center sm:text-right shadow-sm w-full sm:w-auto">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Valor Único de Desbloqueio
                </span>
                <div className="flex items-baseline justify-center sm:justify-end gap-1 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-primary font-display">
                    {basePriceKz.toLocaleString()}
                  </span>
                  <span className="text-base font-bold text-on-surface">Kz</span>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full inline-block mt-1">
                  1 Pagamento = 1 Download PDF
                </span>
              </div>
            </div>

            {/* Mini CV Summary Snapshot Grid */}
            <div className="bg-surface-container-lowest/80 p-4 rounded-2xl border border-surface-border/60">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">feed</span>
                Resumo do Currículo a Emitir:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-surface-container-low p-2.5 rounded-xl">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase">Candidato</p>
                  <p className="font-bold text-on-surface truncate">{resume.personalInfo.fullName || 'Não preenchido'}</p>
                </div>
                <div className="bg-surface-container-low p-2.5 rounded-xl">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase">Cargo</p>
                  <p className="font-bold text-on-surface truncate">{resume.personalInfo.professionalTitle || 'Profissional'}</p>
                </div>
                <div className="bg-surface-container-low p-2.5 rounded-xl">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase">Conteúdo</p>
                  <p className="font-bold text-on-surface">
                    {resume.experiences.length} Exp. &bull; {resume.skills.length} Comp.
                  </p>
                </div>
                <div className="bg-surface-container-low p-2.5 rounded-xl">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase">Modelo Ativo</p>
                  <p className="font-bold text-primary truncate">
                    {templates.find((t) => t.id === resume.templateId)?.name || 'Lumina Modern'}
                  </p>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STATE 1: PENDING PAYMENT IN REVIEW                                        */}
            {/* ========================================================================= */}
            {isPendingPayment && (
              <div className="bg-amber-500/10 border-2 border-amber-500/40 p-6 rounded-2xl space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md relative">
                      <span className="material-symbols-outlined text-[28px] animate-spin">
                        hourglass_top
                      </span>
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-base text-amber-950">
                          Comprovativo enviado — aguarda aprovação
                        </h3>
                        <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                          Normalmente em até 15 a 30 minutos
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 mt-0.5">
                        O seu comprovativo foi submetido com sucesso. O administrador foi notificado para validar o recebimento bancário.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleCheckStatus}
                      disabled={checkingStatus}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${checkingStatus ? 'animate-spin' : ''}`}>
                        sync
                      </span>
                      {checkingStatus ? 'A verificar...' : 'Verificar Estado'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="px-3.5 py-2.5 bg-surface-container-lowest hover:bg-surface-container border border-amber-300 text-amber-950 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                      title="Reenviar ou atualizar comprovativo"
                    >
                      Reenviar
                    </button>
                  </div>
                </div>

                {statusCheckMessage && (
                  <div className="p-3 bg-surface-container-lowest border border-amber-300/80 rounded-xl text-xs text-amber-950 flex items-center gap-2 animate-in fade-in duration-150">
                    <span className="material-symbols-outlined text-amber-700 text-[18px]">info</span>
                    <span>{statusCheckMessage}</span>
                  </div>
                )}

                {/* Submitted details box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-surface-container-lowest/90 p-3.5 rounded-xl border border-amber-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">ID Transação</span>
                    <span className="font-mono font-bold text-primary">{resume.pendingTransactionId || 'TRX-EMIS'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Método Escolhido</span>
                    <span className="font-bold text-on-surface">
                      {resume.submittedPaymentMethod === 'Transferência' ? 'Transferência BAI' : 'Multicaixa Xpress'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Referência / Código</span>
                    <span className="font-mono font-bold text-on-surface truncate block">
                      {resume.submittedReference || 'Comprovativo enviado'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-700">lock</span>
                    <span className="font-semibold">O botão "Baixar CV" será desbloqueado assim que o administrador aprovar o pagamento.</span>
                  </div>
                  <a
                    href="https://wa.me/244923845779?text=Ol%C3%A1%2C%20acabei%20de%20fazer%20o%20pagamento%20de%202.000%20Kz%20no%20CV%20IA%20Angola%20para%20desbloquear%20o%20meu%20CV."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-800 font-bold hover:underline"
                  >
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">chat</span>
                    Acelerar validação no WhatsApp (+244 923 845 779)
                  </a>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STATE 2: REJECTED PAYMENT NOTICE                                          */}
            {/* ========================================================================= */}
            {isRejectedPayment && (
              <div className="bg-red-500/10 border-2 border-red-500/40 p-6 rounded-2xl space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="material-symbols-outlined text-[28px]">error</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-red-950">
                        Comprovativo Não Validado
                      </h3>
                      <p className="text-xs text-red-800 mt-0.5">
                        O administrador analisou o comprovativo enviado e não foi possível validar o pagamento.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full sm:w-auto px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">replay</span>
                    Reenviar Novo Comprovativo
                  </button>
                </div>

                <div className="bg-surface-container-lowest/90 p-4 rounded-xl border border-red-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-red-700 block">Motivo Informado pelo Administrador:</span>
                  <p className="text-xs font-semibold text-slate-800">
                    {resume.rejectionReason || 'Valor não identificado na conta bancária ou comprovativo ilegível.'}
                  </p>
                </div>

                <p className="text-[11px] text-red-900">
                  Por favor, verifique se a transferência de <strong>{basePriceKz.toLocaleString()} Kz</strong> foi concluída com sucesso para o Multicaixa Xpress <strong>923 845 779</strong> ou IBAN BAI e clique no botão acima para reenviar.
                </p>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STATE 3A: MODIFIED AFTER PAYMENT STATE                                     */}
            {/* ========================================================================= */}
            {isModifiedAfterPayment && (
              <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-2xl space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="material-symbols-outlined text-[28px]">published_with_changes</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-amber-950">
                        Alterações Efetuadas após o Pagamento Original
                      </h3>
                      <p className="text-xs text-amber-800">
                        Este currículo foi aprovado e pago em <strong>{resume.paidSnapshot?.paidAt}</strong>. Detectámos alterações nos dados que requerem nova validação.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Option 1: Free Re-download of Previous Paid Snapshot */}
                  <div className="p-4 rounded-xl bg-white border border-emerald-300 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        Sem Custos
                      </span>
                      <h4 className="font-bold text-xs text-on-surface mt-1">Versão Original Paga ({resume.paidSnapshot?.paidAt})</h4>
                      <p className="text-[11px] text-on-surface-variant">
                        Baixe o PDF exatamente como estava quando efetuou o pagamento, sem marca de água.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadSnapshotPDF}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">history</span>
                      Baixar Versão Original
                    </button>
                  </div>

                  {/* Option 2: Pay 2.000 Kz to Unlock the New Edited Version */}
                  <div className="p-4 rounded-xl bg-white border border-primary/40 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[12px]">payments</span>
                        Novo Download
                      </span>
                      <h4 className="font-bold text-xs text-on-surface mt-1">Nova Versão com Alterações Recentes</h4>
                      <p className="text-[11px] text-on-surface-variant">
                        Desbloqueie o novo PDF com as experiências, formações e dados recém-editados.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/95 text-white font-display font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">payments</span>
                      Pagar {basePriceKz.toLocaleString()} Kz (Nova Versão)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STATE 3B: UNLOCKED FOR DOWNLOAD CELEBRATION (NO UNPAID EDITS)              */}
            {/* ========================================================================= */}
            {isUnlockedForDownload && (
              <div className="bg-emerald-500/10 border-2 border-emerald-500/30 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="material-symbols-outlined text-[28px]">download_done</span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-emerald-950">
                      O seu CV está 100% Desbloqueado!
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Pagamento validado com sucesso! Re-downloads ilimitados para este currículo.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-2xl font-display font-bold text-sm shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  Baixar PDF Oficial
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STATE 4: INITIAL NOT PAID / SELECTION STATE                                */}
            {/* ========================================================================= */}
            {!isUnlockedForDownload && !isModifiedAfterPayment && !isPendingPayment && !isRejectedPayment && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">account_balance_wallet</span>
                    Opções de Pagamento Disponíveis:
                  </h3>
                  <span className="text-[11px] text-on-surface-variant font-medium hidden sm:inline">
                    Confirmação rápida em minutos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1: Multicaixa Xpress */}
                  <div className="bg-surface-container-lowest p-5 rounded-2xl border-2 border-primary/20 hover:border-primary transition-all space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-[22px]">smartphone</span>
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-sm text-on-surface">
                            Multicaixa Xpress
                          </h4>
                          <span className="text-[10px] text-orange-600 font-bold bg-orange-100 px-2 py-0.5 rounded-full">
                            Mais Rápido & Prático
                          </span>
                        </div>
                      </div>
                      <span className="font-display font-bold text-xs text-primary">{basePriceKz.toLocaleString()} Kz</span>
                    </div>

                    {/* Step-by-step for Express */}
                    <div className="space-y-2 text-xs bg-surface-container-low p-3.5 rounded-xl border border-surface-border/50">
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                        <p className="text-on-surface text-[11px]">Abra a aplicação <strong>Multicaixa Express</strong> no telemóvel.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                        <div className="text-[11px] text-on-surface">
                          Envie o montante de <strong>{basePriceKz.toLocaleString()} Kz</strong> para o número:
                          <div className="flex items-center gap-2 mt-1.5 bg-surface-container-lowest p-2 rounded-lg border border-surface-border">
                            <span className="font-mono font-bold text-sm text-primary">923 845 779</span>
                            <button
                              type="button"
                              onClick={() => handleCopy('923845779', 'xpress')}
                              className="ml-auto text-[10px] bg-primary/10 hover:bg-primary hover:text-white text-primary font-bold px-2 py-1 rounded transition-colors"
                            >
                              {copiedField === 'xpress' ? 'Copiado!' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                        <p className="text-on-surface text-[11px]">Guarde o comprovativo e submeta para validação.</p>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Transferência Bancária BAI */}
                  <div className="bg-surface-container-lowest p-5 rounded-2xl border-2 border-primary/20 hover:border-primary transition-all space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-[22px]">account_balance</span>
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-sm text-on-surface">
                            Transferência BAI (IBAN)
                          </h4>
                          <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                            Conta Empresa Oficial
                          </span>
                        </div>
                      </div>
                      <span className="font-display font-bold text-xs text-primary">{basePriceKz.toLocaleString()} Kz</span>
                    </div>

                    {/* Step-by-step for BAI */}
                    <div className="space-y-2 text-xs bg-surface-container-low p-3.5 rounded-xl border border-surface-border/50">
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                        <p className="text-on-surface text-[11px]">Aceda ao seu Internet Banking (BAI Directo) ou ATM Multicaixa.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                        <div className="text-[11px] text-on-surface w-full">
                          Transfira <strong>{basePriceKz.toLocaleString()} Kz</strong> para o IBAN:
                          <div className="mt-1.5 bg-surface-container-lowest p-2 rounded-lg border border-surface-border space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-[11px] text-primary break-all">
                                AO06 0040 0000 6273 9820 1010 9
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy('AO06004000006273982010109', 'iban')}
                                className="ml-2 text-[10px] bg-primary/10 hover:bg-primary hover:text-white text-primary font-bold px-2 py-1 rounded transition-colors flex-shrink-0"
                              >
                                {copiedField === 'iban' ? 'Copiado!' : 'Copiar'}
                              </button>
                            </div>
                            <p className="text-[10px] text-on-surface-variant font-medium">
                              Titular: <strong>Chinua Ndembo, Lda</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                        <p className="text-on-surface text-[11px]">Submeta o comprovativo para libertação imediata.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Single Primary Payment Action Button */}
                <div className="pt-3 flex flex-col sm:flex-row items-center gap-3 justify-between">
                  <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">shield</span>
                    <span>Pagamento 100% verificado com suporte via WhatsApp</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-display font-extrabold text-sm shadow-lg hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                    Pagar {basePriceKz.toLocaleString()} Kz
                  </button>
                </div>
              </div>
            )}

            {/* Template Selector Bar in Checkout (Fast, non-blocking with real previews) */}
            <div className="pt-4 border-t border-surface-border/60">
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">palette</span>
                  <span>Escolha o Modelo Visual para o Seu Currículo:</span>
                </label>
                <span className="text-[11px] text-on-surface-variant">
                  Clique para alterar instantaneamente
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {templates.map((tpl) => {
                  const isSelected = resume.templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setResume((prev) => ({ ...prev, templateId: tpl.id }))}
                      className={`group rounded-2xl border text-left transition-all cursor-pointer overflow-hidden flex flex-col ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary bg-primary/5 shadow-md'
                          : 'border-surface-border bg-surface-container-low hover:border-primary/40 hover:bg-surface-container'
                      }`}
                    >
                      <div className="relative h-28 w-full overflow-hidden bg-slate-100">
                        <img
                          src={tpl.thumbnailUrl}
                          alt={tpl.name}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover object-top transition-transform duration-300 ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}
                        />
                        <span className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-extrabold shadow-xs ${
                          tpl.category === 'Mais popular' ? 'bg-blue-600 text-white' :
                          tpl.category === 'Premium' ? 'bg-amber-600 text-white' :
                          tpl.category === 'Novo' ? 'bg-emerald-600 text-white' :
                          'bg-slate-800 text-white'
                        }`}>
                          {tpl.category}
                        </span>
                        {isSelected && (
                          <span className="absolute bottom-1.5 right-1.5 bg-primary text-white p-0.5 rounded-full shadow-md flex items-center justify-center">
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          </span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                          {tpl.name}
                        </p>
                        <p className="text-[10px] text-on-surface-variant line-clamp-1 mt-0.5">
                          {tpl.layoutStyle === 'modern' ? '2 Colunas & Topo Azul' :
                           tpl.layoutStyle === 'creative' ? 'Dark Mode & Emerald' :
                           tpl.layoutStyle === 'executive' ? 'Executivo & Serif' :
                           'Clássico 1 Coluna'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* THE LIVE CV PREVIEW CANVAS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 flex-wrap gap-2">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">visibility</span>
                Pré-visualização do Documento Completo:
              </span>
              <div className="flex items-center gap-2">
                {isUnlockedForDownload ? (
                  <button
                    type="button"
                    id="btn-export-pdf"
                    onClick={handleDownloadPDF}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Exportar documento para PDF pronto a imprimir"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    <span>Baixar PDF Oficial</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-amber-800 font-bold bg-amber-100 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                    <span className="material-symbols-outlined text-[14px] text-amber-700">lock</span>
                    Download Bloqueado (Requer Pagamento)
                  </span>
                )}
              </div>
            </div>

            <div className="relative">
              <CVPreviewDoc
                resume={resume}
                isWatermarked={!isUnlockedForDownload}
              />
            </div>
          </div>

          {/* Bottom Action Footer with Policy Links */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-on-surface-variant text-center sm:text-left">
              <p>Deseja alterar alguma informação? Pode voltar aos passos 1 a 4 a qualquer momento.</p>
              <div className="flex gap-3 mt-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setPolicyInitialTab('terms');
                    setShowPolicyModal(true);
                  }}
                  className="text-primary hover:underline"
                >
                  Termos de Uso
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => {
                    setPolicyInitialTab('refund');
                    setShowPolicyModal(true);
                  }}
                  className="text-primary hover:underline"
                >
                  Garantia de Reembolso
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => {
                    setPolicyInitialTab('privacy');
                    setShowPolicyModal(true);
                  }}
                  className="text-primary hover:underline"
                >
                  Privacidade
                </button>
              </div>
            </div>

            {!isUnlockedForDownload && !isPendingPayment && (
              <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-4 py-2.5 rounded-xl border border-primary/20">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Taxa única de 2.000 Kz para descarregar o PDF completo</span>
              </div>
            )}

            {isPendingPayment && (
              <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-200">
                <span className="material-symbols-outlined text-[16px] text-amber-600 animate-spin">hourglass_top</span>
                <span>Comprovativo enviado — aguarda aprovação</span>
              </div>
            )}

            {isUnlockedForDownload && (
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl font-display font-bold text-xs shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Baixar CV
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Sticky Bottom Navigation Bar (Prev / Next Buttons)                        */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-surface-border p-3 sm:p-4 no-print">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((prev) => Math.max(1, prev - 1) as BuilderStep)}
            className="px-5 py-2.5 rounded-xl border border-surface-border text-on-surface font-semibold text-xs hover:bg-surface-container-low disabled:opacity-40 disabled:hover:bg-transparent transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Passo Anterior
          </button>

          <span className="text-xs font-bold text-on-surface-variant hidden sm:inline">
            {step} de 5: {stepTitles[step]}
          </span>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => Math.min(5, prev + 1) as BuilderStep)}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-display font-bold text-xs hover:bg-primary/90 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Próximo Passo
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          ) : isModifiedAfterPayment ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadSnapshotPDF}
                className="px-3 sm:px-4 py-2.5 rounded-xl font-display font-bold text-[11px] sm:text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <span className="material-symbols-outlined text-[15px]">history</span>
                Versão Original
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="px-4 sm:px-5 py-2.5 rounded-xl font-display font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer bg-primary hover:bg-primary/95 text-white"
              >
                <span className="material-symbols-outlined text-[16px]">payments</span>
                Pagar {basePriceKz.toLocaleString()} Kz
              </button>
            </div>
          ) : isUnlockedForDownload ? (
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-6 py-2.5 rounded-xl font-display font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Baixar PDF Oficial
            </button>
          ) : isPendingPayment ? (
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="px-6 py-2.5 rounded-xl font-display font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-75"
            >
              <span className={`material-symbols-outlined text-[16px] ${checkingStatus ? 'animate-spin' : ''}`}>
                hourglass_top
              </span>
              {checkingStatus ? 'A verificar aprovação...' : 'Aguardando Aprovação (Verificar)'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="px-6 py-2.5 rounded-xl font-display font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer bg-primary hover:bg-primary/95 text-white"
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              Pagar {basePriceKz.toLocaleString()} Kz
            </button>
          )}
        </div>
      </div>

      {/* AI Suggestion Modal */}
      {showAIModal && (
        <Suspense fallback={<LoadingFallback message="A abrir Assistente IA..." minHeight="min-h-[150px]" />}>
          <AISuggestionModal
            mode={aiMode}
            currentText={
              aiMode === 'summary'
                ? resume.personalInfo.professionalSummary
                : activeExp?.description || ''
            }
            contextTitle={
              aiMode === 'summary'
                ? resume.personalInfo.professionalTitle
                : activeExp?.role || resume.personalInfo.professionalTitle
            }
            contextCompany={activeExp?.company || ''}
            onApply={handleApplyAIText}
            onApplySkills={handleApplyAISkills}
            onClose={() => setShowAIModal(false)}
          />
        </Suspense>
      )}

      {/* Passport Photo Studio Modal */}
      {showPhotoModal && (
        <Suspense fallback={<LoadingFallback message="A carregar Estúdio de Foto..." minHeight="min-h-[150px]" />}>
          <PassportPhotoModal
            initialImage={resume.personalInfo.photoUrl}
            onApplyPhoto={(croppedPhotoUrl) => {
              updateResumeData((prev) => ({
                ...prev,
                personalInfo: {
                  ...prev.personalInfo,
                  photoUrl: croppedPhotoUrl,
                },
              }));
            }}
            onClose={() => setShowPhotoModal(false)}
          />
        </Suspense>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <Suspense fallback={<LoadingFallback message="A carregar Pagamento..." minHeight="min-h-[150px]" />}>
          <PaymentModal
            amount={basePriceKz}
            userName={resume.personalInfo.fullName || 'Candidato CV IA'}
            userEmail={resume.personalInfo.email || 'utilizador@email.ao'}
            templateName={templates.find((t) => t.id === resume.templateId)?.name || 'Lumina Modern'}
            onClose={() => setShowPaymentModal(false)}
            onPaymentSubmitted={(data) => {
              setResume((prev) => ({
                ...prev,
                isPaid: false,
                downloadsRemaining: 0,
                paymentStatus: 'pending',
                pendingTransactionId: data.txId,
                submittedPaymentMethod: data.method,
                submittedReference: data.referenceCode,
                rejectionReason: undefined,
              }));
              if (onPaymentSubmitted) {
                onPaymentSubmitted(data);
              }
              setShowPaymentModal(false);
            }}
            onPaymentSuccess={(method, txId) => {
              if (onPaymentSuccess) {
                onPaymentSuccess(method, txId);
              }
            }}
          />
        </Suspense>
      )}

      {/* Policy & Terms Modal */}
      {showPolicyModal && (
        <Suspense fallback={<LoadingFallback message="A carregar..." minHeight="min-h-[150px]" />}>
          <PolicyModal
            initialTab={policyInitialTab}
            onClose={() => setShowPolicyModal(false)}
          />
        </Suspense>
      )}

      {/* Onboarding Tour Modal */}
      {showOnboardingModal && (
        <Suspense fallback={null}>
          <CVOnboardingModal
            isOpen={showOnboardingModal}
            onClose={() => setShowOnboardingModal(false)}
          />
        </Suspense>
      )}
    </div>
  );
};
