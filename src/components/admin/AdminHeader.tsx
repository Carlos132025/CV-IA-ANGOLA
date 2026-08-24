import React from 'react';
import { AppUser } from '../../types';

interface AdminHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenUserApp: () => void;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  currentUser?: AppUser | null;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenUserApp,
  unreadCount = 3,
  onOpenNotifications,
  currentUser,
}) => {
  return (
    <header className="fixed top-0 left-72 right-0 h-20 bg-surface/85 backdrop-blur-xl z-40 flex items-center justify-between px-8 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-border/40">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
          menu_open
        </span>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input
            className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 w-72 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            placeholder="Pesquisar utilizador, transação, ID..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Switch to Client App button */}
        <button
          onClick={onOpenUserApp}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors border border-surface-border cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">public</span>
          <span>Ver Site Principal</span>
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low cursor-pointer"
          title="Notificações"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="h-8 w-[1px] bg-surface-border"></div>

        {/* Profile Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-sm font-semibold text-on-surface block">
              {currentUser?.name || 'Admin Prospekta'}
            </span>
            <span className="text-xs text-on-surface-variant block font-mono">
              {currentUser?.email || 'admin.prospekta@gmail.com'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {currentUser?.initials || 'AP'}
          </div>
        </div>
      </div>
    </header>
  );
};
