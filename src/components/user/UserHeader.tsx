import { Icon } from '../common/Icon';
import React, { useState, useEffect } from 'react';
import { AppUser, UserView } from '../../types';
import { subscribeInstallPrompt, promptPWAInstall, isStandalone } from '../../utils/pwaManager';
import { PWAInstallModal } from '../common/PWAInstallModal';
import { Logo } from '../common/Logo';

interface UserHeaderProps {
  currentView: UserView;
  setCurrentView: (view: UserView) => void;
  currentUser: AppUser | null;
  onOpenAuth: (mode?: 'login' | 'register_input' | 'profile') => void;
  onOpenAccountModal?: () => void;
  savedCVsCount?: number;
  onNavigateAdmin?: () => void;
  isSpecificAdmin?: boolean;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  currentView,
  setCurrentView,
  currentUser,
  onOpenAuth,
  onOpenAccountModal,
  savedCVsCount = 0,
  onNavigateAdmin,
  isSpecificAdmin = false,
}) => {
  const [showPWAInstallModal, setShowPWAInstallModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [standalone, setStandalone] = useState(() => isStandalone());

  useEffect(() => {
    const unsubscribe = subscribeInstallPrompt(() => {
      setStandalone(isStandalone());
    });
    return unsubscribe;
  }, []);

  // Automatically close mobile menu when user scrolls or resizes window to prevent sticky overlapping
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleCloseMenu = () => {
      setMobileMenuOpen(false);
    };
    window.addEventListener('scroll', handleCloseMenu, { passive: true });
    window.addEventListener('resize', handleCloseMenu, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleCloseMenu);
      window.removeEventListener('resize', handleCloseMenu);
    };
  }, [mobileMenuOpen]);

  const handleInstallClick = async () => {
    const outcome = await promptPWAInstall();
    if (outcome === 'manual_guide' || outcome === 'dismissed') {
      setShowPWAInstallModal(true);
    }
  };

  const handleNavClick = (view: UserView) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-b border-surface-border h-16 px-4 sm:px-8 shadow-xs">
      <div className="h-full flex items-center justify-between">
        {/* Brand Section */}
        <div
          id="user-header-brand"
          onClick={() => handleNavClick('home')}
          className="flex items-center cursor-pointer shrink-0 select-none group transition-transform active:scale-95"
        >
          <Logo variant="full" size="sm" showSubtitle={false} />
        </div>

        {/* Desktop Navigation Links */}
        <nav id="user-header-nav" className="hidden lg:flex items-center gap-1.5">
          {currentView === 'builder' ? (
            <button
              id="nav-back-to-home"
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
            >
              <Icon name="arrow_back" className="text-[16px]" />
              <span>Voltar à Página Principal</span>
            </button>
          ) : (
            <>
              <button
                id="nav-link-home"
                onClick={() => handleNavClick('home')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'home'
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                Início
              </button>

              <a
                id="nav-link-models"
                href="#modelos"
                onClick={() => {
                  if (currentView !== 'home') setCurrentView('home');
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
              >
                Modelos de CV
              </a>

              <a
                id="nav-link-how-it-works"
                href="#como-funciona"
                onClick={() => {
                  if (currentView !== 'home') setCurrentView('home');
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
              >
                Como Funciona
              </a>

              <button
                id="nav-link-reviews"
                onClick={() => handleNavClick('reviews')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  currentView === 'reviews'
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <Icon name="star" className="text-[15px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }} />
                <span>Avaliações</span>
              </button>

              <a
                id="nav-link-pricing"
                href="#precos"
                onClick={() => {
                  if (currentView !== 'home') setCurrentView('home');
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
              >
                Preço (2.000 Kz)
              </a>
            </>
          )}
        </nav>

        {/* User Account / Auth Actions */}
        <div id="user-header-actions" className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Desktop PWA Install Button */}
          {!standalone && (
            <button
              id="header-pwa-install-btn"
              type="button"
              onClick={handleInstallClick}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-xs group cursor-pointer"
              title="Instalar CV IA Angola no ecrã inicial"
            >
              <Icon name="install_mobile" className="text-[16px] text-blue-600 group-hover:scale-110 transition-transform" />
              <span>Instalar App</span>
            </button>
          )}

          {/* Desktop WhatsApp Support Direct Button */}
          <a
            id="header-whatsapp-support-btn"
            href="https://wa.me/244957427090?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20meu%20curr%C3%ADculo%20no%20CV%20IA%20Angola."
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-xs group"
            title="Linha Direta de Apoio WhatsApp: 957 427 090"
          >
            <svg className="w-4 h-4 text-emerald-600 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="font-mono">957 427 090</span>
          </a>

          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* Direct Admin Portal Button for authenticated admin */}
              {isSpecificAdmin && onNavigateAdmin && (
                <button
                  id="header-admin-portal-btn"
                  type="button"
                  onClick={onNavigateAdmin}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-900 font-bold text-xs shadow-xs transition-all cursor-pointer group"
                  title="Aceder ao Painel de Administração"
                >
                  <Icon name="admin_panel_settings" className="text-[16px] text-amber-600 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Painel Admin</span>
                </button>
              )}

              {/* Direct Meus CVs Button */}
              <button
                id="header-my-cvs-btn"
                type="button"
                onClick={() => handleNavClick('my-cvs')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'my-cvs'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface-container-low hover:bg-surface-container border-surface-border text-on-surface'
                }`}
              >
                <Icon name="folder_shared" className="text-[16px]" />
                <span className="hidden xs:inline">Meus CVs</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  currentView === 'my-cvs' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                }`}>
                  {savedCVsCount}
                </span>
              </button>

              {/* Account pill button */}
              <button
                id="user-account-btn"
                onClick={() => onOpenAccountModal ? onOpenAccountModal() : onOpenAuth('profile')}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl border border-surface-border bg-surface-container-low hover:bg-surface-container text-on-surface transition-all cursor-pointer"
                title="Aceder à Minha Conta e Dados Pessoais"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-lg object-cover ring-1 ring-primary/20 shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-primary text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                    {currentUser.initials || (currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'CV')}
                  </div>
                )}

                <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-[120px] hidden sm:inline">
                  {currentUser.name.split(' ')[0]}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="header-login-btn"
                onClick={() => onOpenAuth('login')}
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container transition-all cursor-pointer"
              >
                Entrar
              </button>

              <button
                id="header-register-btn"
                onClick={() => onOpenAuth('register_input')}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Icon name="person_add" className="text-[15px]" />
                <span>Cadastrar</span>
              </button>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Abrir Menu de Navegação"
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} className="text-[22px]" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu with Full Dimmed Backdrop Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop to prevent clicking on elements underneath and close on outside tap */}
          <div
            className="fixed inset-0 top-16 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="lg:hidden absolute top-16 left-0 right-0 bg-surface-container-lowest border-b border-surface-border shadow-2xl p-4 space-y-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Admin portal direct button for admin in mobile */}
            {isSpecificAdmin && onNavigateAdmin && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateAdmin();
                }}
                className="w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-500/30 shadow-xs transition-all cursor-pointer"
              >
                <Icon name="admin_panel_settings" className="text-[18px] text-amber-600" />
                <span>Aceder ao Painel Administrativo</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleNavClick('home')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  currentView === 'home' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface'
                }`}
              >
                <Icon name="home" className="text-[18px]" />
                Início
              </button>
              <button
                onClick={() => handleNavClick('reviews')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  currentView === 'reviews' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface'
                }`}
              >
                <Icon name="star" className="text-[18px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }} />
                Avaliações
              </button>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-surface-border/60">
              <a
                href="#modelos"
                onClick={() => {
                  if (currentView !== 'home') setCurrentView('home');
                  setMobileMenuOpen(false);
                }}
                className="block p-2 text-xs font-semibold text-on-surface hover:bg-surface-container rounded-lg"
              >
                Modelos de CV Aprovados
              </a>
              <a
                href="#como-funciona"
                onClick={() => {
                  if (currentView !== 'home') setCurrentView('home');
                  setMobileMenuOpen(false);
                }}
                className="block p-2 text-xs font-semibold text-on-surface hover:bg-surface-container rounded-lg"
              >
                Como Funciona o Processo
              </a>
              <a
                href="#precos"
                onClick={() => {
                  if (currentView !== 'home') setCurrentView('home');
                  setMobileMenuOpen(false);
                }}
                className="block p-2 text-xs font-semibold text-on-surface hover:bg-surface-container rounded-lg"
              >
                Preço Único: 2.000 Kz
              </a>
            </div>

            <div className="pt-2 border-t border-surface-border/60 flex flex-col gap-2">
              {!standalone && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleInstallClick();
                  }}
                  className="w-full py-2.5 px-3 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-blue-200"
                >
                  <Icon name="install_mobile" className="text-[18px] text-blue-600" />
                  Instalar App no Telemóvel
                </button>
              )}

              <a
                href="https://wa.me/244957427090?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20meu%20curr%C3%ADculo%20no%20CV%20IA%20Angola."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-emerald-200"
              >
                <Icon name="support_agent" className="text-[18px] text-emerald-600" />
                Suporte WhatsApp: 957 427 090
              </a>

              {!currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="w-full py-2.5 px-3 bg-surface-container-high text-on-surface font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  <Icon name="login" className="text-[18px]" />
                  Já Tenho Conta (Entrar)
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* PWA Installation & Step by Step Guide Modal */}
      <PWAInstallModal
        isOpen={showPWAInstallModal}
        onClose={() => setShowPWAInstallModal(false)}
      />
    </header>
  );
};
