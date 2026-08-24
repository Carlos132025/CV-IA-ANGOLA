import React, { useState } from 'react';
import { CVTemplate, ResumeData, AppUser } from '../../types';
import { CVPreviewDoc } from './CVPreviewDoc';
import { PaymentModal, SubmittedPaymentData } from './PaymentModal';
import { createNewEmptyResume } from '../../data/initialData';
import {
  checkIfCvHasUnpaidEdits,
  getPaidSnapshotAsResume,
  duplicateResumeForFamily,
} from '../../utils/cvHelpers';

interface MyCVsViewProps {
  resumes: ResumeData[];
  activeResumeId?: string;
  currentUser: AppUser | null;
  templates: CVTemplate[];
  basePriceKz: number;
  onSelectResume: (cv: ResumeData) => void;
  onCreateNewResume: (newCV: ResumeData) => void;
  onDuplicateResume: (cv: ResumeData) => void;
  onDeleteResume: (cvId: string) => void;
  onUpdateTitle: (cvId: string, newTitle: string) => void;
  onOpenAuth: (mode?: 'login' | 'register_input' | 'profile') => void;
  onPaymentSubmitted: (data: SubmittedPaymentData, targetCvId?: string) => void;
  onNavigateBuilder: () => void;
  onToast: (msg: string) => void;
}

export const MyCVsView: React.FC<MyCVsViewProps> = ({
  resumes,
  activeResumeId: _activeResumeId,
  currentUser,
  templates,
  basePriceKz,
  onSelectResume,
  onCreateNewResume,
  onDuplicateResume,
  onDeleteResume,
  onUpdateTitle,
  onOpenAuth,
  onPaymentSubmitted,
  onNavigateBuilder: _onNavigateBuilder,
  onToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'draft' | 'modified'>('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCVTitle, setNewCVTitle] = useState('');
  const [newCVPersonName, setNewCVPersonName] = useState('');
  const [newCVTemplateId, setNewCVTemplateId] = useState('lumina-modern');

  // Duplicate for family modal
  const [cvToDuplicate, setCvToDuplicate] = useState<ResumeData | null>(null);
  const [duplicatePersonName, setDuplicatePersonName] = useState('');
  const [duplicateTitle, setDuplicateTitle] = useState('');

  // Rename modal
  const [cvToRename, setCvToRename] = useState<ResumeData | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Delete modal
  const [cvToDelete, setCvToDelete] = useState<ResumeData | null>(null);

  // Payment modal from list
  const [cvToPay, setCvToPay] = useState<ResumeData | null>(null);

  // Print/Download Preview Modal state
  const [cvToDownload, setCvToDownload] = useState<ResumeData | null>(null);

  // If user is not logged in and has NO local resumes at all, prompt login
  if (!currentUser && (!resumes || resumes.length === 0)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-surface py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-inner">
          <span className="material-symbols-outlined text-[40px]">lock_person</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-on-surface tracking-tight mb-3">
          Aceda à sua Conta para ver os seus Currículos
        </h1>
        <p className="text-sm text-on-surface-variant max-w-md mb-8 leading-relaxed">
          Para gerir múltiplos currículos, histórico de pagamentos e efetuar re-downloads ilimitados sem custos, inicie sessão ou crie uma conta gratuita.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
          <button
            type="button"
            onClick={() => onOpenAuth('login')}
            className="w-full py-3 px-6 rounded-xl bg-primary hover:bg-primary/95 text-white font-display font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            Iniciar Sessão
          </button>
          <button
            type="button"
            onClick={() => onOpenAuth('register_input')}
            className="w-full py-3 px-6 rounded-xl bg-surface-container-high hover:bg-surface-container border border-surface-border text-on-surface font-display font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Criar Conta
          </button>
        </div>
      </div>
    );
  }

  // Filter list by current user & search
  const userFilteredCVs = resumes.filter((cv) => {
    // Search query filter
    const titleMatch = cv.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const nameMatch = cv.personalInfo.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = cv.personalInfo.professionalTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    if (searchQuery && !titleMatch && !nameMatch && !roleMatch) {
      return false;
    }

    const hasUnpaidEdits = checkIfCvHasUnpaidEdits(cv);
    const isPaid = (cv.isPaid || cv.paymentStatus === 'approved') && !hasUnpaidEdits;
    const isModifiedAfterPayment = Boolean(cv.paidSnapshot) && hasUnpaidEdits;
    const isPending = !isPaid && !isModifiedAfterPayment && (cv.paymentStatus === 'pending' || Boolean(cv.pendingTransactionId));
    const isDraft = !isPaid && !isModifiedAfterPayment && !isPending;

    if (filterStatus === 'paid') return isPaid;
    if (filterStatus === 'modified') return isModifiedAfterPayment;
    if (filterStatus === 'pending') return isPending;
    if (filterStatus === 'draft') return isDraft;

    return true;
  });

  const totalCount = resumes.length;
  const paidCount = resumes.filter((c) => (c.isPaid || c.paymentStatus === 'approved') && !checkIfCvHasUnpaidEdits(c)).length;
  const modifiedCount = resumes.filter((c) => Boolean(c.paidSnapshot) && checkIfCvHasUnpaidEdits(c)).length;
  const pendingCount = resumes.filter((c) => (c.paymentStatus === 'pending' || Boolean(c.pendingTransactionId)) && c.paymentStatus !== 'approved').length;
  const draftCount = totalCount - paidCount - modifiedCount - pendingCount;

  // Handle creating new CV
  const handleConfirmCreateCV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCVTitle.trim()) {
      onToast('Por favor dê um nome ou identificador ao currículo.');
      return;
    }

    const newCV = createNewEmptyResume(
      currentUser?.id || 'guest_user',
      newCVTitle.trim(),
      newCVTemplateId,
      newCVPersonName.trim()
    );

    onCreateNewResume(newCV);
    setShowCreateModal(false);
    setNewCVTitle('');
    setNewCVPersonName('');
    onToast(`Currículo "${newCV.title}" criado com sucesso!`);
  };

  // Handle duplicate for family
  const handleConfirmDuplicate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvToDuplicate) return;

    const duplicated = duplicateResumeForFamily(
      cvToDuplicate,
      duplicateTitle.trim() || `CV Familiar - ${duplicatePersonName.trim() || 'Novo'}`,
      duplicatePersonName.trim(),
      currentUser?.id || 'guest_user'
    );

    onDuplicateResume(duplicated);
    setCvToDuplicate(null);
    setDuplicatePersonName('');
    setDuplicateTitle('');
    onToast(`Novo currículo independente criado para "${duplicated.personalInfo.fullName || duplicated.title}". Exige pagamento de ${basePriceKz.toLocaleString()} Kz.`);
  };

  // Handle rename
  const handleConfirmRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvToRename || !renameInput.trim()) return;
    onUpdateTitle(cvToRename.id, renameInput.trim());
    setCvToRename(null);
    setRenameInput('');
    onToast('Nome do currículo atualizado.');
  };

  // Trigger print of specific version
  const handleTriggerPrint = (cv: ResumeData, useSnapshot: boolean = false) => {
    const targetDoc = useSnapshot && cv.paidSnapshot ? getPaidSnapshotAsResume(cv) : cv;
    setCvToDownload(targetDoc);

    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[30px]">
              folder_shared
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
              Meus Currículos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
            Conta de <strong>{currentUser.name}</strong> ({currentUser.email || currentUser.phone}). Gestão de currículos próprios e de familiares.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setNewCVTitle('');
              setNewCVPersonName(currentUser.name || '');
              setShowCreateModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-display font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Criar Novo CV</span>
          </button>
        </div>
      </div>

      {/* Regra de Negócio Banner */}
      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">gavel</span>
          </div>
          <div>
            <span className="font-bold text-on-surface block sm:inline">
              Política de Pagamento por CV ({basePriceKz.toLocaleString()} Kz):
            </span>{' '}
            <span className="text-on-surface-variant">
              Cada currículo criado (seu ou de familiares) exige o seu pagamento independente. Os currículos já pagos possuem <strong>re-download gratuito e vitalício</strong>. Alterações posteriores a um CV pago exigem novo pagamento para descarregar a nova versão.
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              filterStatus === 'paid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-surface-container-low text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Desbloqueados ({paidCount})
          </button>
          {modifiedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterStatus('modified')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                filterStatus === 'modified'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-surface-container-low text-amber-800 hover:bg-amber-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Editados ({modifiedCount})
            </button>
          )}
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              filterStatus === 'pending'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-surface-container-low text-blue-800 hover:bg-blue-50'
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Pendentes ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('draft')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              filterStatus === 'draft'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Rascunhos ({draftCount})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px] sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome, identificador ou cargo..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-border text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Grid of CVs */}
      {userFilteredCVs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-container-lowest border border-surface-border space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">folder_open</span>
          </div>
          <h3 className="font-display text-lg font-bold text-on-surface">
            Nenhum currículo encontrado
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            {searchQuery
              ? 'Não encontramos nenhum currículo com os termos pesquisados.'
              : 'Ainda não tem currículos nesta categoria. Crie o seu primeiro CV ou de um familiar agora mesmo!'}
          </p>
          <button
            type="button"
            onClick={() => {
              setNewCVTitle('');
              setNewCVPersonName(currentUser.name || '');
              setShowCreateModal(true);
            }}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold font-display shadow-md hover:bg-primary/95 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Criar Meu Primeiro CV
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userFilteredCVs.map((cv) => {
            const template = templates.find((t) => t.id === cv.templateId) || templates[0];
            const hasUnpaidEdits = checkIfCvHasUnpaidEdits(cv);
            const isFullyPaid = (cv.isPaid || cv.paymentStatus === 'approved') && !hasUnpaidEdits;
            const isModifiedAfterPayment = Boolean(cv.paidSnapshot) && hasUnpaidEdits;
            const isPending =
              !isFullyPaid &&
              !isModifiedAfterPayment &&
              (cv.paymentStatus === 'pending' || Boolean(cv.pendingTransactionId));

            return (
              <div
                key={cv.id}
                className={`rounded-3xl bg-surface-container-lowest border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                  isFullyPaid
                    ? 'border-emerald-200/90 shadow-xs'
                    : isModifiedAfterPayment
                    ? 'border-amber-300 shadow-xs ring-1 ring-amber-200'
                    : isPending
                    ? 'border-blue-200/90'
                    : 'border-surface-border'
                }`}
              >
                {/* Card Top Title & Status */}
                <div className="p-5 pb-3 border-b border-surface-border/60">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display font-bold text-base text-on-surface truncate">
                          {cv.title || 'Sem Título'}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setCvToRename(cv);
                            setRenameInput(cv.title);
                          }}
                          className="text-on-surface-variant hover:text-primary p-1 rounded-md transition-colors"
                          title="Renomear identificador do CV"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-on-surface-variant truncate">
                        Titular: <span className="font-semibold text-on-surface">{cv.personalInfo.fullName || 'Não preenchido'}</span>
                      </p>
                    </div>

                    {/* Status Pill */}
                    {isFullyPaid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex-shrink-0">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        Pago & Liberado
                      </span>
                    ) : isModifiedAfterPayment ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 flex-shrink-0">
                        <span className="material-symbols-outlined text-[12px]">published_with_changes</span>
                        Editado pós-pagamento
                      </span>
                    ) : isPending ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 flex-shrink-0">
                        <span className="material-symbols-outlined text-[12px]">hourglass_top</span>
                        Em Validação
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 flex-shrink-0">
                        <span className="material-symbols-outlined text-[12px]">edit_note</span>
                        Rascunho (Não Pago)
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3 flex-1">
                  {/* Candidate Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-surface-container flex items-center justify-center overflow-hidden border border-surface-border flex-shrink-0">
                      {cv.personalInfo.photoUrl ? (
                        <img
                          src={cv.personalInfo.photoUrl}
                          alt={cv.personalInfo.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant text-[22px]">
                          person
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">
                        {cv.personalInfo.professionalTitle || 'Cargo Profissional'}
                      </p>
                      <p className="text-[11px] text-on-surface-variant truncate">
                        {cv.personalInfo.location || 'Luanda, Angola'}
                      </p>
                    </div>
                  </div>

                  {/* Summary Badges */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-surface-container-low border border-surface-border">
                      <span className="text-on-surface-variant block text-[10px]">Modelo:</span>
                      <span className="font-semibold text-on-surface truncate block">
                        {template.name}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-surface-container-low border border-surface-border">
                      <span className="text-on-surface-variant block text-[10px]">Experiências:</span>
                      <span className="font-semibold text-on-surface">
                        {cv.experiences?.length || 0} registadas
                      </span>
                    </div>
                  </div>

                  {/* Specific Notice if Modified After Payment */}
                  {isModifiedAfterPayment && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-tight space-y-1">
                      <div className="flex items-center gap-1 font-bold">
                        <span className="material-symbols-outlined text-[14px] text-amber-700">info</span>
                        <span>Alterações não pagas detetadas</span>
                      </div>
                      <p className="text-amber-800 text-[10px]">
                        A versão anterior de <em>{cv.paidSnapshot?.paidAt}</em> continua disponível para re-download gratuito. Para descarregar o PDF com as novas alterações, é necessário pagar {basePriceKz.toLocaleString()} Kz.
                      </p>
                    </div>
                  )}

                  {/* Date stats */}
                  <div className="text-[11px] text-on-surface-variant space-y-0.5 pt-1 border-t border-surface-border/40">
                    <div className="flex items-center justify-between">
                      <span>Criado em:</span>
                      <span className="font-mono text-on-surface">{cv.createdAt || 'Recentemente'}</span>
                    </div>
                    {cv.paidSnapshot?.paidAt && (
                      <div className="flex items-center justify-between text-emerald-800">
                        <span>Pago em:</span>
                        <span className="font-mono">{cv.paidSnapshot.paidAt}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-surface-container-low/60 border-t border-surface-border flex flex-col gap-2">
                  {/* Primary Actions based on status */}
                  {isFullyPaid ? (
                    <button
                      type="button"
                      onClick={() => handleTriggerPrint(cv, false)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      Baixar PDF Oficial (Re-download Grátis)
                    </button>
                  ) : isModifiedAfterPayment ? (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setCvToPay(cv)}
                        className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-display font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">payments</span>
                        Pagar {basePriceKz.toLocaleString()} Kz (Nova Versão)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerPrint(cv, true)}
                        className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-display font-semibold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="Baixar a versão que já foi paga sem as edições recentes"
                      >
                        <span className="material-symbols-outlined text-[14px]">history</span>
                        Baixar Versão Paga Anterior (Grátis)
                      </button>
                    </div>
                  ) : isPending ? (
                    <button
                      type="button"
                      onClick={() => onSelectResume(cv)}
                      className="w-full py-2 px-4 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 font-display font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                      Aguardando Validação (Ver)
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectResume(cv)}
                        className="flex-1 py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container border border-surface-border text-on-surface font-display font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setCvToPay(cv)}
                        className="flex-1 py-2 px-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-display font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                        title={`Pagar ${basePriceKz.toLocaleString()} Kz para desbloquear download`}
                      >
                        <span className="material-symbols-outlined text-[15px]">payments</span>
                        Pagar {basePriceKz.toLocaleString()} Kz
                      </button>
                    </div>
                  )}

                  {/* Secondary Actions (Edit, Duplicate for Family, Delete) */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex items-center gap-1">
                      {isFullyPaid && (
                        <button
                          type="button"
                          onClick={() => onSelectResume(cv)}
                          className="px-2 py-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">edit</span>
                          Editar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setCvToDuplicate(cv);
                          setDuplicatePersonName('');
                          setDuplicateTitle(`CV Familiar - ${cv.title}`);
                        }}
                        className="px-2 py-1 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Duplicar estrutura para preencher CV de outro familiar"
                      >
                        <span className="material-symbols-outlined text-[13px]">family_restroom</span>
                        Duplicar p/ Familiar
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCvToDelete(cv)}
                      className="text-on-surface-variant/70 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar este currículo"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Criar Novo CV                                                      */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-surface-border animate-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface">
                  Criar Novo Currículo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmCreateCV} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Nome / Identificador do Currículo *
                </label>
                <input
                  type="text"
                  required
                  value={newCVTitle}
                  onChange={(e) => setNewCVTitle(e.target.value)}
                  placeholder="Ex: Carlos Amaral (Principal) ou CV da Minha Irmã"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-border text-xs text-on-surface focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Nome Completo do Titular (Candidato)
                </label>
                <input
                  type="text"
                  value={newCVPersonName}
                  onChange={(e) => setNewCVPersonName(e.target.value)}
                  placeholder="Ex: Maria Beatriz Amaral"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-border text-xs text-on-surface focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Modelo Inicial Recomendado
                </label>
                <select
                  value={newCVTemplateId}
                  onChange={(e) => setNewCVTemplateId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-border text-xs text-on-surface focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {templates.filter((t) => t.isActive).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-700 mt-0.5">info</span>
                <span>
                  Cada novo CV criado segue o fluxo completo de edição e pré-visualização, exigindo o seu próprio pagamento de <strong>{basePriceKz.toLocaleString()} Kz</strong> para desbloquear o download do PDF.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold font-display shadow-md cursor-pointer"
                >
                  Criar e Começar a Editar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Duplicar para Familiar                                             */}
      {/* ========================================================================= */}
      {cvToDuplicate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-surface-border animate-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">family_restroom</span>
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface">
                  Duplicar para Familiar
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCvToDuplicate(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmDuplicate} className="space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Esta funcionalidade copia a estrutura e formatação de <strong>"{cvToDuplicate.title}"</strong> para facilitar a criação rápida do currículo de um familiar ou amigo.
              </p>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Nome do Familiar / Novo Titular *
                </label>
                <input
                  type="text"
                  required
                  value={duplicatePersonName}
                  onChange={(e) => setDuplicatePersonName(e.target.value)}
                  placeholder="Ex: Maria Beatriz Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-border text-xs text-on-surface focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Identificador do Novo CV
                </label>
                <input
                  type="text"
                  value={duplicateTitle}
                  onChange={(e) => setDuplicateTitle(e.target.value)}
                  placeholder="Ex: CV da Minha Irmã (Contabilidade)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-border text-xs text-on-surface focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-[16px] text-amber-700">payments</span>
                  <span>Novo Pagamento Independente Obrigatório</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-tight">
                  O CV duplicado é registado como um <strong>novo rascunho independente</strong>. Não há CVs gratuitos para familiares: para poder descarregar este novo PDF, será necessário efetuar o pagamento correspondente de <strong>{basePriceKz.toLocaleString()} Kz</strong>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCvToDuplicate(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold font-display shadow-md cursor-pointer"
                >
                  Criar Cópia Independente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Renomear CV                                                        */}
      {/* ========================================================================= */}
      {cvToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-in zoom-in-95 duration-200 space-y-4">
            <h3 className="font-display text-base font-bold text-on-surface">
              Renomear Identificador do CV
            </h3>
            <form onSubmit={handleConfirmRename} className="space-y-4">
              <input
                type="text"
                required
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                placeholder="Nome do currículo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-border text-xs text-on-surface focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCvToRename(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold font-display shadow-xs cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Eliminar CV                                                        */}
      {/* ========================================================================= */}
      {cvToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-in zoom-in-95 duration-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>
            <div className="text-center">
              <h3 className="font-display text-base font-bold text-on-surface">
                Eliminar "{cvToDelete.title}"?
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Esta ação não pode ser desfeita. Se este CV já foi pago, perderá o acesso ao re-download deste arquivo.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCvToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteResume(cvToDelete.id);
                  setCvToDelete(null);
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold font-display shadow-xs cursor-pointer"
              >
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Pagamento de CV da Lista                                          */}
      {/* ========================================================================= */}
      {cvToPay && (
        <PaymentModal
          amount={basePriceKz}
          userName={cvToPay.personalInfo.fullName || currentUser.name || 'Candidato CV IA'}
          userEmail={cvToPay.personalInfo.email || currentUser.email || 'cliente@email.ao'}
          templateName={templates.find((t) => t.id === cvToPay.templateId)?.name || 'Lumina Modern'}
          onClose={() => setCvToPay(null)}
          onPaymentSubmitted={(data) => {
            onPaymentSubmitted(data, cvToPay.id);
            setCvToPay(null);
          }}
          onPaymentSuccess={() => {
            setCvToPay(null);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* HIDDEN PRINT CONTAINER FOR DIRECT RE-DOWNLOADS                             */}
      {/* ========================================================================= */}
      {cvToDownload && (
        <div className="hidden print:block fixed inset-0 z-[9999] bg-white">
          <CVPreviewDoc
            resumeData={cvToDownload}
            templates={templates}
            selectedTemplateId={cvToDownload.templateId}
            accentColor={cvToDownload.accentColor}
            showWatermark={false}
          />
        </div>
      )}
    </div>
  );
};
