import { Icon } from './Icon';
import React from 'react';

interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isAdmin?: boolean;
}

export const ConfirmLogoutModal: React.FC<ConfirmLogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Tens a certeza que queres sair?',
  description = 'A sua sessão será encerrada com segurança e os acessos serão finalizados.',
  confirmLabel = 'Sair',
  cancelLabel = 'Cancelar',
  isAdmin = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-surface-border animate-in zoom-in-95 duration-150 space-y-5 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon & Heading */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center shadow-inner">
            <Icon name="logout" className="text-[28px]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-display text-lg font-bold text-on-surface">
              {title}
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed px-2">
              {isAdmin
                ? 'A sua sessão administrativa de cv.ia.angola@gmail.com será encerrada com segurança.'
                : description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-surface-border bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Icon name="logout" className="text-[16px]" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
