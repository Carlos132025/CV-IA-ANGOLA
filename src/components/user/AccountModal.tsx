import React, { useState } from 'react';
import { AppUser, ResumeData } from '../../types';
import { recordDeletionRequest, recordAuditLog } from '../../utils/security';
import { isStandalone, promptPWAInstall } from '../../utils/pwaManager';
import { PWAInstallModal } from '../common/PWAInstallModal';

interface AccountModalProps {
  isOpen?: boolean;
  user?: AppUser | null;
  resumeData?: ResumeData;
  onClose: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  onToast: (msg: string) => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenTerms?: () => void;
  onNavigateMyCVs?: () => void;
  onNavigateAdmin?: () => void;
  savedCVsCount?: number;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen = true,
  user,
  onClose,
  onLogout,
  onToast,
  onOpenPrivacyPolicy,
  onOpenTerms,
  onNavigateMyCVs,
  onNavigateAdmin,
  savedCVsCount = 0,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showPWAInstallModal, setShowPWAInstallModal] = useState(false);

  if (!isOpen || !user) {
    return null;
  }

  const handleRequestDataDeletion = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDelete(true);

    try {
      // Record official deletion request under Lei 22/11
      const req = recordDeletionRequest({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
        reason: deleteReason.trim() || 'Solicitação do utilizador nos termos do Direito à Eliminação (Lei 22/11).',
      });

      // Record Audit Log
      recordAuditLog({
        accessedBy: user.email,
        actorRole: 'Titular dos Dados',
        targetUserId: user.id,
        targetUserName: user.name,
        accessType: 'pedido_eliminacao',
        details: `Submetido pedido de eliminação de dados (ID: ${req.id}). Motivo: "${deleteReason || 'Não especificado'}".`,
      });

      setDeleteSuccess(true);
      onToast('Pedido de eliminação de dados submetido com sucesso à equipa administrativa (Lei 22/11).');
    } catch {
      onToast('Erro ao submeter pedido de eliminação. Tente novamente.');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-surface-border animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-display font-bold text-lg shadow-xs">
              {user.initials || 'AO'}
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-on-surface">
                {user.name}
              </h3>
              <p className="text-xs text-on-surface-variant">
                Conta de Utilizador &bull; Registada em {user.registrationDate || '2026'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-2 rounded-xl hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        {!showDeleteConfirm ? (
          <div className="py-5 space-y-5 text-xs sm:text-sm">
            {/* Admin Portal Quick Access if Admin */}
            {(user.role === 'admin' ||
              user.email?.toLowerCase().trim() === 'cv.ia.angola@gmail.com' ||
              user.email?.toLowerCase().trim() === 'admin.prospekta@gmail.com') && onNavigateAdmin && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px] text-amber-700">admin_panel_settings</span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs sm:text-sm text-amber-950">
                      Painel Administrativo
                    </h4>
                    <p className="text-[11px] text-amber-900/80">
                      Gerir pagamentos, vendas, utilizadores e modelos
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateAdmin();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold font-display shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Abrir Painel</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            )}

            {/* Quick Link to My CVs */}
            <div className="p-4 rounded-2xl bg-surface-container-high/60 border border-surface-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">folder_shared</span>
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs sm:text-sm text-on-surface">
                    Meus Currículos Arquivados
                  </h4>
                  <p className="text-[11px] text-on-surface-variant">
                    {savedCVsCount} {savedCVsCount === 1 ? 'currículo guardado' : 'currículos guardados'} na sua conta
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateMyCVs) onNavigateMyCVs();
                }}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold font-display shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Meus CVs</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* Account Details Card */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-border space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">E-mail:</span>
                <span className="font-mono font-bold text-on-surface">{user.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Telemóvel:</span>
                <span className="font-mono font-bold text-on-surface">{user.phone}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Estado da Conta:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  {user.status || 'Ativo'}
                </span>
              </div>
            </div>

            {/* Data Protection & Encryption Badge (Lei 22/11) */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Proteção de Dados Pessoais (Lei n.º 22/11)
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px] sm:text-xs">
                Todos os seus dados sensíveis (fotografia tipo passe, histórico profissional e comprovativos de pagamento) são armazenados sob <strong>encriptação em repouso</strong> e transmitidos via protocolo seguro <strong>HTTPS</strong>.
              </p>
              <div className="flex items-center gap-4 text-[11px] font-semibold text-primary pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
                  }}
                  className="hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">policy</span>
                  Política de Privacidade
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenTerms) onOpenTerms();
                  }}
                  className="hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">gavel</span>
                  Termos de Uso
                </button>
              </div>
            </div>

            {/* Retention Policy Note */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-[16px] text-amber-700">schedule</span>
                Política de Retenção de Dados
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Os dados do seu CV são mantidos enquanto mantiver a conta ativa para lhe permitir editar e descarregar o ficheiro. Pode solicitar a qualquer momento a eliminação integral dos seus dados.
              </p>
            </div>

            {/* PWA App Installation Option */}
            {!isStandalone() && (
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">install_mobile</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-blue-950">
                      Instalar no Ecrã Principal
                    </h5>
                    <p className="text-[11px] text-blue-800/80">
                      Acesso rápido como aplicação nativa PWA
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await promptPWAInstall();
                    if (res === 'manual_guide' || res === 'dismissed') {
                      setShowPWAInstallModal(true);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  Instalar
                </button>
              </div>
            )}

            {/* Right to be Forgotten / Delete Action */}
            <div className="pt-2 border-t border-surface-border flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 px-4 rounded-xl border border-error/30 bg-error-container/20 text-error hover:bg-error-container/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                Solicitar Eliminação dos Meus Dados (Lei 22/11)
              </button>
            </div>
          </div>
        ) : (
          <div className="py-5 space-y-4">
            {!deleteSuccess ? (
              <form onSubmit={handleRequestDataDeletion} className="space-y-4">
                <div className="p-4 rounded-2xl bg-error-container/20 border border-error/30 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-error font-bold text-sm">
                    <span className="material-symbols-outlined text-[20px]">warning</span>
                    Direito à Eliminação de Dados Pessoais
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    Em conformidade com a <strong>Lei n.º 22/11 da República de Angola</strong>, tem o direito de solicitar a eliminação definitiva de todos os seus dados pessoais, fotografias e histórico de currículos armazenados na plataforma.
                  </p>
                  <p className="text-slate-600 font-medium">
                    O seu pedido será encaminhado para processamento imediato pelo <strong>DPO da CV IA Angola (Chinua Ndembo, Lda)</strong>. Linha de apoio: <strong>957 427 090</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Motivo da solicitação (opcional):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ex: Já não necessito do serviço / Desejo expurgar os meus dados de contacto."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-border rounded-xl p-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2.5 rounded-xl border border-surface-border text-on-surface hover:bg-surface-container text-xs font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDelete}
                    className="px-5 py-2.5 rounded-xl bg-error text-white text-xs font-bold hover:bg-error/90 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingDelete ? (
                      <span>A submeter...</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        Confirmar e Enviar Pedido
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[24px]">check</span>
                </div>
                <h4 className="font-bold text-base text-emerald-900">
                  Pedido Registado com Sucesso!
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
                  O seu pedido de eliminação foi registado nos termos da Lei 22/11 e encaminhado com carimbo de auditoria para <strong>cv.ia.angola@gmail.com</strong>.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-all"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-surface-border flex items-center justify-between">
          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-bold text-error hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Terminar Sessão
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* PWA Install Guide Modal */}
      <PWAInstallModal
        isOpen={showPWAInstallModal}
        onClose={() => setShowPWAInstallModal(false)}
      />
    </div>
  );
};
