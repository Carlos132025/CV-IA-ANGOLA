import { Icon } from './Icon';
import React from 'react';
import { isIOS, isStandalone, promptPWAInstall } from '../../utils/pwaManager';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const iOSDevice = isIOS();
  const alreadyInstalled = isStandalone();

  const handleNativeInstall = async () => {
    const result = await promptPWAInstall();
    if (result === 'accepted') {
      onClose();
    }
  };

  return (
    <div
      id="pwa-install-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="pwa-install-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col my-auto overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200"
      >
        {/* Fixed Header with App Branding */}
        <div className="shrink-0 relative bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 p-5 sm:p-6 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <Icon name="close" className="text-[20px]" />
          </button>

          {/* App Icon preview */}
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-xl p-2 sm:p-2.5 flex items-center justify-center mb-2.5 sm:mb-3 ring-4 ring-white/20">
            <img
              src="/icon.svg"
              alt="CV IA Angola Ícone"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <h3 className="text-lg sm:text-xl font-display font-bold tracking-tight">
            Instalar CV IA Angola
          </h3>
          <p className="text-xs text-blue-100 mt-1 max-w-xs mx-auto">
            Aceda mais rápido, sem barra de navegação e com desempenho instantâneo direto do seu ecrã inicial.
          </p>

          <div className="mt-2.5 sm:mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PWA Standalone Nativo
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/90 border border-white/15">
              Sem gastar memória
            </span>
          </div>
        </div>

        {/* Scrollable Content & Step by Step Guide */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white text-slate-800">
          {alreadyInstalled ? (
            <div className="text-center py-4 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <Icon name="check_circle" className="text-2xl" />
              </div>
              <h4 className="font-bold text-base text-slate-900">Aplicação já instalada!</h4>
              <p className="text-xs text-slate-600">
                O CV IA Angola já está instalado no seu dispositivo. Pode aceder através do ícone no seu ecrã principal.
              </p>
            </div>
          ) : iOSDevice ? (
            /* iOS Safari Instructions */
            <div className="space-y-3">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="apple" className="text-[16px]" />
                Como instalar no iPhone / iPad (Safari):
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    No navegador <strong>Safari</strong>, toque no botão de{' '}
                    <strong>Partilhar</strong>{' '}
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-white border border-slate-200 rounded text-primary font-bold shadow-xs">
                      <Icon name="ios_share" className="text-[14px]" />
                    </span>{' '}
                    na barra inferior.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    Deslize o menu para baixo e toque em{' '}
                    <strong className="text-slate-900">"Adicionar ao Ecrã Principal"</strong>{' '}
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-white border border-slate-200 rounded text-primary font-bold shadow-xs">
                      <Icon name="add_box" className="text-[14px]" />
                    </span>
                    .
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    Toque em <strong className="text-slate-900">"Adicionar"</strong> no canto superior direito para concluir.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Android Chrome / Desktop Instructions */
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Instale para ter acesso rápido aos seus currículos, notificações de aprovação de pagamento e navegação fluida em qualquer lugar.
              </p>

              <button
                type="button"
                onClick={handleNativeInstall}
                className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Icon name="install_mobile" className="text-[18px]" />
                Instalar Agora no Ecrã Principal
              </button>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-900 flex items-center gap-1">
                  <Icon name="info" className="text-[14px] text-blue-600" />
                  Instalação manual no Chrome (Android ou PC):
                </div>
                <p>
                  Toque no menu de <strong>três pontos (⋮)</strong> no topo do navegador e selecione <strong>"Instalar aplicação"</strong> ou <strong>"Adicionar ao ecrã inicial"</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Features Highlights */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <Icon name="bolt" className="text-primary text-[20px]" />
              <div className="text-[10px] font-bold mt-0.5 text-slate-800">Ultra Rápido</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <Icon name="offline_bolt" className="text-emerald-600 text-[20px]" />
              <div className="text-[10px] font-bold mt-0.5 text-slate-800">Cache Inteligente</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <Icon name="phone_iphone" className="text-amber-600 text-[20px]" />
              <div className="text-[10px] font-bold mt-0.5 text-slate-800">Ecrã Total</div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 bg-slate-50 px-5 sm:px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Versão PWA v1.0.0</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
