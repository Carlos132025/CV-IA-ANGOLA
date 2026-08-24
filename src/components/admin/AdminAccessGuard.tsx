import React, { useState } from 'react';
import { AppUser } from '../../types';
import { Logo } from '../common/Logo';

interface AdminAccessGuardProps {
  currentUser: AppUser | null;
  onLoginAsAdmin: (user: AppUser) => void;
  onGoBackToHome: () => void;
  onSwitchUser: () => void;
  users: AppUser[];
}

export const AdminAccessGuard: React.FC<AdminAccessGuardProps> = ({
  currentUser,
  onLoginAsAdmin,
  onGoBackToHome,
  onSwitchUser,
  users,
}) => {
  const [email, setEmail] = useState('admin.prospekta@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    // Check if the email is strictly admin.prospekta@gmail.com
    if (cleanEmail !== 'admin.prospekta@gmail.com') {
      setErrorMsg('Acesso não autorizado. Apenas a conta admin.prospekta@gmail.com possui privilégios de administração.');
      return;
    }

    // Find in users database or auto-initialize
    let adminUser = users.find((u) => u.email?.toLowerCase().trim() === cleanEmail);

    if (!adminUser) {
      adminUser = {
        id: 'usr-admin-prospekta',
        name: 'Admin Prospekta',
        email: 'admin.prospekta@gmail.com',
        phone: '+244 923 845 779',
        password: password || 'admin.prospekta',
        role: 'admin',
        initials: 'AP',
        registrationDate: '01 Jan 2024',
        cvsGenerated: 0,
        status: 'Ativo',
      };
    }

    if (adminUser.status === 'Suspenso') {
      setErrorMsg('Esta conta de administrador está suspensa.');
      return;
    }

    // Success - direct login
    onLoginAsAdmin(adminUser);
  };

  const isNonAdminLoggedIn = Boolean(
    currentUser && currentUser.email?.toLowerCase().trim() !== 'admin.prospekta@gmail.com' && currentUser.role !== 'admin'
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-primary selection:text-white">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-radial from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl border border-surface-border shadow-2xl p-6 sm:p-8 relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-error-container text-error shadow-inner mx-auto mb-2">
            <span className="material-symbols-outlined text-[30px]">admin_panel_settings</span>
          </div>

          <div className="flex items-center justify-center py-1">
            <Logo variant="full" size="sm" showSubtitle={false} />
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-on-surface">
            {isNonAdminLoggedIn ? 'Acesso Não Autorizado' : 'Área Administrativa Restrita'}
          </h2>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isNonAdminLoggedIn
              ? 'A sua conta atual não possui permissões para gerir a plataforma. Esta área é restrita ao administrador oficial.'
              : 'Introduza as credenciais da conta de administrador para aceder ao painel de controlo.'}
          </p>
        </div>

        {/* If non-admin user is already logged in */}
        {isNonAdminLoggedIn && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-border text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Sessão Atual:</span>
                <span className="font-bold text-on-surface">{currentUser?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">E-mail / Contacto:</span>
                <span className="font-mono text-on-surface">{currentUser?.email || currentUser?.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Função:</span>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-on-surface-variant">
                  Utilizador Padrão
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-error-container/40 border border-error/30 text-xs text-on-error-container flex items-start gap-2.5">
              <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">block</span>
              <p className="leading-snug">
                Apenas <strong>admin.prospekta@gmail.com</strong> tem autorização para gerir transações, utilizadores e configurações do sistema.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onSwitchUser}
                className="w-full py-3.5 bg-primary text-white font-display font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">switch_account</span>
                <span>Terminar Sessão e Entrar como Administrador</span>
              </button>

              <button
                type="button"
                onClick={onGoBackToHome}
                className="w-full py-3 bg-surface-container-low hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-surface-border"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Voltar à Página Principal</span>
              </button>
            </div>
          </div>
        )}

        {/* If not logged in: direct Admin Login Form */}
        {!currentUser && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-error-container/40 border border-error/30 rounded-2xl flex items-center gap-2 text-xs text-on-error-container animate-in fade-in">
                <span className="material-symbols-outlined text-error text-[18px] shrink-0">error</span>
                <p className="leading-snug">{errorMsg}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                E-mail do Administrador
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.prospekta@gmail.com"
                  className="w-full bg-surface-container-low border border-surface-border rounded-xl pl-9 pr-3 py-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
                  required
                />
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">
                Apenas a conta registada <strong>admin.prospekta@gmail.com</strong> tem acesso.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Palavra-passe
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Palavra-passe de administrador"
                  className="w-full bg-surface-container-low border border-surface-border rounded-xl pl-9 pr-10 py-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-primary text-white font-display font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <span className="material-symbols-outlined text-[18px]">vpn_key</span>
              <span>Autenticar como Administrador</span>
            </button>

            <div className="pt-2 border-t border-surface-border flex items-center justify-between">
              <button
                type="button"
                onClick={onGoBackToHome}
                className="text-xs text-on-surface-variant hover:text-on-surface font-semibold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Voltar ao Site Principal</span>
              </button>

              <span className="text-[10px] text-on-surface-variant font-mono">
                Portão Seguro /admin
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
