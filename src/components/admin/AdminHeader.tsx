import { Icon } from '../common/Icon';
import React from 'react';
import { AppUser } from '../../types';

interface AdminHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenUserApp: () => void;
  onNavigateMyCVs?: () => void;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  currentUser?: AppUser | null;
  onToggleMobileSidebar?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenUserApp,
  onNavigateMyCVs,
  unreadCount = 3,
  onOpenNotifications,
  currentUser,
  onToggleMobileSidebar,
}) => {
  return (
    <header className="fixed top-0 left-0 md:left-72 right-0 h-16 sm:h-20 bg-surface/90 backdrop-blur-xl z-40 flex items-center justify-between px-3 sm:px-6 md:px-8 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-border/40">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          id="admin-mobile-menu-toggle-btn"
          type="button"
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors cursor-pointer shrink-0"
          title="Abrir menu de navegação do Admin"
          aria-label="Abrir menu"
        >
          <Icon name="menu" className="text-[24px]" />
        </button>

        {/* Desktop Sidebar Toggle Icon */}
        <Icon name="menu_open" className="hidden md:inline-block text-on-surface-variant cursor-pointer hover:text-primary transition-colors" />

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm">
          <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant pointer-events-none">
            <Icon name="search" className="text-[18px] sm:text-[20px]" />
          </span>
          <input
            className="w-full bg-surface-container-low border border-transparent focus:border-primary/20 rounded-full py-1.5 sm:py-2 pl-9 sm:pl-10 pr-3 sm:pr-4 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            placeholder="Pesquisar..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Direct Meus CVs button */}
        {onNavigateMyCVs && (
          <button
            onClick={onNavigateMyCVs}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors border border-primary/20 cursor-pointer shadow-xs"
            title="Aceder à secção Meus CVs"
          >
            <Icon name="folder_shared" className="text-[17px]" />
            <span className="hidden xs:inline sm:inline">Meus CVs</span>
          </button>
        )}

        {/* Switch to Client App button */}
        <button
          onClick={onOpenUserApp}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors border border-surface-border cursor-pointer"
          title="Ver o site principal como utilizador"
        >
          <Icon name="public" className="text-[17px]" />
          <span className="hidden md:inline">Ver Site Principal</span>
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative text-on-surface-variant hover:text-primary transition-colors p-1.5 sm:p-2 rounded-full hover:bg-surface-container-low cursor-pointer"
          title="Notificações"
        >
          <Icon name="notifications" className="text-[20px] sm:text-[22px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-error text-white text-[9px] sm:text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="hidden sm:block h-6 sm:h-8 w-[1px] bg-surface-border"></div>

        {/* Profile Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:block text-right">
            <span className="text-xs font-semibold text-on-surface block leading-tight">
              {currentUser?.name || 'Admin CV IA Angola'}
            </span>
            <span className="text-[10px] text-on-surface-variant block font-mono leading-tight">
              {currentUser?.email || 'cv.ia.angola@gmail.com'}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-xs shrink-0" title={currentUser?.name || 'Admin'}>
            {currentUser?.initials || 'CV'}
          </div>
        </div>
      </div>
    </header>
  );
};
