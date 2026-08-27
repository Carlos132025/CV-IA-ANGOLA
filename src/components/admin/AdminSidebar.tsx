import React from 'react';
import { AdminTab, AppUser } from '../../types';
import { Logo } from '../common/Logo';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  pendingCount?: number;
  onExitAdmin?: () => void;
  onNavigateMyCVs?: () => void;
  currentUser?: AppUser | null;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount = 0,
  onExitAdmin,
  onNavigateMyCVs,
  currentUser,
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  const navItems: { id: AdminTab; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Visão Geral', icon: 'dashboard' },
    { id: 'pending-payments', label: 'Pagamentos Pendentes', icon: 'pending_actions', badge: pendingCount },
    { id: 'sales', label: 'Vendas & Histórico', icon: 'payments' },
    { id: 'users', label: 'Utilizadores', icon: 'group' },
    { id: 'templates', label: 'Modelos de CV', icon: 'description' },
    { id: 'audit', label: 'Auditoria & Lei 22/11', icon: 'security' },
    { id: 'settings', label: 'Configurações', icon: 'settings' },
    { id: 'support', label: 'Suporte', icon: 'support_agent' },
  ];

  const handleTabClick = (tabId: AdminTab) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Dimmed Backdrop Overlay */}
      {isOpenOnMobile && (
        <div
          id="admin-sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Overlay Drawer on Mobile, Fixed Sidebar on Desktop */}
      <aside
        id="admin-sidebar"
        className={`fixed left-0 top-0 h-full w-72 max-w-[85vw] bg-surface-container-lowest z-50 flex flex-col shadow-2xl md:shadow-[1px_0_8px_rgba(0,0,0,0.02)] border-r border-surface-border transition-transform duration-300 ease-in-out ${
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 sm:h-20 flex items-center justify-between px-5 border-b border-surface-border/40 shrink-0">
          <div className="flex flex-col gap-0.5">
            <Logo variant="full" size="sm" showSubtitle={false} />
            <span className="text-[9.5px] text-primary/80 font-bold uppercase tracking-wider pl-9">
              Painel Admin
            </span>
          </div>

          {/* Close Button on Mobile */}
          <button
            id="admin-sidebar-close-btn"
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            title="Fechar menu lateral"
            aria-label="Fechar menu"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4 sm:mt-6 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left font-medium text-sm cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[11px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin User Card & Exit Action */}
        <div className="p-4 border-t border-surface-border space-y-3 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
              {currentUser?.initials || 'AP'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">
                {currentUser?.name || 'Admin CV IA Angola'}
              </p>
              <p className="text-[11px] text-on-surface-variant truncate font-mono">
                {currentUser?.email || 'cv.ia.angola@gmail.com'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            {onNavigateMyCVs && (
              <button
                type="button"
                onClick={() => {
                  onCloseMobile?.();
                  onNavigateMyCVs();
                }}
                className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-primary/20"
              >
                <span className="material-symbols-outlined text-[16px]">folder_shared</span>
                <span>Aceder aos Meus CVs</span>
              </button>
            )}

            {onExitAdmin && (
              <button
                type="button"
                onClick={() => {
                  onCloseMobile?.();
                  onExitAdmin();
                }}
                className="w-full py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-surface-border"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Voltar à Landing Page</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
